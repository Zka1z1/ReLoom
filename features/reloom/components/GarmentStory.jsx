import React from "react";
export default function GarmentStory({ model }) {
    const { closeModal, modalCart, modalCartBg, modalCartCta, modalOpen, openBoard, shareStory, story } = model;
    return (<> {Boolean(modalOpen) && <> 
        <div className="story-overlay">
        <div className="rl-scroll garmentstory-2">
        <div className="designerbooth-3">
        <div className="header-title">
        <div className="garmentstory-3">{story.name}</div>
        <div className="messageboard-5">{String(story.designer) + " \u00b7 " + String(story.price) + " \u00b7 " + String(story.zone)}</div>
        </div>
        <div className="garmentstory-4"><button className="garmentstory-5" onClick={shareStory} type="button">{"Share"}</button><button className="donation-5" onClick={closeModal} type="button">{"\u2715"}</button></div>
        </div>
        <div className="garmentstory-6">
        <div>
        <div className="myitems-6">{"before / after"}</div>
        <div className="garmentstory-7">
        <div className="rl-x garmentstory-8"><span className="garmentstory-9">{"before"}</span></div>
        <div className="garmentstory-10">{"\u2192"}</div>
        <div className="rl-x garmentstory-11"><span className="garmentstory-12">{"after"}</span></div>
        </div>
        </div>
        <div className="garmentstory-13">
        <div className="garmentstory-14">{"1"}</div>
        <div className="donation-22">
        <div className="myitems-20">{"Note from the last wearer"}</div>
        <div className="garmentstory-15">
        <div className="rl-x garmentstory-16"></div>
        <div className="garmentstory-17"><em>{"\"" + String(story.donorNote) + "\""}</em><br /><span className="garmentstory-18">{"\u2014 " + String(story.donor)}</span></div>
        </div>
        </div>
        </div>
        <div className="garmentstory-13">
        <div className="garmentstory-14">{"2"}</div>
        <div className="donation-22">
        <div className="myitems-20">{"Maker's process"}</div>
        <div className="rl-scroll garmentstory-19">
            {story.steps.map((p, index21) => <React.Fragment key={p.id ?? p.label ?? p.name ?? index21}>
            <div className="garmentstory-20">
            <div className="rl-x garmentstory-21"></div>
            <div className="garmentstory-22">{p.text}</div>
            </div>
            </React.Fragment>)}
        </div>
        </div>
        </div>
        <div className="garmentstory-13">
        <div className="garmentstory-14">{"3"}</div>
        <div className="donation-22">
        <div className="myitems-20">{"Impact & proceeds"}</div>
        <div className="garmentstory-23">
        <div>
        <div className="garmentstory-24"><span>{"kept in circulation"}</span><span>{String(story.kg) + " kg"}</span></div>
        <div className="garmentstory-25"><div className="showroom-19" style={{ "width": String(story.pct1) + "%" }}></div></div>
        </div>
        <div>
        <div className="garmentstory-24"><span>{"water saved vs. new"}</span><span>{String(story.water) + " L"}</span></div>
        <div className="garmentstory-25"><div className="garmentstory-26"></div></div>
        </div>
        </div>
        <div className="garmentstory-27">{String(story.split) + " of the sale goes to "}<strong>{story.charity}</strong>{"."}</div>
        </div>
        </div>
        <div className="search-3">
        <button className="garmentstory-28" style={{ "background": modalCartBg }} onClick={modalCart} type="button">{modalCartCta}</button>
        <button className="garmentstory-29" onClick={openBoard} type="button">{"Leave a message"}</button>
        </div>
        </div>
        </div>
        </div>
 </>} </>);
}
