import React,{useRef,useState} from 'react';
import {chatRequest,markChatRead} from '../chat.js';
import BeforeAfter from './BeforeAfter.jsx';
import SwipeActions from './SwipeActions.jsx';

export default function StoryFeedCard({story,model,open,onToggle}){
 const pending=useRef(false);
 const [busy,setBusy]=useState(''),[error,setError]=useState('');
 async function mark(kind){
  if(pending.current)return;
  pending.current=true;setBusy(kind);setError('');
  try{
   if(kind==='read')await markChatRead(story.id);
   else await chatRequest(story.id,{type:'unread'});
   if(!await model.refreshInbox())throw Error('Marked, but the list could not refresh. Please retry.');
   onToggle(false);
  }catch(e){setError(e.message);}finally{pending.current=false;setBusy('');}
 }
 return <article className="story-card-item" aria-label={story.name}>
  <SwipeActions className="story-swipe-row" open={open} onToggle={onToggle} disabled={!!busy} onOpen={story.open} actions={<>
   <button type="button" className="swipe-unread" tabIndex={open?0:-1} disabled={!open||!!busy||!model.dataReady} onClick={()=>mark('unread')}>{busy==='unread'?'Marking…':'Mark unread'}</button>
   <button type="button" className="swipe-read" tabIndex={open?0:-1} disabled={!open||!!busy||!model.dataReady} onClick={()=>mark('read')}>{busy==='read'?'Marking…':'Mark read'}</button>
  </>}>
   {bindings=><button type="button" className="story-feed-card" {...bindings}>
    {story.hasUnread&&<span className="comment-unread-dot" role="img" aria-label="Unread comments">🔴</span>}
    <BeforeAfter story={story} compact/>
    <div className="feed-card-copy">
     <p className="eyebrow">{story.mine?'YOU’RE PART OF THIS STORY':story.following?'FOLLOWING':story.featured?'SAVED STORY':'COMMUNITY STORY'}</p>
     <h2>{story.name}</h2>
     <div className="mini-journey"><span>Passed on</span><i/><span className={story.donated?'is-pending':''}>{story.donated?'Awaiting a maker':story.concept?'Design concept':'Reimagined'}</span></div>
     <blockquote>“{story.note}”</blockquote>
     <div className="feed-card-bottom"><span>{story.author}</span><span className="feed-card-comments">{story.comments} {story.comments===1?'comment':'comments'}</span></div>
    </div>
   </button>}
  </SwipeActions>
  {error&&<p className="letter-action-error" role="alert">{error}</p>}
 </article>;
}
