import React, {useRef} from "react";

export default function Donation({ model }) {
    const camera=useRef(null),library=useRef(null);
    const takeFile=e=>{const file=e.target.files?.[0];e.target.value="";if(file)model.pickPhoto(file);};
    const { askCondition, askDesc, askDrop, askSize, condition, conditionChips, desc, descAnswer, donateBack, donateComplete, drop, dropSpots, finishDonate, goStore, hasCondition, hasDescTurn, hasDrop, hasSize, isDonate, onDesc, onStep1, onStep2, size, sizeChips, step1Blocked, step1Cta, step2Blocked, step2Cta, toDrop, toStep2 } = model;
    return (<> {Boolean(isDonate) && <>
        <div className="rl-scroll donation-1">
        <div className="donation-2">
        <button className="donation-3" onClick={donateBack} type="button">{"\u2190"}</button>
        <div className="donation-4">{"Pass on a piece"}</div>
        <button className="donation-5" onClick={goStore} type="button">{"\u2715"}</button>
        </div>
        <div className="donation-steps" aria-label="Donation progress"><span className="active">Photo</span><i/><span className={onStep2?"active":""}>Details</span><i/><span>Tag · optional</span></div><div className="donation-6">
            {Boolean(onStep1) && <>
            <div className="donation-7"><div className="donation-8"><img src="/assets/mei-guide.png" alt=""/>Mei</div>Let’s give your piece a new start. Got a photo?</div>
            <div className="single-photo-card">
             {model.photo?<img src={model.photo.url} alt="Your garment photo"/>:<div className="photo-empty"><p>Awaiting your photo</p></div>}
             <div className="photo-actions" title="If AI recognition is enabled, your photo is processed by OpenAI."><button type="button" onClick={()=>camera.current?.click()} disabled={model.photoBusy||!model.dataReady}>{model.photo?'Retake photo':'Take a photo'}</button><button type="button" onClick={()=>library.current?.click()} disabled={model.photoBusy||!model.dataReady}>Choose photo</button></div>
             <input ref={camera} type="file" accept="image/*" capture="environment" hidden onChange={takeFile}/><input ref={library} type="file" accept="image/*" hidden onChange={takeFile}/>
            </div>
            {model.photoBusy&&<p role="status" className="photo-status">Saving your photo…</p>}
            {model.photoError&&<p role="alert" className="photo-error">{model.photoError}</p>}
            {model.photo&&!model.photoBusy&&<section className="garment-name-turn">
             <div className="donation-7"><div className="donation-8"><img src="/assets/mei-guide.png" alt=""/>Mei</div><span id="donation-name-question">Lovely! What would you like to call this piece?</span></div>
             <input aria-labelledby="donation-name-question" maxLength={100} value={model.garmentDetails.name} onChange={e=>model.updateGarment('name',e.target.value)} placeholder="Give it a name"/>
            </section>}
            <div className="donation-visibility"><label><span>You can choose who sees your donation.</span><select aria-label="Donation visibility" value={model.donationVisibility} onChange={e=>model.setDonationVisibility(e.target.value)}><option value="public">Public</option><option value="private">Only me</option></select></label></div>
            {model.photo&&<button className="donation-26" onClick={toStep2} disabled={step1Blocked} type="button">{step1Cta}</button>}
 </>}
            {Boolean(onStep2) && <>
            <div className="donation-27"><div className="donation-visibility"><label>Visibility <select aria-label="Donation visibility" value={model.donationVisibility} onChange={e=>model.setDonationVisibility(e.target.value)}><option value="public">Public</option><option value="private">Only me</option></select></label></div>

            <div className="donation-7"><div className="donation-8"><img src="/assets/mei-guide.png" alt=""/>Mei</div>{"How’s your piece looking?"}</div>
            {Boolean(hasCondition) && <> <div className="donation-28">{condition}</div><div className="donation-29"><div className="donation-8"><img src="/assets/mei-guide.png" alt=""/>Mei</div>{"Lovely, thank you! What size is it?"}</div> </>}
            {Boolean(hasSize) && <> <div className="donation-28">{size}</div><div className="donation-29"><div className="donation-8"><img src="/assets/mei-guide.png" alt=""/>Mei</div>{"Any memories you’d like to pass on?"}</div> </>}
            {Boolean(hasDescTurn) && <> <div className="donation-28">{descAnswer}</div><div className="donation-29"><div className="donation-8"><img src="/assets/mei-guide.png" alt=""/>Mei</div>{"Where would you like to drop it off?"}</div> </>}
            {Boolean(hasDrop) && <> <div className="donation-28">{drop}</div><div className="donation-29"><div className="donation-8"><img src="/assets/mei-guide.png" alt=""/>Mei</div>{"You’re all set! Thanks for giving it a new start."}</div> </>}
                {Boolean(askCondition) && <>
                <div>

                <div className="donation-31">
                    {conditionChips.map((c, index6) => <React.Fragment key={c.id ?? c.label ?? c.name ?? index6}>
                    <button className="donation-32" style={{ "border": "1.5px solid " + String(c.border), "background": c.bg, "color": c.color }} onClick={c.pick} type="button">{c.label}</button>
                    </React.Fragment>)}
                </div>
                </div>
 </>}
                {Boolean(askSize) && <>
                <div>

                <div className="donation-31">
                    {sizeChips.map((c, index7) => <React.Fragment key={c.id ?? c.label ?? c.name ?? index7}>
                    <button className="donation-33" style={{ "border": "1.5px solid " + String(c.border), "background": c.bg, "color": c.color }} onClick={c.pick} type="button">{c.label}</button>
                    </React.Fragment>)}
                </div>
                </div>
 </>}
                {Boolean(askDesc) && <>
                <div>


                <textarea aria-label="Your garment story (optional)" className="donation-35" value={desc} onChange={onDesc} placeholder={"A favourite memory… (optional)"}></textarea>
                <button className="donation-36" onClick={toDrop} type="button">{"Continue"}</button>
                </div>
 </>}
                {Boolean(askDrop) && <>
                <div>
                <div className="donation-30">{"Example drop-off"}</div>
                <div className="donation-37">
                    {dropSpots.map((d, index8) => <React.Fragment key={d.id ?? d.label ?? d.name ?? index8}>
                    <button className="donation-38" style={{ "border": "1.5px solid " + String(d.border), "background": d.bg }} onClick={d.pick} type="button">
                    <span className="donation-39" style={{ "color": d.distColor }}>{d.dist}</span>
                    <span className="donation-40">
                    <span className="donation-41">{d.label}</span>
                    <span className="donation-42">{d.sub}</span>
                    </span>
                        {Boolean(d.recommended) && <>
                        <span className="donation-43">{"example"}</span>
 </>}
                    </button>
                    </React.Fragment>)}
                </div>
                </div>
 </>}
                {Boolean(donateComplete) && <>
                <button className="donation-44" onClick={finishDonate} disabled={step2Blocked} type="button">{step2Cta}</button>
 </>}
            </div>
 </>}
        </div>
        </div>
 </>} </>);
}
