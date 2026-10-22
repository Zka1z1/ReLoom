import {STORIES} from './data.js';
import {canBindStory,participatingGarments} from './nfc.js';
import {storyDiscussion} from './story-discussion.js';
export function garmentJourney(garment) {
 const donated=garment.kind==='donation', detail=STORIES[garment.id];
 const chapters=donated ? [{title:'Passed on',by:garment.donor||'you',text:garment.note||'Ready for a new chapter.',kind:'origin'},{title:'A new beginning',by:'Awaiting a maker',text:'The next chapter will appear when this piece is taken on by a maker.',kind:'pending'}] : [
  {title:'A life before',by:detail?.donor||'Original wearer',text:detail?.donorNote||'The original wearer’s note has not been added yet.',kind:'origin'},
  {title:detail?.concept?'The redesign':'Reimagined',by:garment.designer,text:detail?.steps.map(s=>s.text).join(' ')||'A finished upcycled piece. Process notes are still to come.',kind:'making'},
  {title:detail?.concept?'A new shape, the same memories':'Ready for its next chapter',by:detail?.concept?'After · design concept':'ReLoom community',text:detail?.concept?`An everyday tote that still looks and feels like the hoodie it came from. This AI-generated preview explores ${garment.designer.replace(/^@/,'')}’s design; the physical transformation is still to come.`:'Share an idea or leave a note for the next wearer.',kind:'next'}
 ];
 return {...garment,concept:!!detail?.concept,featured:!!detail?.featured,beforeImage:detail?.beforeImage,afterImage:detail?.afterImage,donated,chapters,stage:donated?'Awaiting a maker':'Reimagined',sample:!garment.id.startsWith('dn-')};
}
export function createThreadsModel(self){
 const s=self.state,own=participatingGarments(s),ids=[...new Set([...own.map(g=>g.id),...Object.keys(s.followed||{}),...Object.keys(s.chatUnread||{}),...Object.keys(STORIES)])];
 const cards=ids.map(id=>self.item(id)).filter(Boolean).filter(g=>canBindStory(s,g.id)||s.followed?.[g.id]||Object.hasOwn(s.chatUnread||{},g.id)||(s.threadFilter==='mine'&&STORIES[g.id]?.featured)).map(g=>{
  const story=garmentJourney(g),discussion=storyDiscussion(s,g.id);
  const recent=discussion.latest || (!story.concept ? self.postsFor(g.id)[0] : null);
  return {...story,following:!!s.followed?.[g.id],mine:canBindStory(s,g.id),note:recent?.text||story.chapters[0].text,author:recent?.author||(story.concept?g.designer:story.chapters[0].by),comments:discussion.count,hasUnread:(s.chatUnread?.[g.id]||0)>0,open:()=>self.setState({screen:'board',boardGarment:g.id,boardReturn:'messages',boardTab:'story',draft:'',attachment:null,replyTarget:null})};
 });
 return {cards,unread:Object.values(s.chatUnread||{}).reduce((total,count)=>total+count,0),filter:s.threadFilter||'all',setFilter:threadFilter=>self.setState({threadFilter})};
}
