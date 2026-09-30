import React, {useRef,useState} from 'react';
import StrapPreview from './StrapPreview.jsx';
import {STRAP_SLOTS,dropEmoji} from '../emoji-drag.js';
export default function NfcDesigner({model}) {
 const n=model.nfc,product=useRef(null),trash=useRef(null),gesture=useRef(null);
 const [drag,setDrag]=useState(null),[notice,setNotice]=useState('');
 if(!n.isOpen)return null;
 const targetAt=(x,y)=>{
  const bin=trash.current?.getBoundingClientRect();
  if(bin&&x>=bin.left&&x<=bin.right&&y>=bin.top&&y<=bin.bottom)return 'remove';
  const svg=product.current?.querySelector('svg'),rect=svg?.getBoundingClientRect();if(!rect)return null;
  const scale=Math.min(rect.width/340,rect.height/330),left=rect.left+(rect.width-340*scale)/2,top=rect.top+(rect.height-330*scale)/2;
  let nearest=null,distance=32;
  STRAP_SLOTS.forEach(([sx,sy],i)=>{const d=Math.hypot((x-left)/scale-sx,(y-top)/scale-sy);if(d<distance){distance=d;nearest=i;}});return nearest;
 };
 const start=(e,source)=>{
  if(!e.isPrimary||e.button!==0)return;e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);
  gesture.current={...source,id:e.pointerId,startX:e.clientX,startY:e.clientY,moved:false};
 };
 const move=e=>{
  const g=gesture.current;if(!g||g.id!==e.pointerId)return;
  e.preventDefault();
  if(Math.hypot(e.clientX-g.startX,e.clientY-g.startY)>6)g.moved=true;
  if(g.moved)setDrag({...g,x:e.clientX,y:e.clientY,target:targetAt(e.clientX,e.clientY)});
 };
 const cancel=()=>{gesture.current=null;setDrag(null);};
 const finish=e=>{
  const g=gesture.current;if(!g||g.id!==e.pointerId)return;
  if(g.moved){const next=dropEmoji(n.design.emojis,g,targetAt(e.clientX,e.clientY));if(JSON.stringify(next)!==JSON.stringify(n.design.emojis)){n.change({emojis:next});setNotice('Pattern updated');}}
  cancel();
 };
 const keyboard=(e,source)=>{
  if(e.key==='Escape'){cancel();return;}
  if(![' ','Enter','ArrowLeft','ArrowRight','Backspace'].includes(e.key))return;
  e.preventDefault();
  if(!drag?.keyboard){if(e.key===' '||e.key==='Enter'){setDrag({...source,keyboard:true,target:0});setNotice('Picked up. Use arrow keys to choose a position, Backspace for removal, Enter to drop, Escape to cancel.');}return;}
  if(e.key==='ArrowLeft'||e.key==='ArrowRight'){setDrag({...drag,target:Math.max(0,Math.min(5,(Number.isInteger(drag.target)?drag.target:0)+(e.key==='ArrowRight'?1:-1)))});return;}
  if(e.key==='Backspace'){setDrag({...drag,target:'remove'});return;}
  const next=dropEmoji(n.design.emojis,drag,drag.target);if(JSON.stringify(next)!==JSON.stringify(n.design.emojis))n.change({emojis:next});setNotice('Pattern updated');cancel();
 };
 const dragProps=source=>({onPointerDown:e=>start(e,source),onPointerMove:move,onPointerUp:finish,onPointerCancel:cancel,onLostPointerCapture:()=>{if(!drag?.keyboard)cancel();},onKeyDown:e=>keyboard(e,source)});
 return <section className="nfc-editor nfc-minimal" aria-label="DIY NFC strap">
  <div className="nfc-scroll">
   <header className="nfc-heading"><button type="button" aria-label="Close tag designer" onClick={n.close}>‹</button><h1>DIY your NFC strap</h1></header>
   <div ref={product} className={`nfc-product ${drag?'is-dragging':''}`}><StrapPreview color={n.color} emojis={n.design.emojis} dragProps={dragProps} activeSlot={drag?.target} draggingIndex={drag?.index} showSlots={!!drag}/></div>
   <div className="nfc-swatches" role="group" aria-label="Strap colour">{n.colors.map(c=><button type="button" key={c.id} aria-label={c.name} aria-pressed={n.design.color===c.id} onClick={()=>n.change({color:c.id})}><span style={{background:c.hex}}>{n.design.color===c.id?'✓':''}</span><span className="sr-only">{c.name}</span></button>)}</div>
   <div className="nfc-drag-tools">
    <p id="drag-hint">Drag to customise</p>
    <div className="nfc-emojis" aria-label="Emoji palette">{n.palette.map(p=><button type="button" className="nfc-drag-source" key={p.name} aria-label={`Drag ${p.name} onto strap`} aria-describedby="drag-hint" disabled={n.design.emojis.length>=6} {...dragProps({emoji:p.emoji})}>{p.emoji}</button>)}
    <div ref={trash} className={`nfc-drop-remove nfc-remove-tile ${drag?.target==='remove'?'is-over':''}`} aria-label="Drag here to remove"><span aria-hidden="true">⌫</span><span>Remove</span></div></div>
    <span className="sr-only" role="status">{notice}</span>
   </div>
   <section className="nfc-controls nfc-story-link"><label htmlFor="nfc-garment">Your stories</label><select id="nfc-garment" disabled={!n.garments.length} value={n.canBind?n.design.garmentId:''} onChange={e=>n.selectGarment(e.target.value)}>{!n.canBind&&<option value="">{n.garments.length?'Choose your story':'No stories yet'}</option>}{n.garments.map(g=><option value={g.id} key={g.id}>{g.name} · {g.designer}</option>)}</select><p className="nfc-story-eligibility">{n.garments.length?'Only garments you have participated in.':'Donate, vote or join a garment’s conversation first.'}</p><button type="button" className="nfc-preview-story" disabled={!n.canBind} onClick={n.preview}>Preview a tap ↗</button></section>
  </div>
  <footer className="nfc-save-bar">{n.error&&<div role="alert">{n.error}</div>}<button type="button" disabled={!n.canBind||n.saving} onClick={n.save}>{n.saving?'Saving…':n.saved?'Save changes':'Save design'}</button></footer>
  {drag&&!drag.keyboard&&<span className="nfc-drag-ghost" aria-hidden="true" style={{left:drag.x,top:drag.y}}>{drag.emoji||n.design.emojis[drag.index]}</span>}
 </section>;
}
