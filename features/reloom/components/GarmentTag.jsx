import React from "react";
export default function GarmentTag({ model }) {
    const { closeTagView, isTagView, newTag, qr, saveTag, saveTagLabel } = model;
    return (<> {Boolean(isTagView) && <> 
        <div className="rl-scroll garmenttag-1">
        <div className="garmenttag-2"><button className="garmenttag-3" onClick={closeTagView} type="button">{"\u2715"}</button></div>
        <div>
        <div className="garmenttag-4">{"tag minted \u00b7 +40 loom pts"}</div>
        <div className="garmenttag-5">{"Digital Garment Tag"}</div>
        </div>
        <div className="garmenttag-6">
        <div className="garmenttag-7">
        <div className="rl-x garmenttag-8"></div>
        <div className="donation-40">
        <div className="garmenttag-9">{newTag.name}</div>
        <div className="garmenttag-10">{String(newTag.id) + " \u00b7 " + String(newTag.condition) + " \u00b7 size " + String(newTag.size)}</div>
        <div className="garmenttag-11">{"Drop-off: " + String(newTag.drop)}<br />{newTag.when}</div>
        </div>
        </div>
        <div className="garmenttag-12">
        <span className="garmenttag-13">{"15 kg"}</span>
        <span className="garmenttag-14">{"CO\u2082e saved by " + String(newTag.donor)}</span>
        </div>
        <div className="garmenttag-15">{qr}<div className="garmenttag-16">{"Scan the tag to unlock this garment's story \u2014 who passed it on, how it was upcycled, and the messages left along the way."}</div>
        </div>
        </div>
        <button className="garmenttag-17" onClick={saveTag} type="button">{saveTagLabel}</button>
        </div>
 </>} </>);
}
