import React from "react";
export default function Showroom({ model }) {
    const { addToCart, cartBg, cartColor, cartLabel, dotRef, floorRef, focusHeart, focusIsGarment, focusKicker, focusName, focusOpen, focusStar, focusVotes, isStore, joyDown, joyMove, joyRef, joyUp, knobRef, onDown, onMove, onUp, saveFocus, sprites, viewRef, voteFocus, walls, worldRef, zoneJumps } = model;
    return (<> {Boolean(isStore) && <> 
        <div className="showroom-viewport" ref={viewRef} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
        <div className="showroom-world" ref={worldRef}>
        <div className="showroom-floor" ref={floorRef}></div>
            {walls.map((w, index2) => <React.Fragment key={w.id ?? w.label ?? w.name ?? index2}>
            <div className="showroom-wall" ref={w.ref}></div>
            </React.Fragment>)}
            {sprites.map((s, index3) => <React.Fragment key={s.id ?? s.label ?? s.name ?? index3}>
            <div className="showroom-sprite" style={{ "cursor": s.cursor }} ref={s.ref} onClick={s.tap}>
                {Boolean(s.isSign) && <> 
                <div className="showroom-6">
                <div className="showroom-7">{s.name}</div>
                </div>
 </>}
                {Boolean(s.isBooth) && <> 
                <div className="showroom-8">
                <div className="showroom-9">
                <div className="rl-x showroom-10"></div>
                <div className="showroom-11">
                <div className="showroom-12">{s.name}</div>
                <div className="showroom-13">{s.sub}</div>
                </div>
                </div>
                <div className="rl-x showroom-14"></div>
                <div className="showroom-15">
                <div className="showroom-16">{"work in progress"}</div>
                <div className="showroom-17">{s.wip}</div>
                <div className="showroom-18"><div className="showroom-19" style={{ "width": String(s.progress) + "%" }}></div></div>
                </div>
                </div>
 </>}
                {Boolean(s.isFigure) && <> 
                <div className="showroom-20" style={{ "color": s.kickerColor }}>{s.kicker}</div>
                <div className="rl-x showroom-21">
                <span className="showroom-22">{s.figure}</span>
                    {Boolean(s.hasPosts) && <> 
                    <button className="showroom-23" onClick={s.postTap} type="button">{s.postsLabel}</button>
 </>}
                </div>
                <div className="showroom-24">
                <div className="showroom-25">{s.priceLabel}</div>
                </div>
 </>}
            </div>
            </React.Fragment>)}
        </div>
        <div className="showroom-26">
            {zoneJumps.map((z, index4) => <React.Fragment key={z.id ?? z.label ?? z.name ?? index4}>
            <button className="showroom-27" onClick={z.go} type="button">{z.label}</button>
            </React.Fragment>)}
        </div>
        <div className="showroom-28">
        <span className="showroom-29">{"map"}</span>
        <span className="showroom-30">{"top voted"}</span>
        <span className="showroom-31">{"booths"}</span>
        <span className="showroom-32">{"new"}</span>
        <div className="showroom-33" ref={dotRef}></div>
        </div>
        <div className="showroom-34" ref={joyRef} onPointerDown={joyDown} onPointerMove={joyMove} onPointerUp={joyUp} onPointerCancel={joyUp}>
        <span className="showroom-35">{"\u25b2"}</span>
        <span className="showroom-36">{"\u25bc"}</span>
        <span className="showroom-37">{"\u25c0"}</span>
        <span className="showroom-38">{"\u25b6"}</span>
        <div className="showroom-39" ref={knobRef}></div>
        </div>
            {Boolean(focusName) && <> 
            <div className="showroom-40">
            <div className="showroom-41">{focusKicker}</div>
            <button className="showroom-42" onClick={focusOpen} type="button">{focusName}</button>
                {Boolean(focusIsGarment) && <> 
                <div className="showroom-43">
                <button className="showroom-44" style={{ "background": cartBg, "color": cartColor }} onClick={addToCart} type="button">{cartLabel}</button>
                <button className="showroom-45" style={{ "border": "1.5px solid " + String(focusHeart.border), "background": focusHeart.bg, "color": focusHeart.color }} onClick={voteFocus} type="button"><span style={{ "animation": focusHeart.pop }}>{"\u2665"}</span>{focusVotes}</button>
                <button className="showroom-46" style={{ "border": "1.5px solid " + String(focusStar.border), "background": focusStar.bg, "color": focusStar.color }} onClick={saveFocus} type="button">{focusStar.icon}</button>
                </div>
 </>}
            </div>
 </>}
        </div>
 </>} </>);
}
