import {database} from '../../../db';
import {CATALOG, CONDITIONS, SIZES, DROPS} from '../../../features/reloom/data.js';
import {projectRecords} from '../../../features/reloom/records.js';
import {validateDesign,canBindStory,participatingGarments} from '../../../features/reloom/nfc.js';
import {DONATIONS} from '../../../features/reloom/showroom.js';
import {chatUnreadCounts} from '../../../server/chat-unread';
import {chatSummaries} from '../../../server/chat-summary';
import {mailbox} from '../../../server/letters';
export const dynamic='force-dynamic';
const cookieName='reloom_visitor';
import {identity,ownerKey,reply,uuid,garmentExists,readLimited} from '../../../server/http';
async function snapshot(db:D1Database,owner:string) {
  const rows=await db.prepare('SELECT kind,id,data,created FROM reloom_records WHERE owner=? ORDER BY created DESC,id').bind(owner).all();
  // Discovery is shared; ownership, rewards and participation remain visitor-scoped.
  const published=await db.prepare("SELECT r.data,COALESCE(p.display_handle,p.handle) AS donor FROM reloom_records r LEFT JOIN reloom_profiles p ON p.owner=r.owner WHERE r.kind='donation' AND r.owner<>? AND COALESCE(json_extract(r.data,'$.visibility'),'public')='public' ORDER BY r.created DESC,r.id").bind(owner).all<{data:string;donor:string|null}>();
  const publicDonations=published.results.map(row=>({...JSON.parse(row.data),donor:row.donor?'@'+row.donor.replace(/^@/,''):'Previous wearer'}));
  const chat=await db.prepare('SELECT id,room,text,created FROM reloom_messages WHERE owner=? ORDER BY created DESC,id DESC').bind(owner).all<{id:string;room:string;text:string;created:string}>();
  const joined=await db.prepare("SELECT DISTINCT CASE WHEN substr(room,1,6)='intro:' THEN substr(room,7) ELSE room END AS room FROM reloom_reads WHERE owner=?").bind(owner).all<{room:string}>();
  const state=projectRecords([...rows.results,...chat.results.map(m=>({kind:'post',id:m.id,created:m.created,data:{garmentId:m.room,text:m.text,when:m.created,public:true}}))].sort((a,b)=>String(b.created||'').localeCompare(String(a.created||''))));
  const ids=[...new Set([...Object.keys(state.followed),...Object.keys(state.posts),...Object.keys(state.nfcDesigns),...joined.results.map(r=>r.room)])].filter(id=>![...CATALOG,...DONATIONS,...state.ownedDonations].some(g=>g.id===id));
  const sharedGarments=(await Promise.all(ids.map(id=>db.prepare("SELECT data FROM reloom_records WHERE kind='donation' AND id=? AND (owner=? OR COALESCE(json_extract(data,'$.visibility'),'public')='public') LIMIT 1").bind(id,owner).first<{data:string}>()))).filter(Boolean).map(row=>({...JSON.parse(row!.data),donor:'Previous wearer'}));
  const visible=new Set([...CATALOG,...DONATIONS,...state.ownedDonations,...sharedGarments].map(g=>g.id));
  const rooms=[...participatingGarments({...state,donations:[...state.ownedDonations,...DONATIONS],sharedGarments}).map(g=>g.id),...joined.results.map(r=>r.room).filter(id=>visible.has(id))];
  const [chatUnread,chatSummary,letters]=await Promise.all([
    chatUnreadCounts(db,owner,rooms),chatSummaries(db,[...visible]),mailbox(db,owner)
  ]);
  return {...state,publicDonations,sharedGarments,chatUnread,chatSummary,...letters};
}
export async function GET(request:Request) {
  try {
    const db=database(),story=new URL(request.url).searchParams.get('story');
    if(story) {
      const token=identity(request),viewer=token?await ownerKey(token):'';
      const row=await db.prepare("SELECT data FROM reloom_records WHERE kind='donation' AND id=? AND (owner=? OR COALESCE(json_extract(data,'$.visibility'),'public')='public') LIMIT 1").bind(story,viewer).first<{data:string}>();
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
    const raw=new TextDecoder().decode(await readLimited(request,20000));
    let action;try{action=JSON.parse(raw);}catch{return reply({error:'Invalid request'},400);}
    if(!action||typeof action!=='object')return reply({error:'Invalid request'},400);
    const db=database(),owner=await ownerKey(token),state=await snapshot(db,owner);
    let kind=action.type,id=action.id,value=action.value;
    const now=new Date().toISOString();
    if(kind==='follow') {
      if(typeof id!=='string'||id.length>100||!await garmentExists(db,id,owner)||typeof value?.active!=='boolean')return reply({error:'Invalid story follow'},400);
      value={active:value.active};
    }else if(kind==='vote') {
      if(!CATALOG.some(g=>g.id===id))return reply({error:'Unknown garment'},400);
      value={};
    }else if(kind==='donation') {
      if(typeof id!=='string'||!id.startsWith('dn-')||!uuid.test(id.slice(3))||!value||!CONDITIONS.includes(value.condition)||!SIZES.includes(value.size)||!DROPS.some(d=>d.label===value.drop)||typeof value.note!=='string'||value.note.length>2000)return reply({error:'Check your donation details.'},400);
      if(!uuid.test(value.photoId)||typeof value.name!=='string'||!value.name.trim()||value.name.length>100||typeof value.cat!=='string'||!value.cat.trim()||value.cat.length>40||typeof value.color!=='string'||value.color.length>60||typeof value.material!=='string'||value.material.length>100)return reply({error:'Add one photo and confirm the garment details.'},400);
      if(value.visibility!==undefined&&!['public','private'].includes(value.visibility))return reply({error:'Choose Public or Only me.'},400);
      const photo=await db.prepare('SELECT id FROM reloom_photos WHERE id=? AND owner=?').bind(value.photoId,owner).first();
      if(!photo)return reply({error:'This photo is unavailable. Please take another.'},400);
      value={id,visibility:value.visibility||'public',name:value.name.trim(),cat:value.cat.trim(),material:value.material.trim()||'Not confirmed',color:value.color.trim()||'Not confirmed',photoId:value.photoId,photoUrl:'/api/photos?id='+value.photoId,condition:value.condition,size:value.size,drop:value.drop,note:value.note,donor:'you',when:now};
    }else if(kind==='post') {
      if(!uuid.test(id)||!value||typeof value.garmentId!=='string'||!await garmentExists(db,value.garmentId,owner)||typeof value.text!=='string'||!value.text.trim()||value.text.length>2000)return reply({error:'Enter a message up to 2,000 characters.'},400);
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
    const sql=(kind==='design'||kind==='follow')?'INSERT INTO reloom_records(owner,kind,id,data,created) VALUES (?,?,?,?,?) ON CONFLICT(owner,kind,id) DO UPDATE SET data=excluded.data':'INSERT OR IGNORE INTO reloom_records(owner,kind,id,data,created) VALUES (?,?,?,?,?)';
    await db.prepare(sql).bind(owner,kind,id,JSON.stringify(value),now).run();
    return reply(await snapshot(db,owner));
  }catch(error){if(error instanceof Error&&error.message==='TOO_LARGE')return reply({error:'Request too large'},413);console.error('ReLoom save failed',error);return reply({error:'Unable to save. Your changes are still here; please retry.'},503);}
}
