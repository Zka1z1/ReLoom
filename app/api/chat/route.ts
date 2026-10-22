import {database} from '../../../db';
import {chatUnreadCounts,introCount,introRoom} from '../../../server/chat-unread';
import {identity,ownerKey,reply,sameOrigin,uuid,garmentExists,readLimited,takeBudget} from '../../../server/http';
export const dynamic='force-dynamic';
async function roomState(db:D1Database,room:string,owner:string,before?:string) {
 const rows=await db.prepare('SELECT m.id,m.owner,m.text,m.photo_id,m.created,COALESCE(p.display_handle,p.handle) AS username FROM reloom_messages m LEFT JOIN reloom_profiles p ON p.owner=m.owner WHERE m.room=? AND (? IS NULL OR m.created || m.id < ?) ORDER BY m.created DESC,m.id DESC LIMIT 51').bind(room,before||null,before||null).all<{id:string;owner:string;text:string;photo_id:string|null;created:string;username:string|null}>();
 const people=await db.prepare('SELECT owner FROM reloom_presence WHERE room=? AND seen>? ORDER BY owner LIMIT 100').bind(room,new Date(Date.now()-45000).toISOString()).all<{owner:string}>();
 const messages=rows.results.slice(0,50).reverse().map(m=>({id:m.id,text:m.text,photoUrl:m.photo_id?'/api/photos?id='+m.photo_id:null,created:m.created,mine:m.owner===owner,author:'@'+(m.username||'member-'+m.owner.slice(0,6))}));
 const unread=await chatUnreadCounts(db,owner,[room]);
 const oldest=messages[0];
 return {unread:unread[room]||0,messages,more:rows.results.length>50,before:oldest?oldest.created+oldest.id:null,people:people.results.map(p=>({name:'Member '+p.owner.slice(0,6),mine:p.owner===owner})),me:'Member '+owner.slice(0,6)};
}
export async function GET(request:Request) {
 const token=identity(request);if(!token)return reply({error:'Please reload to join the room.'},401);
 try{
 const params=new URL(request.url).searchParams,room=params.get('room')||'',before=params.get('before')||undefined;
 const db=database(),owner=await ownerKey(token);if(room.length>100||!await garmentExists(db,room,owner))return reply({error:'Room not found'},404);
 if(before&&before.length>100)return reply({error:'Invalid cursor'},400);
 return reply(await roomState(db,room,owner,before));
 }catch{return reply({error:'Chat connection interrupted. Retrying…'},503);}
}
export async function POST(request:Request) {
 if(!sameOrigin(request))return reply({error:'Invalid request origin'},403);
 const token=identity(request);if(!token)return reply({error:'Please reload to join the room.'},401);
 try{
 const a=JSON.parse(new TextDecoder().decode(await readLimited(request,5000))),db=database(),owner=await ownerKey(token);
 if(!a||typeof a!=='object'||typeof a.room!=='string'||a.room.length>100||!await garmentExists(db,a.room,owner))return reply({error:'Room not found'},404);
 if(!['send','presence','leave','delete','read','unread'].includes(a.type))return reply({error:'Invalid action'},400);
 const now=new Date().toISOString();
 if(a.type==='unread'){
  // Reset only this visitor's room; keep every message and every other reader intact.
  await db.batch([
   db.prepare('INSERT INTO reloom_reads(owner,room,cursor) VALUES(?,?,?) ON CONFLICT(owner,room) DO UPDATE SET cursor=excluded.cursor').bind(owner,a.room,''),
   db.prepare('DELETE FROM reloom_reads WHERE owner=? AND room=?').bind(owner,introRoom(a.room))
  ]);
  return reply(await roomState(db,a.room,owner));
 }
 if(a.type==='read'){
  if(typeof a.cursor!=='string'||a.cursor.length>100)return reply({error:'Invalid read cursor'},400);
  const intro=introCount(a.room);
  const writes=[];
  if(a.cursor==='intro'){
   if(!intro)return reply({error:'Message not found'},400);
  }else{
   const seen=await db.prepare('SELECT id FROM reloom_messages WHERE room=? AND created || id=?').bind(a.room,a.cursor).first();
   if(!seen)return reply({error:'Message not found'},400);
   writes.push(db.prepare('INSERT INTO reloom_reads(owner,room,cursor) VALUES(?,?,?) ON CONFLICT(owner,room) DO UPDATE SET cursor=MAX(reloom_reads.cursor,excluded.cursor)').bind(owner,a.room,a.cursor));
  }
  if(intro)writes.push(db.prepare('INSERT OR IGNORE INTO reloom_reads(owner,room,cursor) VALUES(?,?,?)').bind(owner,introRoom(a.room),'read'));
  await db.batch(writes);
  return reply(await roomState(db,a.room,owner));
 }
 if(a.type==='leave'){await db.prepare('DELETE FROM reloom_presence WHERE owner=? AND room=?').bind(owner,a.room).run();return reply({ok:true});}
 if(a.type==='delete'){
  if(!uuid.test(a.id))return reply({error:'Invalid message'},400);
  const r=await db.prepare('DELETE FROM reloom_messages WHERE id=? AND owner=? AND room=? RETURNING id').bind(a.id,owner,a.room).first();
  if(!r)return reply({error:'You can only remove your own messages.'},403);
 }
 if(a.type==='send'){
  if(!uuid.test(a.id)||typeof a.text!=='string'||(!a.text.trim()&&!a.photoId)||a.text.length>2000||(a.photoId!==undefined&&!uuid.test(a.photoId)))return reply({error:'Add a photo or write a message up to 2,000 characters.'},400);
  const existing=await db.prepare('SELECT owner,room,text,photo_id FROM reloom_messages WHERE id=?').bind(a.id).first<{owner:string;room:string;text:string;photo_id:string|null}>();
  if(existing&&(existing.owner!==owner||existing.room!==a.room||existing.text!==a.text.trim()||existing.photo_id!==(a.photoId||null)))return reply({error:'Invalid message identity'},409);
  if(!existing){
   if(a.photoId&&!await db.prepare('SELECT id FROM reloom_photos WHERE id=? AND owner=?').bind(a.photoId,owner).first())return reply({error:'This photo is unavailable. Please choose another.'},400);
   if(!await takeBudget(db,owner,'chat',10000,5))return reply({error:'A little too fast. Try again in a few seconds.'},429);
   await db.prepare('INSERT OR IGNORE INTO reloom_messages(id,owner,room,text,photo_id,created) VALUES(?,?,?,?,?,?)').bind(a.id,owner,a.room,a.text.trim(),a.photoId||null,now).run();
  }
 }
 if(await takeBudget(db,owner,'presence',10000,1)){
  await db.batch([db.prepare('INSERT INTO reloom_presence(owner,room,seen) VALUES(?,?,?) ON CONFLICT(owner,room) DO UPDATE SET seen=excluded.seen').bind(owner,a.room,now),db.prepare('DELETE FROM reloom_presence WHERE seen<?').bind(new Date(Date.now()-120000).toISOString())]);
 }
 return reply(await roomState(db,a.room,owner));
 }catch(e){return reply({error:e instanceof Error&&e.message==='TOO_LARGE'?'Message too large':'Unable to update the room. Please retry.'},e instanceof SyntaxError?400:e instanceof Error&&e.message==='TOO_LARGE'?413:503);}
}
