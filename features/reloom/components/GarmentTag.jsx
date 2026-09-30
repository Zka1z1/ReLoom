import React from 'react';
export default function GarmentTag({model}) {
    const {isTagView,tag,isShare,tagUrl,closeTagView,copyTagLink,openTagStory}=model;
    if(!isTagView||!tag)return null;
    return <section className="rl-scroll garmenttag-1" aria-label="Garment story link">
        <div className="garmenttag-2"><button className="garmenttag-3" onClick={closeTagView} type="button" aria-label="Close story link">✕</button></div>
        <h1 className="garmenttag-5">{isShare?'Share story':'Digital Garment Tag'}</h1>
        <div className="garmenttag-6">
            <h2 className="garmenttag-9">{tag.name}</h2>
            <div className="garmenttag-10">{tag.condition?`${tag.condition} · size ${tag.size}`:tag.designer}</div>
            {tag.drop&&<div className="garmenttag-11">Drop-off: {tag.drop}</div>}
            <a className="story-share-link" href={tagUrl}>{tagUrl}</a>
        </div>
        <button className="garmenttag-17" onClick={copyTagLink} type="button">Copy story link</button>
        <button className="garmentstory-29" onClick={openTagStory} type="button">View story</button>
    </section>;
}
