import React from "react";
export default function Navigation({ model }) {
    const { tabs } = model;
    return (<> <div className="bottom-navigation">
        {tabs.map((t, index1) => <React.Fragment key={t.id ?? t.label ?? t.name ?? index1}>
        <button className="navigation-tab" style={{ "background": t.bg, "color": t.color }} onClick={t.pick} type="button">
        <span className="navigation-3">{t.icon}</span>{t.label}{Boolean(t.badge) && <> 
            <span className="navigation-4">{t.badge}</span>
 </>}
        </button>
        </React.Fragment>)}
    </div> </>);
}
