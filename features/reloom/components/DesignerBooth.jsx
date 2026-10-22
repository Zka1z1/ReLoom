import React from 'react';
import Modal from './Modal.jsx';
import GarmentVisual from './GarmentVisual.jsx';
import Icon from './Icon.jsx';
export default function DesignerBooth({model:m}){
 if(!m.boothOpen)return null;const b=m.booth;
 return <Modal label={`${b.designer} designer booth`} onClose={m.closeBooth}><header className="detail-toolbar"><span className="eyebrow">DESIGNER’S STUDIO</span><button type="button" className="icon-button" aria-label="Close designer booth" onClick={m.closeBooth}><Icon name="close"/></button></header><div className="rl-scroll modal-scroll"><div className="studio-hero"><img src="/assets/maker-process.png" alt="Illustrative textile maker’s studio"/></div><div className="studio-content"><div className="studio-profile"><span className="maker-monogram">{b.designer.slice(1,2)}</span><div><h1>{b.designer}</h1><p>{b.bio}</p></div></div><div className="studio-progress"><p className="eyebrow">ON THE WORKTABLE</p><p>{b.wip}</p><progress value={b.progress} max="100" aria-label="Work in progress"/><small>{b.progress}% complete · {b.eta}</small></div><h2>Reimagined pieces</h2><div className="studio-pieces">{b.pieces.map(p=><button type="button" key={p.id} onClick={p.open}><GarmentVisual id={p.id} name={p.name}/><strong>{p.name}</strong><span>{p.price} · ♥ {p.votes}</span></button>)}</div></div></div></Modal>;
}
