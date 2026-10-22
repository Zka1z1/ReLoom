import test from 'node:test';
import assert from 'node:assert/strict';
import {renderToStaticMarkup} from 'react-dom/server';
import App from '../work/test-build/ReLoomApp.mjs';
import {createViewModel} from '../work/test-build/view-model.mjs';
import {selectZoneItems, DONATIONS, EMPTY_FILTERS, swipeStep} from '../work/test-build/showroom.mjs';
import {projectRecords} from '../work/test-build/records.mjs';
import {findGarment} from '../work/test-build/domain.mjs';
import {markChatRead} from '../work/test-build/chat.mjs';
import {createSwipeHandlers} from '../work/test-build/swipe-actions.mjs';

import {attachSwipeTouchEvents} from '../work/test-build/swipe-events.mjs';

function swipeCard(open=false,disabled=false){
 const state={gesture:null,suppressClick:false},result={open,opened:0,drag:null,toggles:[],prevented:0,captured:[]};
 const card={setPointerCapture:id=>result.captured.push(id)},child={};
 const handlers=()=>createSwipeHandlers(state,{
  open:result.open,disabled,onToggle:value=>{result.open=value;result.toggles.push(value);},
  onOpen:()=>result.opened++,onDrag:value=>{result.drag=value;},
 });
 const event=(changes={})=>({pointerId:1,pointerType:'mouse',isPrimary:true,button:0,clientX:200,clientY:100,
  currentTarget:card,target:child,detail:1,preventDefault(){result.prevented++;},stopPropagation(){},...changes});
 const send=(name,changes)=>handlers()[name](event(changes));
 const touch=(name,x=200,y=100,changes={})=>send(name,{
  changedTouches:[{identifier:1,clientX:x,clientY:y}],
  touches:name==='onTouchEnd'||name==='onTouchCancel'?[]:[{identifier:1,clientX:x,clientY:y}],
  cancelable:true,...changes,
 });
 return {send,touch,event,result,card,child};
}

test('capture moving from a card child does not cancel its left swipe',()=>{
 const {send,result}=swipeCard();
 send('onPointerDown');assert.deepEqual(result.captured,[1]);
 send('onLostPointerCapture'); // A descendant losing capture must not cancel the card.
 send('onPointerMove',{clientX:110});assert.equal(result.drag,-90);
 send('onPointerUp',{clientX:100});assert.equal(result.open,true);assert.equal(result.drag,null);
 send('onClick',{detail:0}); // Touch clicks can have zero detail.
 assert.deepEqual(result.toggles,[true]);assert.equal(result.opened,0);
});

test('vertical scrolling does not open swipe actions or navigate to the story',()=>{
 const {send,result}=swipeCard();
 send('onPointerDown');send('onPointerMove',{clientX:192,clientY:140});
 send('onPointerUp',{clientX:100,clientY:220});send('onClick');
 assert.deepEqual(result.toggles,[]);assert.equal(result.opened,0);assert.equal(result.drag,null);
});

test('right swipe closes open actions and uses the final release position',()=>{
 const {send,result}=swipeCard(true);
 send('onPointerDown');send('onPointerMove',{clientX:220});
 send('onPointerUp',{clientX:320});send('onClick');
 assert.deepEqual(result.toggles,[false]);assert.equal(result.opened,0);
 // A new tap must still open the story after a completed swipe.
 send('onPointerDown');send('onPointerUp');send('onClick');assert.equal(result.opened,1);
});

test('short swipes snap closed without opening the story; taps still work',()=>{
 const {send,result}=swipeCard();
 send('onPointerDown');send('onPointerMove',{clientX:175});send('onPointerUp',{clientX:170});send('onClick');
 assert.deepEqual(result.toggles,[false]);assert.equal(result.opened,0);
 send('onPointerDown');send('onPointerMove',{clientX:198});send('onPointerUp',{clientX:198});send('onClick');
 assert.equal(result.opened,1);
});

test('lost card capture cancels a swipe, unrelated pointers do not',()=>{
 const {send,result,card}=swipeCard();
 send('onPointerDown');send('onPointerMove',{clientX:110});
 send('onPointerCancel',{pointerId:2});assert.equal(result.drag,-90);
 send('onLostPointerCapture',{target:card});assert.equal(result.drag,null);
 send('onPointerUp',{clientX:100});send('onClick');
 assert.deepEqual(result.toggles,[]);assert.equal(result.opened,0);
 send('onClick',{detail:0,pointerType:''});assert.equal(result.opened,1); // Keyboard activation.
});

test('disabled cards and secondary pointers never start a swipe',()=>{
 const disabled=swipeCard(false,true);
 disabled.send('onPointerDown');disabled.send('onClick');
 assert.deepEqual(disabled.result.captured,[]);assert.equal(disabled.result.opened,0);
 const secondary=swipeCard();secondary.send('onPointerDown',{isPrimary:false});
 assert.deepEqual(secondary.result.captured,[]);
});

