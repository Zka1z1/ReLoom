import {useSwipeEvents} from '../use-swipe-events.js';
import React,{useId,useRef,useState} from 'react';
import {createSwipeHandlers,SWIPE_ACTION_WIDTH} from '../swipe-actions.js';

export default function SwipeActions({open,onToggle,disabled=false,onOpen,actions,children,className=''}){
 const state=useRef({gesture:null,suppressClick:false}),front=useRef(null),actionsId=useId();
 const [dragX,setDragX]=useState(null);
 const handlers=createSwipeHandlers(state.current,{open,disabled,onToggle,onOpen,onDrag:setDragX});
 const bindings={...useSwipeEvents(handlers,front),disabled,'aria-expanded':open,'aria-controls':actionsId};
 return <div className={`swipe-row ${className}`} onKeyDown={e=>{if(e.key==='ArrowRight'||e.key==='Escape'){e.preventDefault();onToggle(false);front.current?.focus();}}}>
  <div className={`swipe-front ${dragX!==null?'is-dragging':''}`} style={{transform:`translateX(${dragX??(open?-SWIPE_ACTION_WIDTH:0)}px)`}}>{children(bindings)}</div>
  <div id={actionsId} className="swipe-actions" aria-hidden={!open}>{actions}</div>
 </div>;
}
