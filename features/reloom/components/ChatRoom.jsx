import React,{useState,useEffect,useRef} from 'react';
import {POSTS} from '../data.js';
import Icon from './Icon.jsx';
import {preparePhoto,uploadPreparedPhoto} from '../photo.js';
import {useChatTimeline} from '../use-chat-timeline.js';
import {messageCursor} from '../chat-timeline.js';
export default function ChatRoom({room,onActivity,onUnread,privateNotes=[],initialDraft='',username='you'}) {
 const timeline=useChatTimeline(room,onUnread);
 const {messages,status,more}=timeline;
 const [error,setError]=useState(''),[draft,setDraft]=useState(initialDraft),[sending,setSending]=useState(false),[paging,setPaging]=useState(false);
 const [attachment,setAttachment]=useState(null),[preparing,setPreparing]=useState(false);
 const fileInput=useRef(null),selecting=useRef(false);
 useEffect(()=>()=>{if(attachment?.url)URL.revokeObjectURL(attachment.url);},[attachment]);
 const scroll=useRef(null),nearBottom=useRef(true),request=useRef(null),mounted=useRef(true),lastRead=useRef('');
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
 const markRead=async()=>{
  const latest=messages.at(-1);if(document.hidden||!nearBottom.current)return;
  const cursor=latest?messageCursor(latest):(POSTS[room]?.length?'intro':'');if(!cursor)return;if(lastRead.current===cursor)return;lastRead.current=cursor;
  try{await timeline.read(cursor);}
  catch{if(lastRead.current===cursor)lastRead.current='';}
 };
 useEffect(()=>{if(nearBottom.current&&scroll.current)scroll.current.scrollTop=scroll.current.scrollHeight;markRead();},[messages]);
 const choosePhoto=async e=>{
  const file=e.target.files?.[0];e.target.value='';if(!file||selecting.current)return;
  selecting.current=true;setPreparing(true);setError('');
  try{const blob=await preparePhoto(file);if(mounted.current)setAttachment({blob,url:URL.createObjectURL(blob)});}
  catch(e){if(mounted.current)setError(e.message);}finally{selecting.current=false;if(mounted.current)setPreparing(false);}
 };
 const send=async e=>{
  e.preventDefault();if((!draft.trim()&&!attachment)||sending||preparing)return;
  const text=draft.trim();
  if(!request.current||request.current.text!==text||request.current.attachment!==attachment)request.current={id:crypto.randomUUID(),text,attachment};
  const pending=request.current;setSending(true);setError('');
  try{
   if(attachment&&!pending.photoId)pending.photoId=(await uploadPreparedPhoto(attachment.blob,{chat:true})).id;
   if(!mounted.current)return;
   nearBottom.current=true;
   await timeline.update({type:'send',id:pending.id,text:pending.text,...(pending.photoId?{photoId:pending.photoId}:{})});
   if(!mounted.current)return;
   setDraft('');setAttachment(null);request.current=null;onActivity();
  }catch(e){if(mounted.current)setError(e.message);}finally{if(mounted.current)setSending(false);}
 };
 const older=async()=>{
  if(paging||!messages.length)return;
  setPaging(true);nearBottom.current=false;
  const height=scroll.current?.scrollHeight||0,top=scroll.current?.scrollTop||0;
  try{
   await timeline.older();
   if(mounted.current)requestAnimationFrame(()=>{if(scroll.current)scroll.current.scrollTop=top+scroll.current.scrollHeight-height;});
  }catch(e){if(mounted.current)setError(e.message);}
  finally{if(mounted.current)setPaging(false);}
 };
 const remove=async id=>{
  if(!window.confirm('Remove this message for everyone?'))return;
  try{await timeline.update({type:'delete',id});if(mounted.current)onActivity();}
  catch(e){if(mounted.current)setError(e.message);}
 };
 return <section className="chat-room" aria-label="Shared garment chat room">
  <div className="chat-scroll rl-scroll" ref={scroll} onScroll={()=>{const el=scroll.current;nearBottom.current=el.scrollHeight-el.scrollTop-el.clientHeight<90;if(nearBottom.current)markRead();}}>
   {more&&<button type="button" className="chat-older" disabled={paging} onClick={older}>{paging?'Loading…':'Earlier messages'}</button>}
   <div className="chat-messages" role="log" aria-label="Room messages" aria-live="polite" aria-relevant="additions text">{[...(POSTS[room]||[])].reverse().map((m,i)=><article key={'sample-'+i} className="chat-message"><header><strong>@{m.author.replace(/^@/,'')}</strong>{m.role&&<span>{m.role}</span>}</header><p>{m.text}</p></article>)}{[...privateNotes].reverse().map((m,i)=><article key={'private-'+i} className="chat-message mine"><header><strong>@{username.replace(/^@/,'')}</strong><span>Private note</span></header><p>{m.text}</p></article>)}{messages.map(m=><article key={m.id} className={`chat-message ${m.mine?'mine':''}`}><header><strong>@{m.author.replace(/^@/,'')}</strong><time dateTime={m.created}>{new Date(m.created).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</time></header>{m.photoUrl&&<a href={m.photoUrl} target="_blank" rel="noreferrer" className="chat-photo-link" aria-label="Open shared photo"><img className="chat-photo" src={m.photoUrl} alt="Photo shared in the garment chat" onLoad={()=>{if(nearBottom.current&&scroll.current)scroll.current.scrollTop=scroll.current.scrollHeight;}}/></a>}{m.text&&<p>{m.text}</p>}{m.mine&&<button className="chat-delete" type="button" onClick={()=>remove(m.id)} aria-label="Remove your message">Remove</button>}</article>)}</div>
  </div>
  <form className="chat-composer" onSubmit={send}>
   {error&&<p role="alert">{error}</p>}
   {status==='offline'&&<button type="button" className="chat-retry" onClick={timeline.refresh}>Reconnect</button>}
   {attachment&&<div className="chat-attachment"><img src={attachment.url} alt="Photo ready to send"/><button type="button" aria-label="Remove selected photo" disabled={sending} onClick={()=>setAttachment(null)}><Icon name="close" size={16}/></button></div>}
   <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" hidden tabIndex={-1} aria-label="Choose a chat photo" onChange={choosePhoto}/>
   <div className="chat-compose-row">
    <input aria-label="Message the room" maxLength={2000} value={draft} disabled={sending} onChange={e=>setDraft(e.target.value)} placeholder="Message the room…"/>
    <button type="button" className="chat-action chat-add" aria-label={preparing?'Preparing photo':'Add photo'} disabled={sending||preparing} onClick={()=>fileInput.current?.click()}><Icon name="plus"/></button>
    <button type="submit" className="chat-action chat-send" aria-label={sending?'Sending message':'Send message'} aria-busy={sending} disabled={sending||preparing||(!draft.trim()&&!attachment)||status==='connecting'}><Icon name="send"/></button>
   </div>
  </form>
 </section>;
}