test('native touch swipes survive pointer cancellation and suppress a zero-detail ghost click',()=>{
 const {send,touch,result}=swipeCard();
 send('onPointerDown',{pointerType:'touch'});touch('onTouchStart');
 assert.deepEqual(result.captured,[]); // Touch must not rely on pointer capture.
 touch('onTouchMove',145,104);assert.equal(result.drag,-55);
 send('onPointerCancel',{pointerType:'touch'});
 send('onLostPointerCapture',{pointerType:'touch'});
 assert.equal(result.drag,-55);
 touch('onTouchEnd',145,104);
 assert.equal(result.open,true);assert.equal(result.prevented,2);assert.equal(result.drag,null);
 send('onClick',{detail:0,pointerType:undefined});
 assert.equal(result.open,true);assert.equal(result.opened,0);
 // An ordinary new tap closes the actions, instead of opening the story.
 touch('onTouchStart');touch('onTouchEnd');send('onClick');
 assert.equal(result.open,false);assert.equal(result.opened,0);
});

test('native vertical touch scrolling is not prevented or treated as a tap',()=>{
 const {send,touch,result}=swipeCard();
 touch('onTouchStart');touch('onTouchMove',197,150);touch('onTouchEnd',194,200);
 assert.equal(result.prevented,0);assert.equal(result.drag,null);assert.deepEqual(result.toggles,[]);
 send('onClick',{detail:0,pointerType:undefined});assert.equal(result.opened,0);
});

test('native touch supports short deliberate swipes in both directions',()=>{
 const {touch,result}=swipeCard();
 touch('onTouchStart');touch('onTouchMove',150);touch('onTouchEnd',150);
 assert.equal(result.open,true);
 touch('onTouchStart');touch('onTouchMove',250);touch('onTouchEnd',250);
 assert.equal(result.open,false);
});

test('multi-touch and native touch cancellation leave the card settled',()=>{
 const {touch,result}=swipeCard();
 touch('onTouchStart');touch('onTouchMove',150);
 touch('onTouchStart',150,100,{touches:[{identifier:1},{identifier:2}]});
 assert.equal(result.drag,null);touch('onTouchEnd',100);assert.equal(result.open,false);
 touch('onTouchStart');touch('onTouchMove',140);touch('onTouchCancel',140);
 assert.equal(result.drag,null);assert.deepEqual(result.toggles,[]);
});

test('keyboard activation works even when no synthetic click followed the touch swipe',()=>{
 const {send,touch,result}=swipeCard();
 touch('onTouchStart');touch('onTouchMove',180);touch('onTouchEnd',180);
 send('onKeyDown',{key:'Enter'});send('onClick',{detail:0,pointerType:undefined});
 assert.equal(result.opened,1);
});

test('native touch listeners can cancel scroll/click and are detached on unmount',()=>{
 const added=[],removed=[],calls=[];
 const element={addEventListener:(...args)=>added.push(args),removeEventListener:(...args)=>removed.push(args)};
 let version=1;
 const cleanup=attachSwipeTouchEvents(element,()=>({onTouchMove:()=>calls.push(version)}));
 assert.equal(added.find(([type])=>type==='touchmove')[2].passive,false);
 assert.equal(added.find(([type])=>type==='touchend')[2].passive,false);
 version=2;added.find(([type])=>type==='touchmove')[1]({});assert.deepEqual(calls,[2]);
 cleanup();assert.deepEqual(removed,added);
});

test('mark read acknowledges a captured latest message without clearing newer arrivals',async t=>{
 const latest={id:'last-message',created:'2026-10-16T00:00:00.000Z'},calls=[];
 t.mock.method(globalThis,'fetch',async(url,options)=>{
  calls.push({url,options});
  return {ok:true,json:async()=>options.method?{messages:[latest],unread:1}:{messages:[latest],unread:3}};
 });
 const result=await markChatRead('g2');
 assert.equal(result.unread,1);
 assert.deepEqual(JSON.parse(calls[1].options.body),{room:'g2',type:'read',cursor:latest.created+latest.id});
 assert.equal(calls[1].options.credentials,'same-origin');
});

