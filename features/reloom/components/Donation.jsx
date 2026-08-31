import React from "react";
export default function Donation({ model }) {
    const { addPhotos, askCondition, askDesc, askDrop, askSize, condition, conditionChips, desc, descAnswer, donateBack, donateComplete, donateName, drop, dropSpots, finishDonate, goStore, hasCondition, hasDescTurn, hasDrop, hasSize, isDonate, onDesc, onStep1, onStep2, photoShots, photosDone, size, sizeChips, step1Bg, step1Blocked, step1Cta, step2Bg, step2Blocked, step2Cta, toDrop, toStep2 } = model;
    return (<> {Boolean(isDonate) && <> 
        <div className="rl-scroll donation-1">
        <div className="donation-2">
        <button className="donation-3" onClick={donateBack} type="button">{"\u2190"}</button>
        <div className="donation-4">{"Pass on a piece"}</div>
        <button className="donation-5" onClick={goStore} type="button">{"\u2715"}</button>
        </div>
        <div className="donation-6">
            {Boolean(onStep1) && <> 
            <div className="donation-7"><div className="donation-8">{"Mei"}</div>{"First, let's snap a clear front, back and detail shot, like fabric tags or flaws. So our makers know exactly what they're working with."}</div>
            <div className="donation-9">
            <button className="donation-10" onClick={addPhotos} type="button">
            <span className="donation-11">{"\uff0b"}</span>
            <span className="donation-12">{"Add Photos"}</span>
            <span className="donation-13">{"Upload front, back,"}<br />{"and detail photos"}</span>
            </button>
            <div className="donation-14">
            <div className="rl-x donation-15"></div>
            <div className="donation-16">{donateName}</div>
            <div className="donation-17"></div>
            <div className="donation-18"></div>
            </div>
            </div>
                {Boolean(photosDone) && <> 
                <div className="donation-19">
                <div className="donation-20">{"3 photos uploaded"}</div>
                <div className="donation-21">
                    {photoShots.map((p, index5) => <React.Fragment key={p.id ?? p.label ?? p.name ?? index5}>
                    <div className="donation-22">
                    <div className="rl-x donation-23">
                    <span className="donation-24">{"\u2713"}</span>
                    </div>
                    <div className="donation-25">{p.label}</div>
                    </div>
                    </React.Fragment>)}
                </div>
                </div>
 </>}
            <button className="donation-26" style={{ "background": step1Bg }} onClick={toStep2} disabled={step1Blocked} type="button">{step1Cta}</button>
 </>}
            {Boolean(onStep2) && <> 
            <div className="donation-27">
            <div className="donation-28">{"Front, back, and detail photos uploaded."}</div>
            <div className="donation-7"><div className="donation-8">{"Mei"}</div>{"Photos received. What is the condition of this piece?"}</div>
            {Boolean(hasCondition) && <> <div className="donation-28">{condition}</div><div className="donation-29"><div className="donation-8">{"Mei"}</div>{"Thanks. What size is it?"}</div> </>}
            {Boolean(hasSize) && <> <div className="donation-28">{size}</div><div className="donation-29"><div className="donation-8">{"Mei"}</div>{"Anything you\u2019d like the next wearer to know?"}</div> </>}
            {Boolean(hasDescTurn) && <> <div className="donation-28">{descAnswer}</div><div className="donation-29"><div className="donation-8">{"Mei"}</div>{"Here are the closest drop-off options for you."}</div> </>}
            {Boolean(hasDrop) && <> <div className="donation-28">{drop}</div><div className="donation-29"><div className="donation-8">{"Mei"}</div>{"Perfect \u2014 your tag is ready to create."}</div> </>}
                {Boolean(askCondition) && <> 
                <div>
                <div className="donation-30">{"Condition"}</div>
                <div className="donation-31">
                    {conditionChips.map((c, index6) => <React.Fragment key={c.id ?? c.label ?? c.name ?? index6}>
                    <button className="donation-32" style={{ "border": "1.5px solid " + String(c.border), "background": c.bg, "color": c.color }} onClick={c.pick} type="button">{c.label}</button>
                    </React.Fragment>)}
                </div>
                </div>
 </>}
                {Boolean(askSize) && <> 
                <div>
                <div className="donation-30">{"Size"}</div>
                <div className="donation-31">
                    {sizeChips.map((c, index7) => <React.Fragment key={c.id ?? c.label ?? c.name ?? index7}>
                    <button className="donation-33" style={{ "border": "1.5px solid " + String(c.border), "background": c.bg, "color": c.color }} onClick={c.pick} type="button">{c.label}</button>
                    </React.Fragment>)}
                </div>
                </div>
 </>}
                {Boolean(askDesc) && <> 
                <div>
                <div className="donation-30">{"Anything you'd like to add"}</div>
                <div className="donation-34">{"Optional \u2014 where you wore it, what you hope it becomes."}</div>
                <textarea className="donation-35" value={desc} onChange={onDesc} placeholder={"Wore this through three winters in Melbourne\u2026"}></textarea>
                <button className="donation-36" onClick={toDrop} type="button">{"Continue"}</button>
                </div>
 </>}
                {Boolean(askDrop) && <> 
                <div>
                <div className="donation-30">{"Closest drop-off"}</div>
                <div className="donation-37">
                    {dropSpots.map((d, index8) => <React.Fragment key={d.id ?? d.label ?? d.name ?? index8}>
                    <button className="donation-38" style={{ "border": "1.5px solid " + String(d.border), "background": d.bg }} onClick={d.pick} type="button">
                    <span className="donation-39" style={{ "color": d.distColor }}>{d.dist}</span>
                    <span className="donation-40">
                    <span className="donation-41">{d.label}</span>
                    <span className="donation-42">{d.sub}</span>
                    </span>
                        {Boolean(d.recommended) && <> 
                        <span className="donation-43">{"nearest"}</span>
 </>}
                    </button>
                    </React.Fragment>)}
                </div>
                </div>
 </>}
                {Boolean(donateComplete) && <> 
                <button className="donation-44" style={{ "background": step2Bg }} onClick={finishDonate} disabled={step2Blocked} type="button">{step2Cta}</button>
 </>}
            </div>
 </>}
        </div>
        </div>
 </>} </>);
}
