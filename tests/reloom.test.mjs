import test from 'node:test';
import assert from 'node:assert/strict';
import {renderToStaticMarkup} from 'react-dom/server';
import App from '../work/test-build/ReLoomApp.mjs';
import {createViewModel} from '../work/test-build/view-model.mjs';
import {selectZoneItems, DONATIONS, EMPTY_FILTERS, swipeStep} from '../work/test-build/showroom.mjs';
import {projectRecords} from '../work/test-build/records.mjs';
import {findGarment} from '../work/test-build/domain.mjs';
function app(records=new Map()){

 const a=new App({});
 a.state.dataReady=true;
 a.request=async action=>{
  if(action){
   if(action.type==='import')for(const [id,value] of Object.entries(action.value))records.set('design:'+id,{kind:'design',id,data:value});
   else {
    const {type:kind,id}=action;
    let value=action.value||{};
    if(kind==='donation')value={...value,id,name:'Old Denim Jacket',cat:'Denim',material:'Denim',donor:'you',when:'now'};
    if(!records.has(kind+':'+id)||kind==='design')records.set(kind+':'+id,{kind,id,data:value});
   }
  }
  return projectRecords([...records.values()].reverse());
 };

 a.setState=(change,callback)=>{const patch=typeof change==='function'?change(a.state):change;if(patch)a.state={...a.state,...patch};callback?.();};
 a.toast=message=>{a.lastToast=message;};
 return a;
}
const model=a=>createViewModel(a);
test('all main screens and overlays render as native HTML',()=>{
 const a=app();
 for(const state of [ {}, ...['store','donate','tag','tags','mytags','messages','board'].map(screen=>({screen})),{search:true},{modal:'g1'},{booth:'bo-alex'},{dialog:true}, {screen:'donate',donateStep:2,donateChat:'condition'}, {screen:'donate',donateStep:2,donateChat:'size'}, {screen:'donate',donateStep:2,donateChat:'desc'}, {screen:'donate',donateStep:2,donateChat:'drop'}, {screen:'tags',itemsTab:'cart'}, {screen:'tags',itemsTab:'favourites'}]){
  a.state={...a.state,dialog:false,search:false,modal:null,booth:null,...state};
  const html=renderToStaticMarkup(a.render());
  assert.match(html,/ReLoom/);
  assert.doesNotMatch(html,/<iframe|<sc-if|<sc-for|\{\{/);
 }
});
test('votes and cart additions are idempotent',async()=>{
 const a=app(),points=a.state.points;
 await a.vote('g1');await a.vote('g1');assert.equal(a.state.points,points+5);assert.equal(a.count('g1'),413);
 await a.vote('missing');assert.equal(a.state.voted.missing,undefined);
 a.addCart('g1');a.addCart('g1');assert.deepEqual(a.state.cart,['g1']);assert.equal(model(a).cartTotal,'$74');
 model(a).cartList[0].remove();assert.equal(a.state.cart.length,0);
});
test('save and unsave cannot farm points',()=>{
 const a=app(),points=a.state.points;a.toggleSave('g1');assert.equal(model(a).savedList.length,1);a.toggleSave('g1');assert.equal(model(a).savedList.length,0);assert.equal(a.state.points,points);
});
test('donation requires fields and resets after a successful save',async()=>{
 const a=app();await model(a).finishDonate();assert.equal(a.state.tags.length,1);
 model(a).addPhotos();model(a).toStep2();model(a).conditionChips[2].pick();model(a).sizeChips[1].pick();model(a).toDrop();model(a).dropSpots[0].pick();await model(a).finishDonate();
 assert.equal(a.state.screen,'tag');assert.equal(a.state.tags.length,2);const id=a.state.newTag.id;
 await model(a).finishDonate();assert.equal(a.state.newTag.id,id);assert.equal(a.state.tags.length,2);
});
test('thread posts retain garment association and clear draft',async()=>{
 const a=app();a.state.boardGarment='g2';a.state.draft='  Thanks for the update!  ';a.state.replyTarget='@Hao';await model(a).postMessage();
 assert.equal(a.state.posts.g2[0].text,'Thanks for the update!');assert.equal(a.state.posts.g2[0].replyTo,'@Hao');assert.equal(a.state.draft,'');
 model(a).messageCards[0].open();assert.equal(a.state.boardGarment,'g2');assert.equal(a.state.screen,'board');
});
test('showroom has bounded areas and keeps independent search and filters',()=>{
 const a=app();
 model(a).showroom.setFilters({query:'alex',category:'Denim'});
 assert.equal(model(a).showroom.items.length,1);
 model(a).showroom.next();assert.equal(model(a).showroom.id,'donated');
 assert.equal(model(a).showroom.filters.query,'');
 model(a).showroom.setFilters({size:'M',condition:'Good'});
 assert.equal(model(a).showroom.items.length,2);
 model(a).showroom.prev();assert.equal(model(a).showroom.filters.query,'alex');
 model(a).showroom.prev();assert.equal(a.state.showroomZone,0);
 a.changeZone(2);model(a).showroom.next();assert.equal(a.state.showroomZone,2);
});
test('filters combine within the selected area and reset an empty result',()=>{
 const f={...EMPTY_FILTERS,query:'cotton',category:'Tops',condition:'Like new',size:'L'};
 assert.deepEqual(selectZoneItems('donated',f).map(d=>d.id),['don-shirt']);
 assert.equal(selectZoneItems('designers',{...EMPTY_FILTERS,query:'SYDNEY',category:'Denim'})[0].designer,'@Alex');
 const a=app();a.changeZone(2);
 model(a).showroom.setFilters({query:'Alex',category:'Denim',price:'$60–100'});
 assert.deepEqual(model(a).showroom.items.map(d=>d.id),['n2']);
 model(a).showroom.setFilters({query:'nothing-matches'});assert.equal(model(a).showroom.items.length,0);
 model(a).showroom.reset();assert.equal(model(a).showroom.items.length,8);
 const items=selectZoneItems('upcycled',{...EMPTY_FILTERS,sort:'Price: low to high'});
 assert.deepEqual(items.map(i=>i.price),[32,58,66,74,88,96,120,140]);
 assert.ok(DONATIONS.every(d=>!items.some(i=>i.id===d.id)));
});
test('swipes ignore vertical scrolling and small movements',()=>{
 assert.equal(swipeStep(-90,12),1);assert.equal(swipeStep(90,12),-1);
 assert.equal(swipeStep(20,2),0);assert.equal(swipeStep(90,120),0);assert.equal(swipeStep(60,60),0);
});
test('new donation is discoverable in donated area, never among finished garments',async()=>{
 const a=app();a.state={...a.state,condition:'Good',size:'M',drop:'UTS Grab-A-Fit point',desc:'Blue cotton denim'};
 await model(a).finishDonate();a.changeZone(1);
 model(a).showroom.setFilters({query:'Blue cotton',size:'M'});
 assert.equal(model(a).showroom.items[0].id,a.state.newTag.id);
 assert.equal(model(a).showroom.items[0].condition,'Good');
 a.changeZone(2);assert.ok(!model(a).showroom.items.some(i=>i.id===a.state.newTag.id));
});

const {validateDesign,readDesigns,DESIGN_STORAGE_KEY,storyUrl}=await import('../work/test-build/nfc.mjs');
test('NFC designs reject unsupported values and tolerate damaged storage',()=>{
 const design={color:'blue',garmentId:'g1',emojis:['🌸']};
 assert.deepEqual(validateDesign(design),design);
 for(const patch of [{color:'pink'},{garmentId:'missing'},{emojis:['invalid']},{emojis:Array(7).fill('🌸')}])assert.equal(validateDesign({...design,...patch}),null);
 assert.deepEqual(readDesigns({getItem:()=>'{broken'}),{});
 assert.deepEqual(readDesigns({getItem:()=>JSON.stringify({g1:design,g2:design})}),{g1:design});
 assert.equal(storyUrl('g2'),'https://reloom-mobile.z1oey12.chatgpt.site/?story=g2');assert.equal(storyUrl('unknown'),null);
});
test('NFC designs and participation survive a reload; failed saves preserve the draft',async()=>{
 const records=new Map(),a=app(records);
 await a.vote('g2');a.openNfc('g2');model(a).nfc.change({color:'red',emojis:['❤️','🌿']});await model(a).nfc.save();
 assert.equal(a.state.nfcSaved,true);assert.equal(a.state.screen,'mytags');
 const b=app(records);await b.refreshRecords();
 assert.equal(model(b).savedNfcTags[0].canEdit,true);
 model(b).savedNfcTags[0].edit();assert.equal(b.state.nfcDesign.color,'red');
 model(b).nfc.preview();assert.equal(b.state.modal,'g2');
 b.openNfc('g2');model(b).nfc.change({color:'black'});b.request=async()=>{throw Error('Unable to save');};
 await model(b).nfc.save();assert.equal(b.state.screen,'nfc');assert.equal(b.state.nfcDesign.color,'black');assert.match(b.state.nfcError,/Unable to save/);
 assert.equal(records.get('design:g2').data.color,'red');
});
test('card room has an area heading without numbering and minimal NFC editor renders',()=>{
 const a=app();let html=renderToStaticMarkup(a.render());assert.match(html,/zone-card/);assert.match(html,/zone-area-title/);assert.match(html,/zone-perspective/);assert.doesNotMatch(html,/zone-title|zone-tabs|zone-index/);
 a.openNfc('g1');html=renderToStaticMarkup(a.render());assert.match(html,/white NFC card/);assert.match(html,/Preview a tap/);assert.doesNotMatch(html,/Add Blossom|Remove pattern|Move pattern/);assert.match(html,/DIY NFC strap/);
});

const {dropEmoji}=await import('../work/test-build/emoji-drag.mjs');
test('emoji drops add, reorder and remove while cancelled or full-strap drops are safe',()=>{
 const initial=['🌸','🌿','⭐'];
 assert.deepEqual(dropEmoji(initial,{emoji:'❤️'},1),['🌸','❤️','🌿','⭐']);
 assert.deepEqual(dropEmoji(initial,{index:0},2),['🌿','⭐','🌸']);
 assert.deepEqual(dropEmoji(initial,{index:2},0),['⭐','🌸','🌿']);
 assert.deepEqual(dropEmoji(initial,{index:1},'remove'),['🌸','⭐']);
 assert.deepEqual(dropEmoji(initial,{emoji:'❤️'},'remove'),initial);
 assert.deepEqual(dropEmoji(initial,{index:0},null),initial);
 assert.deepEqual(dropEmoji(initial,{emoji:'❤️'},5),['🌸','🌿','⭐','❤️']);
 assert.equal(dropEmoji(Array(6).fill('🌸'),{emoji:'❤️'},1).length,6);
 assert.deepEqual(initial,['🌸','🌿','⭐']);
});

test('only donated, voted or personally discussed garment stories can be bound',async()=>{
 const a=app();assert.deepEqual(model(a).nfc.garments.map(g=>g.id),['g1']);
 a.openStory('g2');a.toggleSave('g2');a.addCart('g2');assert.equal(model(a).canDesignStory,false);
 a.openNfc('g2');assert.notEqual(a.state.screen,'nfc');
 a.openNfc();model(a).nfc.selectGarment('g2');assert.equal(a.state.nfcDesign.garmentId,'g1');
 a.state.nfcDesign={color:'blue',emojis:['🌿'],garmentId:'g2'};model(a).nfc.save();assert.match(a.state.nfcError,/participated/);
 await a.vote('g2');assert.equal(model(a).nfc.canBind,true);
 a.state.boardGarment='g3';a.state.draft='I helped choose this cut';await model(a).postMessage();assert.deepEqual(model(a).nfc.garments.map(g=>g.id),['g1','g2','g3']);
 a.state.tags=[];a.state.voted={};a.state.posts={};a.openNfc();assert.equal(model(a).nfc.canBind,false);assert.equal(model(a).nfc.garments.length,0);
 assert.match(renderToStaticMarkup(a.render()),/No stories yet/);
});
test('yellow flower is removed from existing designs without discarding the colour or story',()=>{
 const stored={g1:{color:'red',emojis:['🌼','🌿','⭐'],garmentId:'g1'}};
 assert.deepEqual(readDesigns({getItem:()=>JSON.stringify(stored)}).g1,{color:'red',emojis:['🌿','⭐'],garmentId:'g1'});
 const a=app();a.openNfc();const html=renderToStaticMarkup(a.render());assert.doesNotMatch(html,/🌼|Daisy/);assert.equal(model(a).nfc.palette.length,11);assert.match(html,/nfc-remove-tile/);
});
test('two independently loaded pages save different designs without overwriting each other',async()=>{
 const records=new Map(),a=app(records),b=app(records);
 await a.refreshRecords();await b.refreshRecords();
 a.openNfc('g1');await model(a).nfc.save();
 await b.vote('g2');b.openNfc('g2');model(b).nfc.change({color:'black'});await model(b).nfc.save();
 const c=app(records);await c.refreshRecords();
 assert.deepEqual(Object.keys(c.state.nfcDesigns).sort(),['g1','g2']);
 c.openNfc('g1');model(c).nfc.change({color:'red'});await model(c).nfc.save();
 assert.equal(model(c).savedNfcTags.length,2);assert.equal(c.state.nfcDesigns.g2.color,'black');
});

test('donation identity is consistent across Items, Threads, NFC, Share and reload',async()=>{
 const records=new Map(),a=app(records);a.state={...a.state,condition:'Good',size:'M',drop:'UTS Grab-A-Fit point',desc:'A jacket from my trip'};
 await model(a).finishDonate();const id=a.state.newTag.id;
 assert.ok(model(a).nfc.garments.some(g=>g.id===id));
 model(a).myTags[0].open();assert.equal(a.state.modal,id);assert.equal(model(a).story.donorNote,'A jacket from my trip');
 assert.equal(model(a).story.donated,true);assert.doesNotMatch(renderToStaticMarkup(a.render()),/Maker&#x27;s process|Reserve ·/);
 model(a).messageCards[0].open();assert.equal(a.state.boardGarment,id);
 a.openNfc(id);await model(a).nfc.save();
 await a.openStory(id);model(a).shareStory();assert.equal(model(a).tag.id,id);assert.ok(model(a).tagUrl.endsWith(encodeURIComponent(id)));
 const b=app(records);await b.refreshRecords();assert.equal(model(b).savedNfcTags[0].canEdit,true);assert.equal(b.item(id).name,'Old Denim Jacket');
});

test('Share always uses the selected garment, never the most recent donation',()=>{
 const a=app();a.state.newTag={id:'old-donation',name:'Wrong clothing'};
 a.openStory('g2');model(a).shareStory();assert.equal(model(a).tag.id,'g2');assert.equal(model(a).tagUrl,storyUrl('g2'));
 assert.doesNotMatch(renderToStaticMarkup(a.render()),/Wrong clothing|tag minted|15 kg/);
 model(a).closeTagView();assert.equal(a.state.modal,'g2');
});

test('My tags precedes Items and keeps NFC designs separate from clothing',()=>{
 const a=app();assert.deepEqual(model(a).tabs.map(t=>t.label),['Explore','Donate','My tags','Items','Threads']);
 model(a).tabs[2].pick();assert.equal(a.state.screen,'mytags');assert.match(renderToStaticMarkup(a.render()),/No tags yet/);
 a.state.nfcDesigns={g1:{color:'blue',emojis:['🌿'],garmentId:'g1'}};
 assert.match(renderToStaticMarkup(a.render()),/Saved NFC tags/);
 model(a).tabs[3].pick();const html=renderToStaticMarkup(a.render());assert.doesNotMatch(html,/Saved NFC tags|My items/);assert.match(html,/Donated/);
});
