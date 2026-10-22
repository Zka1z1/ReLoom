import {database} from '../../../db';
import {identity,ownerKey,reply,sameOrigin,uuid,readLimited,takeBudget} from '../../../server/http';
import {ensureProfile,publicLetterGarment} from '../../../server/letters';
import {donorLetter,normalizeHandle} from '../../../features/reloom/letters.js';
export const dynamic='force-dynamic';

export async function POST(request:Request) {
 if(!sameOrigin(request))return reply({error:'Invalid request origin'},403);
 const token=identity(request);if(!token)return reply({error:'Please reload to reconnect.'},401);
 try{
  const action=JSON.parse(new TextDecoder().decode(await readLimited(request,24000)));
  if(!action||typeof action!=='object')return reply({error:'Invalid request'},400);
  const db=database(),owner=await ownerKey(token),profile=await ensureProfile(db,owner);
  if(action.type==='profile'){
   const handle=normalizeHandle(action.handle),displayHandle=typeof action.handle==='string'?action.handle.trim().replace(/^@/,''):'';
   if(handle===profile.handle&&displayHandle===profile.displayHandle)return reply({profile});
   if(!/^[a-z][a-z0-9_-]{2,23}$/.test(handle)||handle.startsWith('member-'))return reply({error:'Use 3–24 letters, numbers, underscores or hyphens. Start with a letter.'},400);
   if(!await takeBudget(db,owner,'username',60000,5))return reply({error:'Please wait a minute before changing your username again.'},429);
   const taken=await db.prepare('SELECT owner FROM reloom_profiles WHERE handle=?').bind(handle).first();
   if(taken&&taken.owner!==owner)return reply({error:'That username is taken. Try another.'},409);
   try{await db.prepare('UPDATE reloom_profiles SET handle=?,display_handle=? WHERE owner=?').bind(handle,displayHandle,owner).run();}
   catch{return reply({error:'That username is taken. Try another.'},409);}
   return reply({profile:{handle,displayHandle}});
  }
  if(action.type==='delete'){
   if(!uuid.test(action.id))return reply({error:'Letter not found'},404);
   const row=await db.prepare('UPDATE reloom_letters SET deleted=1 WHERE id=? AND recipient=? RETURNING id').bind(action.id,owner).first();
   return row?reply({ok:true}):reply({error:'Letter not found'},404);
  }
  if(action.type==='read'){
   if(!uuid.test(action.id))return reply({error:'Letter not found'},404);
   const row=await db.prepare('UPDATE reloom_letters SET opened=1 WHERE id=? AND recipient=? AND deleted=0 RETURNING id').bind(action.id,owner).first();
   return row?reply({ok:true}):reply({error:'Letter not found'},404);
  }
  if(action.type!=='send'||!uuid.test(action.id)||typeof action.garmentId!=='string'||action.garmentId.length>100)return reply({error:'Invalid letter'},400);
  const recipientHandle=normalizeHandle(action.recipient);
  if(!/^[a-z][a-z0-9_-]{2,23}$/.test(recipientHandle))return reply({error:'Enter your friend’s ReLoom @username.'},400);
  if(action.message!==undefined&&(typeof action.message!=='string'||!action.message.trim()||action.message.length>4000))return reply({error:'Write a letter of up to 4,000 characters.'},400);
  const message=action.message??null;
  // An idempotency key may only repeat the exact same sender, recipient, story and message.
  const existing=await db.prepare('SELECT sender,garment_id,data FROM reloom_letters WHERE id=?').bind(action.id).first<{sender:string;garment_id:string;data:string}>();
  if(existing){
   if(existing.sender!==owner||existing.garment_id!==action.garmentId||JSON.parse(existing.data).toHandle!==recipientHandle||(JSON.parse(existing.data).message??null)!==message)return reply({error:'This letter has already been used. Please start a new letter.'},409);
   return reply({ok:true,id:action.id,recipient:recipientHandle});
  }
  if(!await takeBudget(db,owner,'letters',60000,10))return reply({error:'Please wait a minute before sending another letter.'},429);
  const recipient=await db.prepare('SELECT owner,handle,COALESCE(display_handle,handle) AS displayHandle FROM reloom_profiles WHERE handle=?').bind(recipientHandle).first<{owner:string;handle:string;displayHandle:string}>();
  if(!recipient)return reply({error:'User not found. Ask your friend to set their username with Mei.'},404);
  if(recipient.owner===owner)return reply({error:'Choose a friend’s username, rather than your own.'},400);
  const garment=await publicLetterGarment(db,action.garmentId);
  if(!garment)return reply({error:'This story is private or unavailable and cannot be sent.'},403);
  const data={garment:{id:garment.id,name:garment.name,photoUrl:garment.photoUrl||null},donor:donorLetter(garment),message,senderHandle:profile.handle,toHandle:recipient.handle,senderDisplayHandle:profile.displayHandle,toDisplayHandle:recipient.displayHandle};
  await db.prepare('INSERT OR IGNORE INTO reloom_letters(id,sender,recipient,garment_id,data,created) VALUES(?,?,?,?,?,?)').bind(action.id,owner,recipient.owner,garment.id,JSON.stringify(data),new Date().toISOString()).run();
  // Check the winning row as two concurrent requests may have reused the same id.
  const delivered=await db.prepare('SELECT sender,recipient,garment_id,data FROM reloom_letters WHERE id=?').bind(action.id).first<{sender:string;recipient:string;garment_id:string;data:string}>();
  if(delivered?.sender!==owner||delivered?.recipient!==recipient.owner||delivered?.garment_id!==garment.id||(JSON.parse(delivered.data).message??null)!==message)return reply({error:'Letter identity conflict. Please start a new letter.'},409);
  return reply({ok:true,id:action.id,recipient:recipient.handle});
 }catch(error){return reply({error:error instanceof SyntaxError?'Invalid request':error instanceof Error&&error.message==='TOO_LARGE'?'Letter request is too large':'Unable to send. Please try again.'},error instanceof SyntaxError?400:error instanceof Error&&error.message==='TOO_LARGE'?413:503);}
}
