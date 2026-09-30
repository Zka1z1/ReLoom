import React, {useId} from 'react';
import {STRAP_SLOTS} from '../emoji-drag.js';
/** Editable product diagram: a woven loop threaded through the white NFC plate. */
export default function StrapPreview({color,emojis,dragProps,activeSlot,draggingIndex,showSlots}) {
 const id=useId().replace(/:/g,'');
 const positions=STRAP_SLOTS;
 return <svg className="strap-preview" viewBox="0 0 340 330" role="group" aria-label={`${color.name} woven strap with ${emojis.length ? emojis.join(' ') : 'no patterns'} and a white NFC card`}>
   <defs>
    <linearGradient id={`${id}band`} x1="0" y1="0" x2="1" y2="1"><stop stopColor={color.dark}/><stop offset=".4" stopColor={color.hex}/><stop offset=".7" stopColor={color.hex}/><stop offset="1" stopColor={color.dark}/></linearGradient>
    <linearGradient id={`${id}card`} x2=".3" y2="1"><stop stopColor="#fff"/><stop offset="1" stopColor="#e9e9e7"/></linearGradient>
    <pattern id={`${id}weave`} width="3" height="3" patternUnits="userSpaceOnUse"><path d="M0 0H3M0 0V3" stroke="#fff" strokeWidth=".4" opacity=".22"/></pattern>
    <filter id={`${id}shadow`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="7"/></filter>
    <path id={`${id}loop`} d="M128 254 C93 254 65 245 66 215 C65 175 136 151 203 92 C219 81 214 69 218 53 M207 91 C212 130 258 167 265 207 C269 239 244 252 213 254"/>
   </defs>
   <ellipse cx="172" cy="287" rx="99" ry="14" fill="#232c35" opacity=".12" filter={`url(#${id}shadow)`}/>
   <path d="M211 69L211 29L239 22L238 67Z" fill={color.hex}/>
   <path d="M211 69L211 29L239 22L238 67Z" fill={`url(#${id}weave)`}/>
   <use href={`#${id}loop`} fill="none" stroke={color.dark} strokeWidth="34" strokeLinecap="butt" transform="translate(1 3)"/>
   <use href={`#${id}loop`} fill="none" stroke={`url(#${id}band)`} strokeWidth="31" strokeLinecap="butt"/>
   <use href={`#${id}loop`} fill="none" stroke={`url(#${id}weave)`} strokeWidth="31" strokeLinecap="butt"/>
   <rect x="204" y="61" width="35" height="17" rx="7" fill="#f4f4ef" stroke="#d0d1cd" transform="rotate(-8 221 70)"/>
   {positions.map(([x,y,angle],index)=><g key={index}>
    {showSlots&&<circle cx={x} cy={y} r="17" fill={activeSlot===index?'#fff9':'#ffffff22'} stroke="white" strokeDasharray={activeSlot===index?'0':'3 3'}/>}
    {emojis[index]&&<g className={dragProps?'strap-emoji':undefined} tabIndex={dragProps?0:undefined} role={dragProps?'button':undefined} aria-roledescription={dragProps?'draggable emoji':undefined} aria-label={dragProps?`Drag pattern ${index+1}: ${emojis[index]}`:undefined} {...dragProps?.({index})} style={{opacity:draggingIndex===index ? .25 : 1}}>
     <circle cx={x} cy={y} r="22" fill="transparent"/>
     <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize="21" transform={`rotate(${angle} ${x} ${y})`}>{emojis[index]}</text>
    </g>}
   </g>)}
   <g transform="rotate(5 169 253)">
     <rect x="112" y="222" width="115" height="63" rx="9" fill="#c6c9c9"/>
     <rect x="111" y="218" width="115" height="63" rx="9" fill={`url(#${id}card)`} stroke="#d7dadb"/>
     <rect x="118" y="232" width="7" height="33" rx="3" fill={color.dark}/><rect x="212" y="232" width="7" height="33" rx="3" fill={color.dark}/>
     <text x="167" y="240" textAnchor="middle" fontSize="14" fontWeight="600" fill="#393a3d" fontFamily="Georgia,serif">ReLoom</text>
     <path d="M158 249q-4 6 0 12m5-14q-6 8 0 16m12-14q4 6 0 12m-5-14q6 8 0 16" fill="none" stroke="#0088b0" strokeWidth="1.4" strokeLinecap="round"/>
   </g>
 </svg>;
}
