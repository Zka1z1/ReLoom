import React,{useEffect,useState} from 'react';
import FriendsLetters from './FriendsLetters.jsx';
import StoryFeedCard from './StoryFeedCard.jsx';
export default function Threads({model}){
 const [openId,setOpenId]=useState(null);
 useEffect(()=>{setOpenId(null);},[model.isMessages,model.threads.filter]);
 useEffect(()=>{
  if(model.isMessages)model.refreshInbox();
 },[model.isMessages]);
 if(!model.isMessages)return null;
 const t=model.threads,unread=model.receivedLetters.filter(l=>!l.opened).length;
 return <section className="rl-scroll story-feed"><header className="screen-heading"><h1>Stories</h1></header>
 <div className="segmented" aria-label="Filter stories">{[['all','All stories',0],['mine','My',t.unread],['friends','Invitations',unread]].map(([id,label,count])=><button type="button" key={id} aria-pressed={t.filter===id} onClick={()=>t.setFilter(id)}>{label}{count>0&&<span className="chat-unread thread-unread" aria-label={`${count} unread ${id==='mine'?'chat messages':'invitations'}`} aria-live="polite">{count>99?'99+':count}</span>}</button>)}</div>
 {t.filter==='friends'?<FriendsLetters model={model}/>:<>
 {!t.cards.length&&<div className="empty-state"><h2>Your chapter starts here</h2><p>Participate in or follow a garment’s story to see it here.</p><button type="button" onClick={model.goStore}>Explore garments</button></div>}
 <div className="story-feed-cards">{t.cards.map(story=><StoryFeedCard key={story.id} story={story} model={model} open={openId===story.id} onToggle={open=>setOpenId(current=>open?story.id:current===story.id?null:current)}/>)}</div></>}</section>;
}
