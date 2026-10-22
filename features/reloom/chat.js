import {POSTS} from './data.js';

export async function chatRequest(room,action,before){
 const r=await fetch('/api/chat?room='+encodeURIComponent(room)+(before?'&before='+encodeURIComponent(before):''),{credentials:'same-origin',cache:'no-store',...(action?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({room,...action})}:{})});
 const body=await r.json();if(!r.ok)throw Error(body.error||'Chat is unavailable.');return body;
}

export async function markChatRead(room){
 const data=await chatRequest(room),latest=data.messages.at(-1);
 // Acknowledge the captured message only; messages arriving afterwards stay unread.
 const cursor=latest?latest.created+latest.id:(POSTS[room]?.length?'intro':null);
 return cursor?chatRequest(room,{type:'read',cursor}):data;
}
