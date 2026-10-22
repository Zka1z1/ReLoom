import React,{useState} from 'react';
import SwipeActions from './SwipeActions.jsx';
import GarmentVisual from './GarmentVisual.jsx';

function FriendLetter({letter,model,open,onToggle}) {
 const [busy,setBusy]=useState(''),[error,setError]=useState('');
 const following=!!model.followed[letter.garment.id];
 async function act(kind){
  if(busy)return;setBusy(kind);setError('');
  try{if(kind==='follow')await model.followReceivedStory(letter.garment.id);else await model.deleteReceivedLetter(letter.id);onToggle(false);}
  catch(e){setError(e.message);}finally{setBusy('');}
 }
 return <article className="friend-letter-item" aria-label={`Invitation from ${letter.senderDisplayHandle||letter.senderHandle}`}>
  <SwipeActions className="letter-swipe-row" open={open} onToggle={onToggle} disabled={!!busy} onOpen={()=>model.openReceivedLetter(letter)} actions={<>
    <button type="button" className="letter-follow" tabIndex={open?0:-1} disabled={!open||!!busy||following||model.saving||!model.dataReady} onClick={()=>act('follow')}>{busy==='follow'?'Following…':following?'Following ✓':'Follow'}</button>
    <button type="button" className="letter-delete" tabIndex={open?0:-1} disabled={!open||!!busy} onClick={()=>act('delete')}>{busy==='delete'?'Deleting…':'Delete'}</button>
  </>}>
   {bindings=><button className={`received-letter-card ${letter.opened?'':'unread'}`} type="button" {...bindings}>
     <div className="received-letter-preview"><GarmentVisual id={letter.garment.id} name={letter.garment.name} src={letter.garment.photoUrl}/></div>
     <div><span className="received-letter-from">From @{letter.senderDisplayHandle||letter.senderHandle}</span><h2>{letter.garment.name}</h2><p>{letter.message||letter.donor.note}</p><span className="received-letter-open">Open invitation ↗ {!letter.opened&&<span className="letter-new-dot" aria-label="Unread"/>}</span></div>
   </button>}
  </SwipeActions>
  {error&&<p className="letter-action-error" role="alert">{error}</p>}
 </article>;
}
export default function FriendsLetters({model}) {
 const [openId,setOpenId]=useState(null);
 return <section className="received-letters" aria-label="Invitations from friends">
  {model.receivedLetters.map(letter=><FriendLetter key={letter.id} letter={letter} model={model} open={openId===letter.id} onToggle={open=>setOpenId(current=>open?letter.id:current===letter.id?null:current)}/>)}
  {!model.receivedLetters.length&&<div className="letters-empty"><span aria-hidden="true">✉</span><p>Your invitations will appear here.</p></div>}
 </section>;
}
