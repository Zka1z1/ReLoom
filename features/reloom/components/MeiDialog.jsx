import React from "react";
export default function MeiDialog({ model }) {
    const { choices, closeDialog, dialogOpen, showChoices, skipTyping, typed, typing } = model;
    return (<> {Boolean(dialogOpen) && <> 
        <div className="mei-overlay">
        <div className="meidialog-2">
        <button className="meidialog-3" onClick={closeDialog} type="button">{"\u2715"}</button>
        <div className="meidialog-4">
        <div className="meidialog-5">{"M"}</div>
        <div>
        <div className="meidialog-6">{"Mei"}</div>
        <div className="meidialog-7">{"LOOM GUIDE \u00b7 RELOOM COMMUNITY"}</div>
        </div>
        </div>
        <div className="meidialog-8">{typed}<span className="meidialog-9">{"\u258c"}</span></div>
            {Boolean(showChoices) && <> 
            <div className="meidialog-10">
                {choices.map((c, index22) => <React.Fragment key={c.id ?? c.label ?? c.name ?? index22}>
                <button className="meidialog-11" onClick={c.pick} type="button">{c.label}</button>
                </React.Fragment>)}
            </div>
 </>}
            {Boolean(typing) && <> 
            <button className="meidialog-12" onClick={skipTyping} type="button">{"tap to skip \u25b8"}</button>
 </>}
        </div>
        </div>
 </>} </>);
}
