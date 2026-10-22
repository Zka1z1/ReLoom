import {CATALOG} from '../features/reloom/data.js';
import {DONATIONS} from '../features/reloom/showroom.js';
export const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
export function identity(request:Request) {
 const token=request.headers.get('cookie')?.split(';').map(s=>s.trim()).find(s=>s.startsWith('reloom_visitor='))?.slice(15);
 return token&&uuid.test(token)?token:null;
}
export async function ownerKey(token:string) {
 return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token))),b=>b.toString(16).padStart(2,'0')).join('');
}
export function reply(value:unknown,status=200,cookie?:string) {
 return Response.json(value,{status,headers:{'Cache-Control':'no-store',...(cookie?{'Set-Cookie':cookie}:{})}});
}
export function sameOrigin(request:Request) {return request.headers.get('origin')===new URL(request.url).origin;}
export async function garmentExists(db:D1Database,id:string,owner='') {
 return [...CATALOG,...DONATIONS].some(g=>g.id===id)||!!await db.prepare("SELECT id FROM reloom_records WHERE kind='donation' AND id=? AND (owner=? OR COALESCE(json_extract(data,'$.visibility'),'public')='public') LIMIT 1").bind(id,owner).first();
}
export async function readLimited(request:Request,limit:number) {
 if(Number(request.headers.get('content-length')||0)>limit)throw new Error('TOO_LARGE');
 const reader=request.body?.getReader();if(!reader)return new Uint8Array();
 const chunks:Uint8Array[]=[];let size=0;
 for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>limit){await reader.cancel();throw new Error('TOO_LARGE');}chunks.push(value);}
 const result=new Uint8Array(size);let offset=0;for(const chunk of chunks){result.set(chunk,offset);offset+=chunk.length;}return result;
}
// Atomic fixed-window budgets: concurrent requests cannot exceed the limit.
export async function takeBudget(db:D1Database,owner:string,purpose:string,windowMs:number,limit:number) {
 const window=String(Math.floor(Date.now()/windowMs));
 const result=await db.prepare(`INSERT INTO reloom_limits(owner,purpose,window,count) VALUES (?,?,?,1)
 ON CONFLICT(owner,purpose) DO UPDATE SET window=excluded.window,count=CASE WHEN reloom_limits.window=excluded.window THEN reloom_limits.count+1 ELSE 1 END
 WHERE reloom_limits.window<>excluded.window OR reloom_limits.count<? RETURNING count`).bind(owner,purpose,window,limit).first();
 return !!result;
}
