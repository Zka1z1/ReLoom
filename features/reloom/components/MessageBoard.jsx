import React from "react";
export default function MessageBoard({ model }) {
    const { attachmentName, boardDesigner, boardPosts, boardTitle, chooseImage, clearAttachment, clearReply, closeBoard, draft, hasAttachment, imageUploadRef, isBoard, isReplying, onDraft, pickImage, postMessage, replyTarget } = model;
    return (<> {Boolean(isBoard) && <> 
        <div className="messageboard-1">
        <div className="messageboard-2">
        <button className="messageboard-3" onClick={closeBoard} type="button">{"\u2190"}</button>
        <div className="header-title"><div className="messageboard-4">{boardTitle}</div><div className="messageboard-5">{String(boardDesigner) + " \u00b7 Message Board"}</div></div>
        </div>
        <div className="rl-scroll messageboard-6">
            {boardPosts.map((p, index14) => <React.Fragment key={p.id ?? p.label ?? p.name ?? index14}>
            <div className="messageboard-7">
            <div className="rl-x messageboard-8" style={{ "border": "1.5px solid " + String(p.ring) }}></div>
            <div className="donation-40"><div className="messageboard-9"><span className="messageboard-10">{p.author}</span><span className="messageboard-11">{String(p.role) + " \u00b7 " + String(p.when)}</span></div>{Boolean(p.hasReplyTo) && <> <div className="messageboard-12">{"Replying to " + String(p.replyTo)}</div> </>}<div className="messageboard-13">{p.text}</div>{Boolean(p.hasAttachment) && <> <div className="messageboard-14"><span>{"Image"}</span><span className="messageboard-15">{p.attachmentName}</span></div> </>}<button className="messageboard-16" onClick={p.reply} type="button">{"Reply"}</button></div>
            </div>
            </React.Fragment>)}
        </div>
        <div className="messageboard-17">
        {Boolean(isReplying) && <> <div className="messageboard-18"><span>{"Replying to " + String(replyTarget)}</span><button className="messageboard-19" onClick={clearReply} aria-label={"Cancel reply"} type="button">{"\u00d7"}</button></div> </>}
        {Boolean(hasAttachment) && <> <div className="messageboard-20"><span>{"Image"}</span><span className="messageboard-15">{attachmentName}</span><button className="messageboard-19" onClick={clearAttachment} aria-label={"Remove attachment"} type="button">{"\u00d7"}</button></div> </>}
        <div className="messageboard-21">
        <input className="messageboard-22" value={draft} onChange={onDraft} placeholder={"Add to the thread\u2026"}/>
        <button className="messageboard-23" onClick={chooseImage} aria-label={"Attach image"} type="button">{"\u2795"}</button>
        <button className="messageboard-24" onClick={postMessage} type="button">{"Post"}</button>
        </div>
        <input className="messageboard-25" ref={imageUploadRef} type={"file"} accept={"image/*"} onChange={pickImage}/>
        </div>
        </div>
 </>} </>);
}
