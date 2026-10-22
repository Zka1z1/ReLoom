import React from 'react';
import Icon from './Icon.jsx';
export default function Navigation({model}){
 return <nav className="bottom-navigation" aria-label="Main navigation">{model.tabs.map(t=>
  <button className={`navigation-tab ${t.key==='store'?'navigation-explore':''} ${t.active?'is-active':''}`} key={t.key} type="button" aria-current={t.active?'page':undefined} onClick={t.pick}>
   <span className="navigation-icon">
    {t.key==='welcome'?<img className="nav-mei" src="/assets/mei-guide.png" alt=""/>:<Icon name={t.key}/>}
    {t.badge>0&&<span className="navigation-unread" aria-label={`${t.badge} unread messages`} aria-live="polite">{t.badge>99?'99+':t.badge}</span>}
   </span>
   <span>{t.label}</span>
  </button>
 )}</nav>;
}
