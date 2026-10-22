import React from 'react';
import BeforeAfter from './BeforeAfter.jsx';
export default function StoryJourney({story,compact=false}){
 return <div className={`story-journey ${compact?'is-compact':''}`}>
  <BeforeAfter story={story}/>
  <div className="journey-title"><p className="eyebrow">{story.concept?`${story.designer.replace(/^@/,'')}’s design story`:story.sample?'Sample garment story':'Your garment story'}</p><h1>{story.name}</h1><p>{story.donated?`${story.condition} · Size ${story.size}`:`Reimagined by ${story.designer}`}</p></div>
  <ol className="story-timeline">{story.chapters.map((chapter,i)=><li key={chapter.kind} className={`chapter chapter-${chapter.kind}`}><span className="chapter-marker" aria-hidden="true">{chapter.kind==='pending'?'○':i+1}</span><div><p className="eyebrow">{chapter.by}</p><h2>{chapter.title}</h2><p className={chapter.kind==='origin'?'wearer-quote':''}>{chapter.text}</p>{chapter.kind==='making'&&!compact&&!story.concept&&<figure className="process-image"><img src="/assets/maker-process.png" alt="Illustration of a maker stitching reclaimed denim"/><figcaption>Illustrative process image</figcaption></figure>}</div></li>)}</ol>
 </div>;
}
