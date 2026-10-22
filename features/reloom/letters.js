import {STORIES,DEFAULT_STORY} from './data.js';

export function donorLetter(garment) {
 const story=STORIES[garment.id]||DEFAULT_STORY;
 return {name:garment.note?'The original donor':story.donor.split(',')[0],note:garment.note||story.donorNote};
}
export function defaultLetterMessage(donor) {return `${donor.note}\n\nThank you for being part of its next chapter.\n\nWith care,\n${donor.name}`;}
export function defaultInvitationMessage(garment,profile) {
 const sender=profile?.displayHandle||profile?.handle;
 return `I'd love to hear your ideas for ${garment.name}. Take a look at its story and join me in the chat.\n\nWhat could its next chapter look like?${sender?`\n\n@${sender}`:''}`;
}
export function normalizeHandle(value) {return typeof value==='string'?value.trim().replace(/^@/,'').toLowerCase():'';}

export async function requestLetter(action) {
 const r=await fetch('/api/letters',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(action)});
 const data=await r.json();if(!r.ok)throw Error(data.error||'Unable to send. Please try again.');return data;
}
