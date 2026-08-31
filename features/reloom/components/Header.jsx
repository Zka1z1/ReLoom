import React from "react";
export default function Header({ model }) {
    const { headerSub, openDialog, openSearch } = model;
    return (<> <div className="app-header">
    <div className="header-title">
    <div className="brand-name">{"ReLoom"}</div>
    <div className="header-subtitle">{headerSub}</div>
    </div>
    <div className="header-actions">
    <button className="header-6" onClick={openSearch} aria-label={"Search"} type="button">{"\u2315"}</button>
    <button className="header-7" onClick={openDialog} aria-label={"Talk to Mei"} type="button">
    <span className="header-8">{"M"}<span className="header-9"></span></span>
    <span className="header-10"></span>
    </button>
    </div>
    </div> </>);
}
