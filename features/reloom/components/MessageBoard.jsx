import React,{useEffect,useState} from 'react';
import StoryJourney from './StoryJourney.jsx';
import Icon from './Icon.jsx';
import ChatRoom from './ChatRoom.jsx';
import {chatRequest} from '../chat.js';
export default function MessageBoard({model:m}){
 const [unread,setUnread]=useState(0),room=m.isBoard?m.chatRoom:null;
 const onUnread=count=>{setUnread(count);m.onChatUnread(count);};
 useEffect(()=>{setUnread(0);},[room]);
 useEffect(()=>{
  if(!room||m.boardTab==='notes')return;
  let cancelled=false,busy=false;
  const refresh=async()=>{if(document.hidden||busy)return;busy=true;try{const data=await chatRequest(room);if(!cancelled)onUnread(data.unread);}catch{}finally{busy=false;}};
  refresh();const timer=setInterval(refresh,3000);document.addEventListener('visibilitychange',refresh);
  return()=>{cancelled=true;clearInterval(timer);document.removeEventListener('visibilitychange',refresh);};
 },[room,m.boardTab]);
 if(!m.isBoard)return null;
 return <section className="thread-detail"><header className="detail-toolbar"><button type="button" className="icon-button" aria-label="Back to stories" onClick={m.closeBoard}><Icon name="back"/></button><div><strong>{m.boardTitle}</strong><span>The story continues</span></div></header>
 <div className="segmented" aria-label="Story view"><button type="button" aria-pressed={m.boardTab==='story'} onClick={()=>m.setBoardTab('story')}>Story</button><button type="button" aria-pressed={m.boardTab==='notes'} onClick={()=>m.setBoardTab('notes')}>Chat room{unread>0&&<span className="chat-unread" aria-label={`${unread} unread messages`}>{unread>99?'99+':unread}</span>}</button></div>
 {m.boardTab==='story'?<div className="rl-scroll thread-detail-scroll"><StoryJourney story={m.boardStory}/><button type="button" className="primary-button journey-join" onClick={m.boardShare}>Invite</button></div>:<ChatRoom key={m.chatRoom} room={m.chatRoom} onActivity={m.onChatActivity} onUnread={onUnread} privateNotes={m.boardPrivateNotes} initialDraft={m.chatDraft} username={m.profile?.displayHandle||m.profile?.handle||'you'}/>}
 </section>;
}
