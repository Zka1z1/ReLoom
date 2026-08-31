import React from "react";
export default function MyItems({ model }) {
    const { cartEmpty, cartHasItems, cartList, cartSummary, cartTotal, checkout, goStore, isTags, itemTabs, myTags, noSaved, savedList, showCart, showDonated, showFavourites, tagsSummary } = model;
    return (<> {Boolean(isTags) && <> 
        <div className="rl-scroll myitems-1">
        <div>
        <div className="myitems-2">{"My items"}</div>
        <div className="myitems-3">{tagsSummary}</div>
        </div>
        <div className="myitems-4">
            {itemTabs.map((t, index9) => <React.Fragment key={t.id ?? t.label ?? t.name ?? index9}>
            <button className="myitems-5" style={{ "background": t.bg, "color": t.color }} onClick={t.pick} type="button">{t.label}</button>
            </React.Fragment>)}
        </div>
            {Boolean(showDonated) && <> 
            <div>
            <div className="myitems-6">{"passed on by you"}</div>
            <div className="myitems-7">
                {myTags.map((t, index10) => <React.Fragment key={t.id ?? t.label ?? t.name ?? index10}>
                <button className="myitems-8" onClick={t.open} type="button"><span className="rl-x myitems-9"></span><span className="myitems-10">{t.name}</span><span className="myitems-11">{String(t.id) + " \u00b7 " + String(t.meta)}</span></button>
                </React.Fragment>)}
            </div>
            </div>
 </>}
            {Boolean(showFavourites) && <> 
            <div>
            <div className="myitems-6">{"Favourites"}</div>
                {Boolean(noSaved) && <> 
                <div className="myitems-12">{"No favourites yet."}<br /><button className="myitems-13" onClick={goStore} type="button">{"Explore"}</button>{" and tap \u2606 on any piece you love."}</div>
 </>}
            <div className="myitems-14">
                {savedList.map((g, index11) => <React.Fragment key={g.id ?? g.label ?? g.name ?? index11}>
                <div className="myitems-15">
                <div className="rl-x myitems-16"></div>
                <div className="donation-40">
                <button className="myitems-17" onClick={g.open} type="button">{g.name}</button>
                <div className="myitems-18">{String(g.designer) + " \u00b7 " + String(g.price) + " \u00b7 \u2665 " + String(g.votes)}</div>
                </div>
                <button className="myitems-19" onClick={g.unsave} type="button">{"remove"}</button>
                </div>
                </React.Fragment>)}
            </div>
            </div>
 </>}
            {Boolean(showCart) && <> 
            <div>
            <div className="myitems-6">{cartSummary}</div>
                {Boolean(cartEmpty) && <> 
                <div className="myitems-12">{"Your cart is empty."}<br /><button className="myitems-13" onClick={goStore} type="button">{"Find"}</button>{" your next upcycled piece from our creators."}</div>
 </>}
            <div className="myitems-14">
                {cartList.map((c, index12) => <React.Fragment key={c.id ?? c.label ?? c.name ?? index12}>
                <div className="myitems-15">
                <div className="rl-x myitems-16"></div>
                <div className="donation-40"><div className="myitems-20">{c.name}</div><div className="myitems-18">{String(c.designer) + " \u00b7 " + String(c.charity)}</div></div>
                <div className="myitems-21">{c.price}</div>
                <button className="myitems-22" onClick={c.remove} type="button">{"\u2715"}</button>
                </div>
                </React.Fragment>)}
            </div>
                {Boolean(cartHasItems) && <> 
                <button className="myitems-23" onClick={checkout} type="button">{"Reserve cart \u00b7 " + String(cartTotal)}</button>
 </>}
            </div>
 </>}
        </div>
 </>} </>);
}
