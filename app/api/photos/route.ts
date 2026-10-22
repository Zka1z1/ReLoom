import {env} from 'cloudflare:workers';
import {database} from '../../../db';
import {analyseGarment} from '../../../server/garment-analysis';
import {identity,ownerKey,reply,sameOrigin,uuid,readLimited,takeBudget,garmentExists} from '../../../server/http';
export const dynamic='force-dynamic';
function bucket(){const value=(env as unknown as {BUCKET?:R2Bucket}).BUCKET;if(!value)throw Error('Photo storage unavailable');return value;}
export async function GET(request:Request) {
 const id=new URL(request.url).searchParams.get('id')||'';if(!uuid.test(id))return reply({error:'Photo not found'},404);
 try{
 const db=database(),photo=await db.prepare('SELECT owner FROM reloom_photos WHERE id=?').bind(id).first<{owner:string}>();
 if(!photo)return reply({error:'Photo not found'},404);
 const published=await db.prepare("SELECT id FROM reloom_records WHERE kind='donation' AND json_extract(data,'$.photoId')=? AND COALESCE(json_extract(data,'$.visibility'),'public')='public' LIMIT 1").bind(id).first();
 const token=identity(request),viewer=token?await ownerKey(token):'';
 if(!published&&photo.owner!==viewer){
  const links=await db.prepare('SELECT DISTINCT room FROM reloom_messages WHERE photo_id=?').bind(id).all<{room:string}>();
  let visible=false;
  for(const link of links.results){if(await garmentExists(db,link.room,viewer)){visible=true;break;}}
  if(!visible)return reply({error:'Photo not found'},404);
 }
 const object=await bucket().get('photos/'+id+'.jpg');if(!object)return reply({error:'Photo not found'},404);
 return new Response(object.body,{headers:{'Content-Type':'image/jpeg','X-Content-Type-Options':'nosniff','Cache-Control':'private, no-store','Content-Security-Policy':"default-src 'none'"}});
 }catch{return reply({error:'Unable to load photo'},503);}
}
export async function POST(request:Request) {
 if(!sameOrigin(request))return reply({error:'Invalid request origin'},403);
 const token=identity(request);if(!token)return reply({error:'Please reload before adding a photo.'},401);
 try{
 if(request.headers.get('content-type')!=='image/jpeg')return reply({error:'Please choose a supported photo.'},415);
 const bytes=await readLimited(request,3*1024*1024);
 if(bytes.length<20||bytes[0]!==255||bytes[1]!==216||bytes[2]!==255)return reply({error:'This is not a valid JPEG photo.'},415);
 const db=database(),owner=await ownerKey(token);
 if(!await takeBudget(db,owner,'upload-day',86400000,20)||!await takeBudget(db,'site','upload-day',86400000,300))return reply({error:'Daily photo limit reached. Please try again tomorrow.'},429);
 const id=crypto.randomUUID();await bucket().put('photos/'+id+'.jpg',bytes,{httpMetadata:{contentType:'image/jpeg'}});
 try{await db.prepare('INSERT INTO reloom_photos(id,owner,created) VALUES(?,?,?)').bind(id,owner,new Date().toISOString()).run();}
 catch(error){await bucket().delete('photos/'+id+'.jpg');throw error;}
 return reply({id,url:'/api/photos?id='+id,analysis:new URL(request.url).searchParams.get('purpose')==='chat'?{status:'skipped'}:await analyseGarment(bytes)});
 }catch(error){return reply({error:error instanceof Error&&error.message==='TOO_LARGE'?'Photo is too large. Please use a smaller image.':'Photo could not be saved. Please try again.'},error instanceof Error&&error.message==='TOO_LARGE'?413:503);}
}
export async function DELETE(request:Request) {
 if(!sameOrigin(request))return reply({error:'Invalid request origin'},403);
 const token=identity(request);if(!token)return reply({error:'Please reload.'},401);
 const id=new URL(request.url).searchParams.get('id')||'';if(!uuid.test(id))return reply({error:'Invalid photo'},400);
 try{
 const db=database(),owner=await ownerKey(token);
 const photo=await db.prepare('SELECT id FROM reloom_photos WHERE id=? AND owner=?').bind(id,owner).first();
 if(!photo)return reply({error:'Photo not found'},404);
 const used=await db.prepare("SELECT id FROM reloom_records WHERE kind='donation' AND json_extract(data,'$.photoId')=? LIMIT 1").bind(id).first();
 const message=await db.prepare('SELECT id FROM reloom_messages WHERE photo_id=? LIMIT 1').bind(id).first();
 if(used||message)return reply({error:'This photo belongs to a saved garment or message.'},409);
 await bucket().delete('photos/'+id+'.jpg');await db.prepare('DELETE FROM reloom_photos WHERE id=? AND owner=?').bind(id,owner).run();return reply({ok:true});
 }catch{return reply({error:'Unable to remove photo'},503);}
}
