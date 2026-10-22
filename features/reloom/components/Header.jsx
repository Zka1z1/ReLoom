import React from 'react';
export default function Header({model}){
 return <header className="app-header"><div className="header-title"><div className="brand-name">ReLoom<span className="brand-stitch" aria-hidden="true">✳</span></div><div className="header-subtitle">{model.headerSub}</div></div><button className="header-diy" onClick={model.startDonate} type="button">Start donating</button></header>;
}
