import React,{useEffect,useRef,useState} from 'react';
import Icon from './Icon.jsx';
import GarmentVisual from './GarmentVisual.jsx';
import {donorLetter,defaultLetterMessage,defaultInvitationMessage,normalizeHandle,requestLetter} from '../letters.js';

function Letter({model,garment,received}) {
 const [recipient,setRecipient]=useState(''),[status,setStatus]=useState('idle'),[error,setError]=useState('');
 const requestRef=useRef(null),busy=useRef(false),alive=useRef(true),screen=useRef(null);
 const donor=received?.donor||donorLetter(garment);
 const [message,setMessage]=useState(()=>received?(received.message||defaultLetterMessage(donor)):defaultInvitationMessage(garment,model.profile));
 const editor=useRef(null);
 useEffect(()=>{if(editor.current){editor.current.style.height='auto';editor.current.style.height=editor.current.scrollHeight+'px';}},[message]);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 useEffect(()=>{
  if(!received||received.opened)return;
  requestLetter({type:'read',id:received.id}).then(()=>{if(alive.current)model.letterRead(received.id);}).catch(()=>{});
 },[received?.id]);
 useEffect(()=>{
  if(status!=='sent')return;
  screen.current?.scrollTo({top:0,behavior:'instant'});
  const timer=setTimeout(()=>model.closeTagView(),3000);return()=>clearTimeout(timer);
 },[status]);
 async function send(event) {
  event.preventDefault();if(busy.current||status==='sent')return;
  const handle=normalizeHandle(recipient);if(!handle)return;
  const key=JSON.stringify([garment.id,handle,message]);
  if(requestRef.current?.key!==key)requestRef.current={key,id:crypto.randomUUID()};
  busy.current=true;setStatus('sending');setError('');
  try{
   await requestLetter({type:'send',id:requestRef.current.id,garmentId:garment.id,recipient:handle,message});
   if(alive.current)setStatus('sent');
  }catch(e){if(alive.current){setError(e.message);setStatus('idle');}}
  finally{busy.current=false;}
 }
 return <section ref={screen} className="rl-scroll story-letter-screen" aria-label={received?'Received invitation':'Invite'}>
  <header className={`letter-heading${received?' screen-heading':''}`}><button type="button" className="icon-button letter-close" aria-label="Close invitation" disabled={status==='sending'} onClick={model.closeTagView}><Icon name="close"/></button>{received?<h1>You’re invited</h1>:<span className="eyebrow">INVITE</span>}</header>
  <form onSubmit={send}>
   {received&&<p className="letter-address">From <strong>@{received.senderDisplayHandle||received.senderHandle}</strong></p>}
   <div className={`letter-stage ${status==='sent'?'is-sent':''}`}>
    <article className="letter-paper" aria-label="An invitation to explore this garment">
     <div className="letter-paper-top"><span>ReLoom</span></div>
     <div className="letter-garment"><GarmentVisual id={garment.id} name={garment.name} src={garment.photoUrl}/><div><span>THE PIECE</span><h2>{garment.name}</h2></div></div>
     {received?<p className="letter-salutation">Dear @{received.toDisplayHandle||received.toHandle},</p>:<label className="letter-recipient"><span>To</span><input aria-label="Recipient username" value={recipient} onChange={e=>{setRecipient(e.target.value);setError('');}} placeholder="@your_friend" autoComplete="off" autoCapitalize="none" spellCheck={false} maxLength={25} required disabled={status!=='idle'}/></label>}
     {received?<p className="letter-memory">{message}</p>:<textarea ref={editor} className="letter-memory letter-editor" aria-label="Invitation message" value={message} onChange={e=>{setMessage(e.target.value);setError('');}} maxLength={4000} required disabled={status!=='idle'} rows={8}/> }
     {!garment.id.startsWith('dn-')&&<small className="letter-sample">Sample garment story</small>}
    </article>
    <div className="sending-envelope" aria-hidden="true"><div className="envelope-flap"/><span>ReLoom ✧</span></div>
   </div>
   {error&&<p className="letter-error" role="alert">{error}</p>}
   {status==='sent'?<p className="letter-sent-message" role="status">Sent to @{normalizeHandle(recipient)} ✓</p>:received?<footer className="letter-actions"><button type="button" className="secondary-button" onClick={()=>model.openReceivedStory(garment.id)}>View story</button><button type="button" className="primary-button" onClick={()=>model.joinReceivedChat(garment.id)}>Join chat</button></footer>:<footer className="letter-actions"><button type="submit" className="primary-button" disabled={!message.trim()||!normalizeHandle(recipient)||status!=='idle'||!model.dataReady}>{status==='sending'?'Sending…':'Send'}</button></footer>}
  </form>
 </section>;
}
export default function GarmentTag({model}) {
 if(!model.isTagView)return null;
 const received=model.receivedLetter,garment=received?.garment||model.tag;
 if(!garment)return null;
 return <Letter key={received?.id||garment.id} model={model} garment={garment} received={received}/>;
}
