import {database} from '../../../db';
import {CATALOG, CONDITIONS, SIZES, DROPS} from '../../../features/reloom/data.js';
import {projectRecords} from '../../../features/reloom/records.js';
import {validateDesign,canBindStory} from '../../../features/reloom/nfc.js';
export const dynamic='force-dynamic';
const cookieName='reloom_visitor';
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
function identity(request:Request) {
  const token=request.headers.get('cookie')?.split(';').map(s=>s.trim()).find(s=>s.startsWith(cookieName+'='))?.slice(cookieName.length+1);
  return token&&uuid.test(token)?token:null;
}
async function ownerKey(token:string) {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token))),b=>b.toString(16).padStart(2,'0')).join('');
}
function reply(value:unknown,status=200,cookie?:string) {
  return Response.json(value,{status,headers:{'Cache-Control':'no-store',...(cookie?{'Set-Cookie':cookie}:{})}});
}
async function snapshot(db:D1Database,owner:string) {
  const rows=await db.prepare('SELECT kind,id,data FROM reloom_records WHERE owner=? ORDER BY created DESC,id').bind(owner).all();
  const state=projectRecords(rows.results);
  const ids=[...new Set([...Object.keys(state.posts),...Object.keys(state.nfcDesigns)])].filter(id=>!CATALOG.some(g=>g.id===id)&&!state.ownedDonations.some(g=>g.id===id));
  const sharedGarments=(await Promise.all(ids.map(id=>db.prepare("SELECT data FROM reloom_records WHERE kind='donation' AND id=? LIMIT 1").bind(id).first<{data:string}>()))).filter(Boolean).map(row=>({...JSON.parse(row!.data),donor:'Previous wearer'}));
  return {...state,sharedGarments};
}
async function garmentExists(db:D1Database,id:string) {
  return CATALOG.some(g=>g.id===id)||!!await db.prepare("SELECT id FROM reloom_records WHERE kind='donation' AND id=? LIMIT 1").bind(id).first();
}
export async function GET(request:Request) {
  try {
    const db=database(),story=new URL(request.url).searchParams.get('story');
    if(story) {
      const row=await db.prepare("SELECT data FROM reloom_records WHERE kind='donation' AND id=? LIMIT 1").bind(story).first<{data:string}>();
      return row?reply({garment:{...JSON.parse(row.data),donor:'Previous wearer'}}):reply({error:'Story not found'},404);
    }
    const previous=identity(request),token=previous||crypto.randomUUID();
    const cookie=previous?undefined:`${cookieName}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000${new URL(request.url).protocol==='https:'?'; Secure':''}`;
    return reply(await snapshot(db,await ownerKey(token)),200,cookie);
  }catch(error){console.error('ReLoom load failed',error);return reply({error:'Unable to load your items. Please retry.'},503);}
}
export async function POST(request:Request) {
  // All writes are scoped to an unguessable, HttpOnly visitor cookie; no owner ids from clients.
  const origin=request.headers.get('origin');
  if(!origin||origin!==new URL(request.url).origin)return reply({error:'Invalid request origin'},403);
  const token=identity(request);if(!token)return reply({error:'Please reload to reconnect your items.'},401);
  try {
    const raw=await request.text();if(raw.length>20000)return reply({error:'Request too large'},413);
    let action;try{action=JSON.parse(raw);}catch{return reply({error:'Invalid request'},400);}
    if(!action||typeof action!=='object')return reply({error:'Invalid request'},400);
    const db=database(),owner=await ownerKey(token),state=await snapshot(db,owner);
    let kind=action.type,id=action.id,value=action.value;
    const now=new Date().toISOString();
    if(kind==='vote') {
      if(!CATALOG.some(g=>g.id===id))return reply({error:'Unknown garment'},400);
      value={};
    }else if(kind==='donation') {
      if(typeof id!=='string'||!id.startsWith('dn-')||!uuid.test(id.slice(3))||!value||!CONDITIONS.includes(value.condition)||!SIZES.includes(value.size)||!DROPS.some(d=>d.label===value.drop)||typeof value.note!=='string'||value.note.length>2000)return reply({error:'Check your donation details.'},400);
      value={id,name:'Old Denim Jacket',cat:'Denim',material:'Denim',condition:value.condition,size:value.size,drop:value.drop,note:value.note,donor:'you',when:now};
    }else if(kind==='post') {
      if(!uuid.test(id)||!value||typeof value.garmentId!=='string'||!await garmentExists(db,value.garmentId)||typeof value.text!=='string'||!value.text.trim()||value.text.length>2000)return reply({error:'Enter a message up to 2,000 characters.'},400);
      value={garmentId:value.garmentId,text:value.text.trim(),attachment:typeof value.attachment?.name==='string'?{name:value.attachment.name.slice(0,200),kind:'image'}:null,replyTo:typeof value.replyTo==='string'?value.replyTo.slice(0,100):null,when:now};
    }else if(kind==='design') {
      const participation={...state,donations:state.ownedDonations};
      const valid=validateDesign(value,[...state.ownedDonations,...state.sharedGarments]);
      if(!valid||valid.garmentId!==id)return reply({error:'Invalid design'},400);
      if(!canBindStory(participation,id))return reply({error:'Choose a story you have participated in.'},403);
      value=valid;
    }else if(kind==='import') {
      // Preserve legacy designs, but never invent lost participation history.
      const entries=Object.entries(value||{}).slice(0,50).flatMap(([key,d])=>{const valid=validateDesign(d);return valid&&valid.garmentId===key&&canBindStory({...state,donations:state.ownedDonations},key)?[db.prepare("INSERT OR IGNORE INTO reloom_records(owner,kind,id,data,created) VALUES (?,'design',?,?,?)").bind(owner,key,JSON.stringify(valid),now)]:[];});
      if(entries.length)await db.batch(entries);
      return reply(await snapshot(db,owner));
    }else return reply({error:'Unknown action'},400);
    const sql=kind==='design'?'INSERT INTO reloom_records(owner,kind,id,data,created) VALUES (?,?,?,?,?) ON CONFLICT(owner,kind,id) DO UPDATE SET data=excluded.data':'INSERT OR IGNORE INTO reloom_records(owner,kind,id,data,created) VALUES (?,?,?,?,?)';
    await db.prepare(sql).bind(owner,kind,id,JSON.stringify(value),now).run();
    return reply(await snapshot(db,owner));
  }catch(error){console.error('ReLoom save failed',error);return reply({error:'Unable to save. Your changes are still here; please retry.'},503);}
}
