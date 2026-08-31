import React from "react";
export default function Threads({ model }) {
    const { isMessages, messageCards, noMessageCards } = model;
    return (<> {Boolean(isMessages) && <> 
        <div className="rl-scroll threads-1">
        <div><div className="myitems-2">{"Threads"}</div><div className="myitems-3">{"Share your\u00a0upcycling ideas here."}</div></div>
        {Boolean(noMessageCards) && <> <div className="threads-2">{"No threads yet. Open a garment and choose \u201cLeave a message\u201d to join in."}</div> </>}
        <div className="threads-3">
            {messageCards.map((m, index13) => <React.Fragment key={m.id ?? m.label ?? m.name ?? index13}>
            <button className="threads-4" onClick={m.open} type="button">
            <span className="rl-x threads-5"></span>
            <span className="donation-40"><span className="threads-6">{m.garment}</span><span className="threads-7">{m.text}</span><span className="threads-8">{m.when}</span></span>
            </button>
            </React.Fragment>)}
        </div>
        </div>
 </>} </>);
}