test('mark read supports introductory comments and leaves an empty chat unchanged',async t=>{
 const actions=[];
 t.mock.method(globalThis,'fetch',async(url,options)=>{
  if(options.body)actions.push(JSON.parse(options.body));
  return {ok:true,json:async()=>({messages:[],unread:0})};
 });
 await markChatRead('g2');await markChatRead('empty-room');
 assert.deepEqual(actions,[{room:'g2',type:'read',cursor:'intro'}]);
});
function app(records=new Map()){

 const a=new App({});
 a.state.photo={id:'00000000-0000-4000-8000-000000000001',url:'/test.jpg',analysis:{status:'unavailable',message:'Enter details'}};
 a.state.garmentDetails={name:'Old Denim Jacket',cat:'Denim',color:'Blue',material:'Cotton'};
 a.state.dataReady=true;
 a.state.screen="store";
 a.request=async action=>{
  if(action){
   if(action.type==='import')for(const [id,value] of Object.entries(action.value))records.set('design:'+id,{kind:'design',id,data:value});
   else {
    const {type:kind,id}=action;
    let value=action.value||{};
    if(kind==='donation')value={...value,id,name:'Old Denim Jacket',cat:'Denim',material:'Denim',donor:'you',when:'now'};
    if(!records.has(kind+':'+id)||kind==='design'||kind==='follow')records.set(kind+':'+id,{kind,id,data:value});
   }
  }
  return projectRecords([...records.values()].reverse());
 };

 a.setState=(change,callback)=>{const patch=typeof change==='function'?change(a.state):change;if(patch)a.state={...a.state,...patch};callback?.();};
 a.toast=message=>{a.lastToast=message;};
 return a;
}
const model=a=>createViewModel(a);
test('public donations refresh in Explore but enter All stories only after participation or follow',async()=>{
 const a=app(),id='dn-public-visitor',garment={id,name:'Community hoodie',cat:'Tops',condition:'Good',size:'M',note:'Keep the pockets',donor:'@AnotherDonor',visibility:'public',photoUrl:'/api/photos?id=public-photo'};
 let snapshot={...projectRecords([]),publicDonations:[garment]};
 a.request=async()=>snapshot;
 await a.refreshRecords();a.changeZone(1);
 const card=model(a).showroom.items.find(g=>g.id===id);
 assert.ok(card);assert.equal(card.ownDonation,false);assert.equal(card.claimDisabled,false);
 card.open();assert.equal(model(a).story.name,garment.name);assert.equal(model(a).story.photoUrl,garment.photoUrl);
 assert.ok(!model(a).threads.cards.some(g=>g.id===id));
 assert.ok(!model(a).threads.cards.some(g=>g.id==='g2')); // A featured example alone is not participation.
 assert.ok(!a.state.tags.some(tag=>tag.garmentId===id));assert.equal(a.state.points,120);
 assert.ok(!model(a).nfc.garments.some(g=>g.id===id));assert.equal(a.state.chatUnread[id],undefined);
 model(a).threads.setFilter('mine');assert.ok(!model(a).threads.cards.some(g=>g.id===id));
 model(a).threads.setFilter('all');
 a.setState({followed:{[id]:true}});assert.ok(model(a).threads.cards.some(g=>g.id===id));
 a.setState({followed:{[id]:false}});assert.ok(!model(a).threads.cards.some(g=>g.id===id));
 a.setState({posts:{[id]:[{author:'you',text:'I can help with the pockets.'}]}});
 assert.ok(model(a).threads.cards.some(g=>g.id===id));
 snapshot={...projectRecords([]),publicDonations:[]};await a.refreshRecords();
 assert.ok(!model(a).showroom.items.some(g=>g.id===id));
 model(a).threads.setFilter('all');assert.ok(!model(a).threads.cards.some(g=>g.id===id));
});
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
 model(a).toStep2();model(a).conditionChips[2].pick();model(a).sizeChips[1].pick();model(a).toDrop();model(a).dropSpots[0].pick();await model(a).finishDonate();
 assert.equal(a.state.screen,'nfc');assert.equal(a.state.nfcDesign.garmentId,a.state.newTag.id);assert.equal(a.state.tags.length,2);const id=a.state.newTag.id;
 await model(a).finishDonate();assert.equal(a.state.newTag.id,id);assert.equal(a.state.tags.length,2);
});
test('thread posts retain garment association and clear draft',async()=>{
 const a=app();a.state.boardGarment='g2';a.state.draft='  Thanks for the update!  ';a.state.replyTarget='@Hao';await model(a).postMessage();
 assert.equal(a.state.posts.g2[0].text,'Thanks for the update!');assert.equal(a.state.posts.g2[0].replyTo,'@Hao');assert.equal(a.state.draft,'');
 model(a).threads.cards.find(g=>g.id==='g2').open();assert.equal(a.state.boardGarment,'g2');assert.equal(a.state.screen,'board');
});
test('showroom has bounded areas and keeps independent search and filters',()=>{
 const a=app();
 model(a).showroom.setFilters({query:'alex',category:'Accessories'});
 assert.equal(model(a).showroom.items.length,1);
 model(a).showroom.next();assert.equal(model(a).showroom.id,'donated');
 assert.equal(model(a).showroom.filters.query,'');
 model(a).showroom.setFilters({size:'M',condition:'Good'});
 assert.deepEqual(model(a).showroom.items.map(d=>d.id),['don-denim']);
 model(a).showroom.prev();assert.equal(model(a).showroom.filters.query,'alex');
 model(a).showroom.prev();assert.equal(a.state.showroomZone,0);
 a.changeZone(2);model(a).showroom.next();assert.equal(a.state.showroomZone,2);
});
test('filters combine within the selected area and reset an empty result',()=>{
 const f={...EMPTY_FILTERS,query:'cotton',category:'Tops',condition:'Like new',size:'L'};
 assert.deepEqual(selectZoneItems('donated',f).map(d=>d.id),['don-shirt']);
 assert.equal(selectZoneItems('designers',{...EMPTY_FILTERS,query:'SYDNEY',category:'Accessories'})[0].designer,'@Alex');
 const a=app();a.changeZone(2);
 model(a).showroom.setFilters({query:'Hao',category:'Denim',price:'$60–100'});
 assert.deepEqual(model(a).showroom.items.map(d=>d.id),['n2']);
 model(a).showroom.setFilters({query:'nothing-matches'});assert.equal(model(a).showroom.items.length,0);
 model(a).showroom.reset();assert.equal(model(a).showroom.items.length,7);
 const items=selectZoneItems('upcycled',{...EMPTY_FILTERS,sort:'Price: low to high'});
 assert.deepEqual(items.map(i=>i.price),[32,58,66,74,88,96,140]);
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

const {validateDesign,readDesigns,DESIGN_STORAGE_KEY}=await import('../work/test-build/nfc.mjs');
test('NFC designs reject unsupported values and tolerate damaged storage',()=>{
 const design={color:'blue',garmentId:'g1',emojis:['🌸']};
 assert.deepEqual(validateDesign(design),design);
 for(const patch of [{color:'pink'},{garmentId:'missing'},{emojis:['invalid']},{emojis:Array(7).fill('🌸')}])assert.equal(validateDesign({...design,...patch}),null);
 assert.deepEqual(readDesigns({getItem:()=>'{broken'}),{});
 assert.deepEqual(readDesigns({getItem:()=>JSON.stringify({g1:design,g2:design})}),{g1:design});
});
test('NFC designs and participation survive a reload; failed saves preserve the draft',async()=>{
 const records=new Map(),a=app(records);
 await a.vote('g2');a.openNfc('g2');model(a).nfc.change({color:'red',emojis:['❤️','🌿']});await model(a).nfc.save();
 assert.equal(a.state.nfcSaved,true);assert.equal(a.state.screen,'mytags');
 const b=app(records);await b.refreshRecords();
 assert.equal(model(b).savedNfcTags[0].canEdit,true);
 model(b).savedNfcTags[0].edit();assert.equal(b.state.nfcDesign.color,'red');
 model(b).savedNfcTags[0].open();assert.equal(b.state.modal,'g2');
 b.openNfc('g2');model(b).nfc.change({color:'black'});b.request=async()=>{throw Error('Unable to save');};
 await model(b).nfc.save();assert.equal(b.state.screen,'nfc');assert.equal(b.state.nfcDesign.color,'black');assert.match(b.state.nfcError,/Unable to save/);
 assert.equal(records.get('design:g2').data.color,'red');
});
test('card room has an area heading without numbering and minimal NFC editor renders',()=>{
 const a=app();let html=renderToStaticMarkup(a.render());assert.match(html,/zone-card/);assert.match(html,/zone-area-title/);assert.match(html,/zone-perspective/);assert.doesNotMatch(html,/zone-title|zone-tabs|zone-index/);
 a.openNfc('g1');html=renderToStaticMarkup(a.render());assert.match(html,/white NFC card/);assert.doesNotMatch(html,/Preview a tap|Copy link/);assert.doesNotMatch(html,/Add Blossom|Remove pattern|Move pattern/);assert.match(html,/DIY NFC strap/);
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
 a.state.boardGarment='b2';a.state.draft='I helped choose this cut';await model(a).postMessage();assert.deepEqual(model(a).nfc.garments.map(g=>g.id),['g1','g2','b2']);
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
 model(a).threads.cards.find(g=>g.id===id).open();assert.equal(a.state.boardGarment,id);
 a.openNfc(id);await model(a).nfc.save();
 await a.openStory(id);model(a).shareStory();assert.equal(model(a).tag.id,id);
 const b=app(records);await b.refreshRecords();assert.equal(model(b).savedNfcTags[0].canEdit,true);assert.equal(b.item(id).name,'Old Denim Jacket');
});

test('Share always uses the selected garment, never the most recent donation',()=>{
 const a=app();a.state.newTag={id:'old-donation',name:'Wrong clothing'};
 a.openStory('g2');model(a).shareStory();assert.equal(model(a).tag.id,'g2');
 assert.doesNotMatch(renderToStaticMarkup(a.render()),/Wrong clothing|tag minted|15 kg/);
 model(a).closeTagView();assert.equal(a.state.modal,'g2');
});

test('Explore is centered and Donate and My tags have direct navigation',()=>{
 const a=app();assert.deepEqual(model(a).tabs.map(t=>t.label),['Mei','Donate','Explore','My tags','Stories']);
 model(a).tabs[3].pick();assert.equal(a.state.screen,'mytags');assert.match(renderToStaticMarkup(a.render()),/No tags yet/);
 a.state.nfcDesigns={g1:{color:'blue',emojis:['🌿'],garmentId:'g1'}};
 assert.match(renderToStaticMarkup(a.render()),/Saved NFC tags/);
 model(a).tabs[1].pick();assert.equal(a.state.screen,'donate');const html=renderToStaticMarkup(a.render());assert.doesNotMatch(html,/Saved NFC tags|My items/);assert.match(html,/Choose photo/);
});


test('NPC starts the app and routes each intent to its matching experience',()=>{
 assert.equal(new App({}).state.screen,'welcome');
 const a=app();model(a).openDialog();assert.equal(model(a).isWelcome,true);
 assert.match(renderToStaticMarkup(a.render()),/What can I call you/);
 model(a).updateProfile({handle:'alex',displayHandle:'Alex'});
 const welcome=renderToStaticMarkup(a.render());
 assert.match(welcome,/>Alex<\/button>/);assert.match(welcome,/What brings/);assert.match(welcome,/Edit your ReLoom username/);
 a.setState({screen:'mytags'});assert.doesNotMatch(renderToStaticMarkup(a.render()),/Edit your ReLoom username|Your username/);
 model(a).openDialog();
 for(const [id,zone] of [['designers',0],['donated',1],['upcycled',2]]){
  a.state.modal='g1';a.state.booth='bo-alex';
  model(a).guideChoices.find(c=>c.id===id).pick();
  assert.equal(a.state.screen,'store');assert.equal(a.state.showroomZone,zone);assert.equal(a.state.modal,null);assert.equal(a.state.booth,null);
 }
 model(a).guideChoices.find(c=>c.id==='donate').pick();assert.equal(a.state.screen,'donate');
});

test('each donation opens its own NFC editor, then saves a distinct persistent tag',async()=>{
 const records=new Map(),a=app(records),ids=[];
 for(const color of ['red','black']){
  a.chooseIntent('donate');a.setState({photo:{id:'00000000-0000-4000-8000-000000000001',url:'/test.jpg',analysis:{message:'Enter details'}},garmentDetails:{name:'Old Denim Jacket',cat:'Denim',color:'Blue',material:'Cotton'},condition:'Good',size:'M',drop:'UTS Grab-A-Fit point'});
  await model(a).finishDonate();
  const id=a.state.newTag.id;ids.push(id);
  assert.equal(a.state.screen,'nfc');assert.equal(model(a).nfc.canBind,true);assert.equal(a.state.nfcDesign.garmentId,id);
  model(a).nfc.change({color});await model(a).nfc.save();assert.equal(a.state.screen,'mytags');
 }
 assert.notEqual(ids[0],ids[1]);const b=app(records);await b.refreshRecords();
 assert.equal(model(b).savedNfcTags.length,2);assert.equal(b.state.nfcDesigns[ids[0]].color,'red');assert.equal(b.state.nfcDesigns[ids[1]].color,'black');
});

test('failed donation stays in the form with its input and retries the same record',async()=>{
 const a=app();a.setState({screen:'donate',condition:'Good',size:'M',drop:'UTS Grab-A-Fit point',desc:'Keep the pocket'});
 const request=a.request;a.request=async()=>{throw Error('Offline');};
 await model(a).finishDonate();const id=a.donationRequestId;
 assert.equal(a.state.screen,'donate');assert.equal(a.state.desc,'Keep the pocket');assert.equal(a.state.nfcDesigns[id],undefined);
 a.request=request;await model(a).finishDonate();assert.equal(a.state.nfcDesign.garmentId,id);assert.equal(a.state.screen,'nfc');
});


test('story feed keeps one card per garment and includes participated and explicitly featured stories',async()=>{
 const a=app();await a.vote('g2');a.state.boardGarment='g2';a.state.draft='Keep the stitching';await model(a).postMessage();
 assert.equal(model(a).threads.cards.filter(g=>g.id==='g2').length,1);
 assert.equal(model(a).threads.cards.find(g=>g.id==='g2').note,'Keep the stitching');
 model(a).threads.setFilter('mine');assert.deepEqual(model(a).threads.cards.map(g=>g.id),['g1','g2']);
 model(a).threads.cards.find(g=>g.id==='g2').open();assert.equal(a.state.boardGarment,'g2');assert.equal(a.state.boardTab,'story');
 assert.equal(model(a).boardStory.name,'Hoodie to Everyday Tote');model(a).setBoardTab('notes');assert.equal(model(a).boardPosts[0].text,'Keep the stitching');
 model(a).closeBoard();assert.equal(a.state.screen,'messages');assert.equal(a.state.threadFilter,'mine');
});

test('new donation timeline never invents a finished transformation',async()=>{
 const a=app();a.setState({condition:'Good',size:'M',drop:'UTS Grab-A-Fit point',desc:'My first concert jacket'});await model(a).finishDonate();
 const id=a.state.newTag.id;model(a).threads.cards.find(g=>g.id===id).open();
 const story=model(a).boardStory;assert.equal(story.donated,true);assert.equal(story.stage,'Awaiting a maker');assert.equal(story.chapters[0].text,'My first concert jacket');assert.equal(story.chapters.length,2);assert.equal(story.chapters[1].kind,'pending');
 assert.doesNotMatch(renderToStaticMarkup(a.render()),/Reimagined by|water saved|Ready for its next chapter/);
 model(a).boardShare();assert.equal(model(a).tag.id,id);
});


test('skip leaves a completed donation intact without saving a tag',async()=>{
 const a=app();a.setState({condition:'Good',size:'M',drop:'UTS Grab-A-Fit point'});await model(a).finishDonate();
 const id=a.state.newTag.id;assert.equal(a.state.screen,'nfc');model(a).nfc.skip();
 assert.equal(a.state.screen,'messages');assert.equal(a.state.threadFilter,'mine');assert.equal(a.state.nfcDesigns[id],undefined);assert.equal(a.item(id).name,'Old Denim Jacket');
});
test('one-photo donation needs only a user name, even when recognition is unavailable',async()=>{
 const a=app();a.setState({screen:'donate',photo:null});assert.equal(model(a).step1Blocked,true);model(a).toStep2();assert.equal(a.state.donateStep,1);
 a.setState({photo:{id:'photo',url:'/test.jpg',analysis:{message:'Enter details'}},garmentDetails:{name:'',cat:'',color:'',material:''}});assert.equal(model(a).step1Blocked,true);
 model(a).updateGarment('name','   ');assert.equal(model(a).step1Blocked,true);
 model(a).updateGarment('name','Blue shirt');assert.equal(model(a).step1Blocked,false);
 a.setState({photoBusy:true});model(a).toStep2();assert.equal(a.state.donateStep,1);
 a.setState({photoBusy:false});model(a).toStep2();assert.equal(a.state.donateStep,2);
 let saved;const request=a.request;a.request=action=>{saved=action;return request(action);};
 a.setState({condition:'Good',size:'Not sure',drop:'UTS Grab-A-Fit point'});await model(a).finishDonate();
 assert.equal(saved.type,'donation');assert.equal(saved.value.name,'Blue shirt');assert.equal(saved.value.cat,'Other');
 assert.equal(saved.value.color,'');assert.equal(saved.value.material,'');assert.equal(a.state.screen,'nfc');
});
test('Mei stays in navigation and both story levels show before and after',()=>{
 const a=app();model(a).tabs[0].pick();let html=renderToStaticMarkup(a.render());assert.match(html,/Main navigation/);assert.match(html,/Start donating/);
 model(a).startDonate();assert.equal(a.state.screen,'donate');
 a.setState({screen:'messages'});html=renderToStaticMarkup(a.render());assert.match(html,/Before/);assert.match(html,/After/);
 model(a).threads.cards[0].open();model(a).setBoardTab('notes');html=renderToStaticMarkup(a.render());assert.match(html,/Shared garment chat room/);assert.doesNotMatch(html,/your notes are saved for you|Notes along the way/);
});


test('Alex’s featured story uses the supplied before and concept after without granting NFC eligibility',()=>{
 const a=app();model(a).threads.setFilter('mine');
 const story=model(a).threads.cards.find(g=>g.id==='g2');assert.ok(story);assert.equal(story.designer,'@Alex');assert.equal(story.mine,false);assert.equal(story.featured,true);
 assert.equal(story.beforeImage,'/assets/hao-hoodie-before.jpg');assert.equal(story.afterImage,'/assets/hao-tote-after.png');assert.equal(story.concept,true);
 story.open();const html=renderToStaticMarkup(a.render());assert.match(html,/AI-generated design concept/);assert.match(html,/physical transformation is still to come/);assert.doesNotMatch(html,/maker-process.png/);
 model(a).setBoardTab('notes');const chat=renderToStaticMarkup(a.render());assert.match(chat,/strap tested at 8kg/);assert.match(chat,/@Alex/);assert.doesNotMatch(chat,/@Hao/);assert.doesNotMatch(chat,/Sample/);assert.match(chat,/@Tomas/);assert.doesNotMatch(chat,/online|Updates every few|Chatting as|This browser keeps/);
});


test('following saves a story across reloads without granting participation or NFC binding',async()=>{
 const records=new Map(),a=app(records);a.setState({modal:'n1'});
 await model(a).followStory();assert.equal(model(a).storyFollowing,true);
 model(a).threads.setFilter('mine');assert.ok(model(a).threads.cards.some(g=>g.id==='n1'));
 assert.equal(model(a).canDesignStory,false);assert.ok(!model(a).nfc.garments.some(g=>g.id==='n1'));
 const b=app(records);await b.refreshRecords();b.setState({modal:'n1'});assert.equal(model(b).storyFollowing,true);
 await model(b).followStory();model(b).threads.setFilter('mine');assert.ok(!model(b).threads.cards.some(g=>g.id==='n1'));
 assert.equal(b.state.points,120);
});

test('donation audience is selectable, survives a failed save, and is stored on the garment',async()=>{
 const a=app();assert.equal(a.state.donationVisibility,'public');
 model(a).setDonationVisibility('private');a.setState({condition:'Good',size:'M',drop:'UTS Grab-A-Fit point'});
 const request=a.request;a.request=async()=>{throw Error('Offline');};await model(a).finishDonate();assert.equal(a.state.donationVisibility,'private');
 a.request=request;await model(a).finishDonate();const id=a.state.newTag.id;
 assert.equal(a.item(id).visibility,'private');assert.equal(a.state.donationVisibility,'public');
 a.setState({modal:id});const screen=a.state.screen;model(a).shareStory();assert.equal(a.state.screen,screen);assert.equal(a.lastToast,'Only you can view this story.');
});

test('letter sharing keeps the chosen story and cancel restores the correct screen',()=>{
 const a=app();a.setState({screen:'board',boardGarment:'g2',modal:null});model(a).boardShare();
 assert.equal(a.state.screen,'tag');assert.equal(model(a).tag.id,'g2');model(a).closeTagView();assert.equal(a.state.screen,'board');assert.equal(a.state.modal,null);
 a.setState({screen:'mytags',modal:'g1'});model(a).shareStory();model(a).closeTagView();assert.equal(a.state.screen,'mytags');assert.equal(a.state.modal,'g1');
 const receipt={id:'receipt',garment:{id:'g2',name:'Shared tote'},donor:{name:'The donor',note:'A memory'},senderHandle:'alex',toHandle:'lily',opened:false};
 a.setState({receivedLetters:[receipt],threadFilter:'friends'});model(a).openReceivedLetter(receipt);assert.equal(a.state.screen,'tag');const letterHtml=renderToStaticMarkup(a.render());assert.match(letterHtml,/Close invitation/);assert.doesNotMatch(letterHtml,/>Cancel<|>Delete<|>Close</);model(a).letterRead(receipt.id);assert.equal(a.state.receivedLetters[0].opened,true);model(a).closeTagView();assert.equal(a.state.screen,'messages');assert.equal(a.state.threadFilter,'friends');assert.equal(a.state.modal,null);
});

test('invitations use the sender voice and keep existing received messages',async()=>{
 const a=app();a.setState({profile:{handle:'lily',displayHandle:'Lily'},screen:'board',boardGarment:'g2'});
 model(a).boardShare();const compose=renderToStaticMarkup(a.render());
 assert.match(compose,/>INVITE</);assert.match(compose,/What could its next chapter look like/);assert.match(compose,/@Lily/);
 const receipt={id:'invite',garment:{id:'g2',name:'Hoodie to Everyday Tote'},message:'Could we reuse the pockets?',donor:{name:'Original donor',note:'An older memory'},senderHandle:'alex',toHandle:'lily',opened:true};
 model(a).openReceivedLetter(receipt);const received=renderToStaticMarkup(a.render());
 assert.match(received,/Could we reuse the pockets/);assert.match(received,/>View story</);assert.match(received,/>Join chat</);
 a.setState({draft:'A draft for another garment',attachment:{name:'old.jpg'},replyTarget:'@Other'});
 await model(a).joinReceivedChat('g2');assert.equal(a.state.screen,'board');assert.equal(a.state.boardGarment,'g2');assert.equal(a.state.boardTab,'notes');assert.equal(a.state.boardReturn,'messages');assert.equal(a.state.threadFilter,'friends');assert.equal(a.state.receivedLetter,null);assert.equal(a.state.draft,'');assert.equal(a.state.attachment,null);assert.equal(a.state.replyTarget,null);
 model(a).openReceivedLetter(receipt);await model(a).openReceivedStory('g2');assert.equal(a.state.screen,'messages');assert.equal(a.state.modal,'g2');
});

import {createShowroomSwipeHandlers} from '../work/test-build/showroom-swipe.mjs';
import {createChatTimeline,messageCursor} from '../work/test-build/chat-timeline.mjs';
import {storyDiscussion} from '../work/test-build/story-discussion.mjs';

function showroomGesture(){
 const state={},moves=[],captures=[],target={closest:()=>false};
 const handlers=createShowroomSwipeHandlers(state,step=>moves.push(step));
 let prevented=0;
 const event=(extra={})=>({pointerId:1,pointerType:'mouse',isPrimary:true,button:0,clientX:200,clientY:100,target,currentTarget:{setPointerCapture:id=>captures.push(id)},preventDefault:()=>prevented++,stopPropagation(){},...extra});
 const send=(name,extra)=>handlers[name](event(extra));
 const touch=(name,x=200,y=100)=>send(name,{touches:[{identifier:1,clientX:x,clientY:y}],changedTouches:[{identifier:1,clientX:x,clientY:y}],cancelable:true});
 return {send,touch,moves,captures,prevented:()=>prevented};
}
test('showroom capture transfer preserves swipes but does not capture ordinary button taps',()=>{
 const g=showroomGesture();g.send('onPointerDown');g.send('onPointerUp');
 assert.deepEqual(g.captures,[]);
 g.send('onPointerDown');g.send('onPointerMove',{clientX:140});g.send('onLostPointerCapture');
 g.send('onPointerUp',{clientX:110});assert.deepEqual(g.moves,[1]);
 g.send('onClickCapture');assert.equal(g.prevented(),2);
});
test('showroom uses native touch despite cancelled pointer events and ignores vertical scrolling',()=>{
 const g=showroomGesture();g.touch('onTouchStart');g.touch('onTouchMove',120);
 g.send('onPointerCancel',{pointerType:'touch'});g.send('onLostPointerCapture',{pointerType:'touch'});
 g.touch('onTouchEnd',110);assert.deepEqual(g.moves,[1]);assert.equal(g.prevented(),2);
 g.touch('onTouchStart');g.touch('onTouchMove',195,150);g.touch('onTouchEnd',120,200);
 assert.deepEqual(g.moves,[1]);assert.equal(g.prevented(),2);
 g.touch('onTouchStart');g.touch('onTouchMove',280);g.touch('onTouchEnd',280);
 assert.deepEqual(g.moves,[1,-1]);
});
test('shared room summaries count every author without inventing personal participation',()=>{
 const a=app();a.state.followed={g2:true};
 a.state.chatSummary={g2:{count:3,latest:{author:'@Alex',text:'The handles are ready',created:'2026-10-22T01:00:00Z'}}};
 const card=model(a).threads.cards.find(g=>g.id==='g2');
 assert.equal(card.comments,5);assert.equal(card.note,'The handles are ready');assert.equal(card.author,'@Alex');
 assert.equal(card.mine,false);assert.ok(!model(a).nfc.garments.some(g=>g.id==='g2'));
 assert.equal(a.state.points,120);assert.equal(a.state.posts.g2,undefined);
});
test('summaries do not double-count own public messages and preserve private notes and photo previews',()=>{
 const state={posts:{test:[{public:true,text:'Public'},{text:'Private',when:'2026-10-20'}]},chatSummary:{test:{count:2,latest:{text:'',hasPhoto:true,created:'2026-10-22',author:'@Hao'}}}};
 assert.deepEqual(storyDiscussion(state,'test'),{count:3,latest:{text:'Shared a photo',hasPhoto:true,created:'2026-10-22',author:'@Hao'}});
});

const chatMessage=n=>({id:String(n).padStart(4,'0'),created:'2026-10-22T00:00:00.000Z',text:String(n)});
const chatRange=(start,end)=>Array.from({length:end-start+1},(_,i)=>chatMessage(start+i));
function chatFixture(initial){
 let rows=initial,failBefore=false;
 const snapshots=[],unread=[],calls=[];
 const load=async(action,before)=>{
  calls.push({action,before});
  if(before&&failBefore)throw Error('Network interrupted');
  if(action?.type==='delete')rows=rows.filter(m=>m.id!==action.id);
  const eligible=before?rows.filter(m=>messageCursor(m)<before):rows;
  return {messages:eligible.slice(-50),more:eligible.length>50,unread:rows.length};
 };
 const timeline=createChatTimeline(load,s=>snapshots.push(s),n=>unread.push(n));
 return {timeline,snapshots,calls,unread,setRows:value=>{rows=value;},failPaging:value=>{failBefore=value;}};
}
test('returning after over 100 messages fills every gap before publishing or marking read',async()=>{
 const f=chatFixture(chatRange(1,5));await f.timeline.refresh();
 f.setRows(chatRange(1,125));await f.timeline.refresh();
 const current=f.snapshots.at(-1);
 assert.deepEqual(current.messages,chatRange(1,125));assert.equal(current.more,false);
 assert.equal(f.snapshots.length,2);assert.equal(f.calls.filter(c=>c.before).length,2);
 assert.ok(f.calls.every(c=>!c.action));
 await f.timeline.read(messageCursor(current.messages.at(-1)));
 assert.equal(f.calls.at(-1).action.cursor,messageCursor(chatMessage(125)));
});
test('failed catch-up preserves the last complete snapshot and can recover on retry',async()=>{
 const f=chatFixture(chatRange(1,5));await f.timeline.refresh();
 f.setRows(chatRange(1,65));f.failPaging(true);
 await assert.rejects(f.timeline.refresh(),/Network/);
 assert.equal(f.snapshots.length,1);assert.deepEqual(f.unread,[5]);
 f.failPaging(false);await f.timeline.refresh();assert.deepEqual(f.snapshots.at(-1).messages,chatRange(1,65));
});
test('history paging and refresh preserve order, remove deletions and retain the correct history boundary',async()=>{
 const f=chatFixture(chatRange(1,120));await f.timeline.refresh();await f.timeline.older();
 assert.equal(f.snapshots.at(-1).messages[0].id,'0021');assert.equal(f.snapshots.at(-1).more,true);
 f.setRows(chatRange(1,180).filter(m=>m.id!=='0115'));
 await f.timeline.refresh();assert.equal(f.snapshots.at(-1).messages.length,159);assert.equal(f.snapshots.at(-1).more,true);
 await f.timeline.older();assert.equal(f.snapshots.at(-1).messages.length,179);assert.equal(f.snapshots.at(-1).more,false);
 await f.timeline.refresh({type:'delete',id:'0001'});assert.equal(f.snapshots.at(-1).messages[0].id,'0002');
 f.setRows([]);await f.timeline.refresh();assert.deepEqual(f.snapshots.at(-1),{messages:[],more:false});
});
test('polling and writes are serialized, including catch-up from a send response',async()=>{
 const f=chatFixture(chatRange(1,5));await f.timeline.refresh();f.setRows(chatRange(1,65));
 await Promise.all([f.timeline.refresh(),f.timeline.refresh({type:'send',id:'retry-id'})]);
 assert.deepEqual(f.calls.map(c=>c.before?'page':c.action?.type||'poll'),['poll','poll','page','send']);
 assert.deepEqual(f.snapshots.at(-1).messages,chatRange(1,65));
});
test('unmounting a chat cancels queued work and ignores in-flight responses',async()=>{
 let resolve,calls=0;const snapshots=[];
 const timeline=createChatTimeline(()=>{calls++;return new Promise(done=>{resolve=done;});},v=>snapshots.push(v),()=>{});
 const first=timeline.refresh();await Promise.resolve();const queued=timeline.refresh();timeline.dispose();
 resolve({messages:[chatMessage(1)],more:false,unread:1});await Promise.all([first,queued]);
 assert.equal(calls,1);assert.deepEqual(snapshots,[]);
});
