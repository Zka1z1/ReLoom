import {CATALOG} from '../features/reloom/data.js';
import {DONATIONS} from '../features/reloom/showroom.js';

export async function ensureProfile(db:D1Database,owner:string) {
 await db.prepare('INSERT OR IGNORE INTO reloom_profiles(owner,handle) VALUES(?,?)').bind(owner,'member-'+owner.slice(0,16)).run();
 const profile=await db.prepare("SELECT handle,COALESCE(display_handle,CASE WHEN handle='alex' THEN 'Alex' ELSE handle END) AS displayHandle FROM reloom_profiles WHERE owner=?").bind(owner).first<{handle:string;displayHandle:string}>();
 if(!profile)throw Error('Unable to create your username');
 return profile;
}
export async function publicLetterGarment(db:D1Database,id:string) {
 const sample=[...CATALOG,...DONATIONS].find(g=>g.id===id);if(sample)return sample;
 const row=await db.prepare("SELECT data FROM reloom_records WHERE kind='donation' AND id=? AND COALESCE(json_extract(data,'$.visibility'),'public')='public' LIMIT 1").bind(id).first<{data:string}>();
 return row?JSON.parse(row.data):null;
}
export async function mailbox(db:D1Database,owner:string) {
 const profile=await ensureProfile(db,owner);
 const rows=await db.prepare('SELECT id,garment_id,data,created,opened FROM reloom_letters WHERE recipient=? AND deleted=0 ORDER BY created DESC,id DESC LIMIT 100').bind(owner).all<{id:string;garment_id:string;data:string;created:string;opened:number}>();
 const receivedLetters=(await Promise.all(rows.results.map(async row=>{
  // Do not expose a story if its audience ever changes after delivery.
  if(!await publicLetterGarment(db,row.garment_id))return null;
  // Older letters may contain a tag snapshot; keep it out of the inbox response.
  const {design:_legacyDesign,...letter}=JSON.parse(row.data);
  return {...letter,id:row.id,created:row.created,opened:!!row.opened};
 }))).filter(Boolean);
 return {profile,receivedLetters};
}
