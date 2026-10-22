import React from 'react';
import StrapPreview from './StrapPreview.jsx';
import Icon from './Icon.jsx';
export default function MyTags({model}) {
 if(!model.isMyTags)return null;
 return <section className="rl-scroll myitems-1 mytags-page" aria-label="My tags">
  <h1 className="mytags-title">My tags</h1>
   <button className="tag-design-cta" type="button" onClick={()=>model.openNfc()} aria-label="Design an NFC tag"><span className="tag-design-icon" aria-hidden="true"><Icon name="mytags" size={24}/><span>✦</span></span><span className="tag-design-label">DIY tag</span><span className="tag-design-plus" aria-hidden="true">＋</span></button>
   {model.savedNfcTags.length>0&&<section className="my-nfc-tags" aria-label="Saved NFC tags">
    {model.savedNfcTags.map(t=><article className="my-nfc-card" key={t.garmentId}>
     <div className="my-nfc-preview"><StrapPreview color={t.color} emojis={t.emojis}/></div>
     <div className="my-nfc-details"><h3>{t.name}</h3><p>{t.color.name}{!t.canEdit?' · Participate to edit':''}</p><div><button type="button" onClick={t.open}>View story</button>{t.canEdit&&<button type="button" onClick={t.edit}>Edit tag</button>}</div></div>
    </article>)}
   </section>}
   {!model.savedNfcTags.length&&<p className="mytags-empty">No tags yet. Save a DIY design to keep it here.</p>}
 </section>;
}
