// Run against the local D1 preview with RELOOM_TEST_URL=http://localhost:3000.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const base=process.env.RELOOM_TEST_URL;
if(!base||!/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(base))throw Error('Integration tests require a local preview URL');
async function visitor(){const r=await fetch(base+'/api/reloom');assert.equal(r.status,200);const cookie=r.headers.get('set-cookie').split(';')[0];return {cookie,state:await r.json()};}
async function read(cookie){const r=await fetch(base+'/api/reloom',{headers:{cookie}});assert.equal(r.status,200);return r.json();}
async function write(cookie,action,status=200,origin=base){const r=await fetch(base+'/api/reloom',{method:'POST',headers:{cookie,origin,'Content-Type':'application/json'},body:JSON.stringify(action)});const text=await r.text();assert.equal(r.status,status,text);return r.headers.get('content-type')?.includes('json')?JSON.parse(text):text;}
async function photo(cookie){const r=await fetch(base+'/api/photos',{method:'POST',headers:{cookie,origin:base,'Content-Type':'image/jpeg'},body:await readFile('tests/fixtures/garment.jpg')});assert.equal(r.status,200,await r.clone().text());return r.json();}
const design=id=>({type:'design',id,value:{garmentId:id,color:'blue',emojis:['🌿']}});
test('public donations are discoverable by other visitors after refresh while private records stay isolated',async()=>{
 const donor=await visitor(),viewer=await visitor(),photoPublic=await photo(donor.cookie),photoPrivate=await photo(donor.cookie);
 const publicId='dn-'+crypto.randomUUID(),privateId='dn-'+crypto.randomUUID();
 const details={name:'Shared hoodie',cat:'Tops',color:'Grey',material:'Not confirmed',condition:'Good',size:'M',drop:'UTS Grab-A-Fit point',note:'Ready for a new chapter.'};
 assert.ok(!viewer.state.publicDonations.some(g=>g.id===publicId));
 await write(donor.cookie,{type:'donation',id:publicId,value:{...details,photoId:photoPublic.id,visibility:'public'}});
 await write(donor.cookie,{type:'donation',id:privateId,value:{...details,name:'Private hoodie',photoId:photoPrivate.id,visibility:'private'}});
 for(const state of [await read(viewer.cookie),(await visitor()).state]){
  const visible=state.publicDonations.filter(g=>g.id===publicId);
  assert.equal(visible.length,1);assert.equal(visible[0].photoUrl,photoPublic.url);
  assert.equal(visible[0].donor,'@'+donor.state.profile.displayHandle);
  assert.ok(!('owner' in visible[0]));assert.ok(!state.publicDonations.some(g=>g.id===privateId));
  assert.ok(!state.ownedDonations.some(g=>[publicId,privateId].includes(g.id)));
  assert.ok(!state.tags.some(g=>[publicId,privateId].includes(g.garmentId)));
  assert.equal(state.chatUnread[publicId],undefined);assert.equal(state.points,120);
 }
 const own=await read(donor.cookie);
 assert.ok(own.ownedDonations.some(g=>g.id===privateId));
 assert.ok(own.ownedDonations.some(g=>g.id===publicId));
 assert.ok(!own.publicDonations.some(g=>[publicId,privateId].includes(g.id)));
 assert.equal((await fetch(base+photoPublic.url,{headers:{cookie:viewer.cookie}})).status,200);
 assert.equal((await fetch(base+photoPrivate.url,{headers:{cookie:viewer.cookie}})).status,404);
 await write(viewer.cookie,design(publicId),400);
});
test('server enforces participation, cookie isolation, origin checks and safe imports',async()=>{
 const a=await visitor(),b=await visitor();
 await write(a.cookie,design('g2'),403);
 await write(a.cookie,{type:'import',value:{g2:design('g2').value}});
 assert.equal((await read(a.cookie)).nfcDesigns.g2,undefined);
 await write(a.cookie,{type:'vote',id:'g2'},403,'https://untrusted.example');
 await write('',{type:'vote',id:'g2'},401);
 await write(a.cookie,{type:'vote',id:'g2'});
 await write(a.cookie,design('g2'));
 const restored=await read(a.cookie);assert.equal(restored.voted.g2,true);assert.equal(restored.nfcDesigns.g2.color,'blue');
 assert.equal((await read(b.cookie)).nfcDesigns.g2,undefined);
});
test('concurrent writes do not overwrite tags or duplicate vote rewards',async()=>{
 const a=await visitor();
 await Promise.all([write(a.cookie,{type:'vote',id:'g2'}),write(a.cookie,{type:'vote',id:'g2'})]);
 await Promise.all([write(a.cookie,design('g1')),write(a.cookie,design('g2'))]);
 const state=await read(a.cookie);assert.equal(state.points,125);assert.deepEqual(Object.keys(state.nfcDesigns).sort(),['g1','g2']);
});
test('donation persists, has a real public story link and supports NFC and comments',async()=>{
 const a=await visitor(),b=await visitor(),id='dn-'+crypto.randomUUID();
 const uploaded=await photo(a.cookie);
 const action={type:'donation',id,value:{photoId:uploaded.id,name:'Blue jacket',cat:'Outerwear',color:'Blue',material:'Not confirmed',condition:'Good',size:'M',drop:'UTS Grab-A-Fit point',note:'My travelling jacket'}};
 await write(a.cookie,action);await write(a.cookie,action);
 await write(a.cookie,design(id));
 const restored=await read(a.cookie);assert.equal(restored.tags[0].garmentId,id);assert.equal(restored.ownedDonations[0].note,'My travelling jacket');assert.equal(restored.points,160);
 const publicResponse=await fetch(base+'/api/reloom?story='+encodeURIComponent(id));assert.equal(publicResponse.status,200);const shared=(await publicResponse.json()).garment;assert.equal(shared.id,id);assert.equal(shared.note,'My travelling jacket');assert.equal(shared.donor,'Previous wearer');
 await write(b.cookie,design(id),400);
 await write(b.cookie,{type:'post',id:crypto.randomUUID(),value:{garmentId:id,text:'I joined this story'}});
 await write(b.cookie,design(id));
 const bRestored=await read(b.cookie);assert.equal(bRestored.sharedGarments[0].id,id);assert.equal(bRestored.nfcDesigns[id].garmentId,id);
 const unknown=await fetch(base+'/api/reloom?story=missing');assert.equal(unknown.status,404);
});

async function room(cookie,id,action,status=200,origin=base){
 const r=await fetch(base+'/api/chat?room='+encodeURIComponent(id),{headers:{cookie,...(action?{origin,'Content-Type':'application/json'}:{})},...(action?{method:'POST',body:JSON.stringify({...action,room:id})}:{})});
 assert.equal(r.status,status,await r.clone().text());return r.headers.get('content-type')?.includes('json')?r.json():r.text();
}
test('two independent visitors share messages and presence, private old notes stay private',async()=>{
 const a=await visitor(),b=await visitor();
 await write(a.cookie,{type:'post',id:crypto.randomUUID(),value:{garmentId:'b2',text:'PRIVATE earlier note'}});
 await room(a.cookie,'b2',{type:'presence'});let data=await room(b.cookie,'b2',{type:'presence'});
 assert.ok(data.people.length>=2);assert.ok(data.people.some(p=>p.mine));
 const id=crypto.randomUUID();await room(a.cookie,'b2',{type:'send',id,text:'Shared from visitor A'});
 await room(a.cookie,'b2',{type:'send',id,text:'Shared from visitor A'});
 data=await room(b.cookie,'b2');assert.equal(data.messages.filter(m=>m.id===id).length,1);assert.equal(data.messages.find(m=>m.id===id).mine,false);
 assert.ok(!data.messages.some(m=>m.text==='PRIVATE earlier note'));assert.ok(data.messages.every(m=>!('owner' in m)));
 assert.ok(!(await room(b.cookie,'g2')).messages.some(m=>m.id===id));
 await room(b.cookie,'b2',{type:'delete',id},403);
 await room(a.cookie,'b2',{type:'delete',id});assert.ok(!(await room(b.cookie,'b2')).messages.some(m=>m.id===id));
 await room(b.cookie,'b2',{type:'leave'});assert.ok(!(await room(a.cookie,'b2')).people.some(p=>p.name===data.me));
 await room('', 'b2',null,401);await room(a.cookie,'missing',null,404);
 await room(a.cookie,'b2',{type:'send',id:crypto.randomUUID(),text:'invalid origin'},403,'https://untrusted.example');
});
test('shared chat creates participation only for its sender and survives reload',async()=>{
 const a=await visitor(),b=await visitor(),id=crypto.randomUUID();
 await room(a.cookie,'n2',{type:'send',id,text:'Keep the original stitching.'});
 await write(a.cookie,design('n2'));await write(b.cookie,design('n2'),403);
 const saved=await read(a.cookie);assert.ok(saved.posts.n2.some(p=>p.text==='Keep the original stitching.'&&p.public));
 assert.equal(saved.nfcDesigns.n2.garmentId,'n2');
 const list=await room(b.cookie,'n2');assert.ok(list.messages.some(m=>m.id===id));
});
test('one real photo is private before donation, public after, and cannot be stolen',async()=>{
 const a=await visitor(),b=await visitor(),p=await photo(a.cookie);
 assert.equal(p.analysis.status,'unavailable');assert.ok(!p.analysis.details);
 const get=async cookie=>fetch(base+p.url,{headers:{cookie}});
 assert.equal((await get(a.cookie)).status,200);assert.equal((await get(b.cookie)).status,404);
 const value={photoId:p.id,name:'My blue jacket',cat:'Outerwear',color:'Blue',material:'Not confirmed',condition:'Good',size:'Not sure',drop:'UTS Grab-A-Fit point',note:'Kept the original pocket'};
 await write(b.cookie,{type:'donation',id:'dn-'+crypto.randomUUID(),value},400);
 const id='dn-'+crypto.randomUUID();await write(a.cookie,{type:'donation',id,value});
 assert.equal((await get(b.cookie)).status,200);const shared=await fetch(base+'/api/reloom?story='+id).then(r=>r.json());assert.equal(shared.garment.photoUrl,p.url);assert.equal(shared.garment.name,'My blue jacket');
 const bad=await fetch(base+'/api/photos',{method:'POST',headers:{cookie:a.cookie,origin:base,'Content-Type':'image/jpeg'},body:'not an image'});assert.equal(bad.status,415);
 const over=await fetch(base+'/api/photos',{method:'POST',headers:{cookie:a.cookie,origin:base,'Content-Type':'image/jpeg'},body:new Uint8Array(3*1024*1024+1)});assert.equal(over.status,413);
});


test('unread counts are device-specific, monotonic, durable and exclude your own messages',async()=>{
 const a=await visitor(),b=await visitor();
 assert.notEqual((await room(a.cookie,'b1')).me,(await room(b.cookie,'b1')).me);
 // Use a fresh donation room, isolated from earlier runs.
 const p=await photo(a.cookie),id='dn-'+crypto.randomUUID();
 await write(a.cookie,{type:'donation',id,value:{photoId:p.id,name:'Unread test garment',cat:'Tops',color:'Grey',material:'Not confirmed',condition:'Good',size:'M',drop:'UTS Grab-A-Fit point',note:''}});
 const first=crypto.randomUUID(),second=crypto.randomUUID();
 let data=await room(a.cookie,id,{type:'send',id:first,text:'First message'});assert.equal(data.unread,0);
 data=await room(b.cookie,id);assert.equal(data.unread,1);const cursor=data.messages.at(-1).created+first;
 await room(b.cookie,id,{type:'read',cursor:'2099-01-01T00:00:00.000Z'+first},400);
 assert.equal((await room(b.cookie,id)).unread,1);
 assert.equal((await room(b.cookie,id,{type:'read',cursor})).unread,0);
 assert.equal((await room(b.cookie,id)).unread,0);
 await room(a.cookie,id,{type:'send',id:second,text:'Second message'});
 data=await room(b.cookie,id);assert.equal(data.unread,1);const newest=data.messages.at(-1);const latest=newest.created+newest.id;
 await room(b.cookie,id,{type:'read',cursor:latest});await room(b.cookie,id,{type:'read',cursor});assert.equal((await room(b.cookie,id)).unread,0);
 await room(b.cookie,id,{type:'send',id:crypto.randomUUID(),text:'Reply from another device'});
 assert.equal((await room(b.cookie,id)).unread,0);assert.equal((await room(a.cookie,id)).unread,1);
 assert.equal((await room(a.cookie,id)).me,(await room(a.cookie,id)).me);
});

test('My aggregates participated rooms, excludes unrelated rooms and clears only messages actually read',async()=>{
 const a=await visitor(),b=await visitor(),c=await visitor();
 const createRoom=async(name,visibility='public')=>{
  const p=await photo(b.cookie),id='dn-'+crypto.randomUUID();
  await write(b.cookie,{type:'donation',id,value:{photoId:p.id,visibility,name,cat:'Tops',color:'Grey',material:'Not confirmed',condition:'Good',size:'M',drop:'UTS Grab-A-Fit point',note:''}});
  return id;
 };
 const first=await createRoom('First room'),second=await createRoom('Second room'),unrelated=await createRoom('Unrelated room'),privateRoom=await createRoom('Private room','private');
 for(const id of [first,second])await room(a.cookie,id,{type:'send',id:crypto.randomUUID(),text:'I would love to help.'});
 // Following and looking around must not subscribe someone to a chat they never participated in.
 await write(a.cookie,{type:'follow',id:unrelated,value:{active:true}});
 await room(a.cookie,unrelated);
 for(const id of [first,second,unrelated,privateRoom])await room(b.cookie,id,{type:'send',id:crypto.randomUUID(),text:'A new idea for the garment.'});
 const counts=(await read(a.cookie)).chatUnread;
 assert.equal(counts[first],1);assert.equal(counts[second],1);
 assert.equal(counts[unrelated],undefined);assert.equal(counts[privateRoom],undefined);
 assert.equal((await read(c.cookie)).chatUnread[first],undefined);
 assert.equal((await read(b.cookie)).chatUnread[first],1); // The donor sees the participant's message, never their own.
 const opened=await room(a.cookie,first),latest=opened.messages.at(-1);
 assert.equal((await read(a.cookie)).chatUnread[first],1); // Fetching or selecting My is not a read receipt.
 await room(a.cookie,first,{type:'read',cursor:latest.created+latest.id});
 const after=(await read(a.cookie)).chatUnread;
 assert.equal(after[first],0);assert.equal(after[second],1);
 assert.equal(after.g1,(await room(a.cookie,'g1')).unread); // Seed comments use the same cursor rules.
 await room(a.cookie,'g1',{type:'read',cursor:'intro'});
 assert.equal((await read(a.cookie)).chatUnread.g1,(await room(a.cookie,'g1')).unread);
 // Built-in newly donated garments also count once the visitor has contributed.
 await room(c.cookie,'don-shirt',{type:'send',id:crypto.randomUUID(),text:'Could we keep the striped fabric?'});
 assert.equal((await read(c.cookie)).chatUnread['don-shirt'],(await room(c.cookie,'don-shirt')).unread);
});


test('story follows are durable, visitor-scoped, reversible and do not count as participation',async()=>{
 const a=await visitor(),b=await visitor();
 const follow={type:'follow',id:'n1',value:{active:true}};
 await write(a.cookie,follow);await write(a.cookie,follow);
 assert.equal((await read(a.cookie)).followed.n1,true);assert.equal((await read(a.cookie)).points,120);
 assert.equal((await read(b.cookie)).followed.n1,undefined);
 await write(a.cookie,design('n1'),403);
 await write(a.cookie,{...follow,value:{active:false}});assert.equal((await read(a.cookie)).followed.n1,undefined);
 await write(a.cookie,{...follow,id:'missing'},400);
 await write(a.cookie,{...follow,value:{active:'yes'}},400);
 // A followed public donation resolves after a fresh snapshot, without a comment or vote.
 const p=await photo(b.cookie),id='dn-'+crypto.randomUUID();
 await write(b.cookie,{type:'donation',id,value:{photoId:p.id,name:'Followed jacket',cat:'Outerwear',color:'Blue',material:'Not confirmed',condition:'Good',size:'M',drop:'UTS Grab-A-Fit point',note:'A shared story'}});
 await write(a.cookie,{...follow,id});const restored=await read(a.cookie);
 assert.equal(restored.followed[id],true);assert.ok(restored.sharedGarments.some(g=>g.id===id));
 await write(a.cookie,design(id),403);
});

test('private donations protect the story, photo and room even when their URLs are known',async()=>{
 const a=await visitor(),b=await visitor(),p=await photo(a.cookie),id='dn-'+crypto.randomUUID();
 const value={visibility:'private',photoId:p.id,name:'Private jacket',cat:'Outerwear',color:'Blue',material:'Not confirmed',condition:'Good',size:'M',drop:'UTS Grab-A-Fit point',note:'Private memory'};
 await write(a.cookie,{type:'donation',id,value});
 const restored=await read(a.cookie);assert.equal(restored.ownedDonations.find(g=>g.id===id).visibility,'private');
 for(const cookie of ['',b.cookie]){
  assert.equal((await fetch(base+'/api/reloom?story='+id,{headers:{cookie}})).status,404);
  assert.equal((await fetch(base+p.url,{headers:{cookie}})).status,404);
 }
 assert.equal((await fetch(base+'/api/reloom?story='+id,{headers:{cookie:a.cookie}})).status,200);
 assert.equal((await fetch(base+p.url,{headers:{cookie:a.cookie}})).status,200);
 await room(a.cookie,id,{type:'send',id:crypto.randomUUID(),text:'Owner-only note'});
 await room(b.cookie,id,null,404);
 await room(b.cookie,id,{type:'send',id:crypto.randomUUID(),text:'Unauthorized message'},404);
 await write(b.cookie,{type:'follow',id,value:{active:true}},400);
 await write(b.cookie,{type:'post',id:crypto.randomUUID(),value:{garmentId:id,text:'Unauthorized note'}},400);
 await write(b.cookie,design(id),400);
 assert.ok(!(await read(b.cookie)).sharedGarments.some(g=>g.id===id));
 // Retrying a donation must not accidentally change the original audience.
 await write(a.cookie,{type:'donation',id,value:{...value,visibility:'public'}});
 assert.equal((await fetch(base+p.url)).status,404);
 await write(a.cookie,{type:'donation',id:'dn-'+crypto.randomUUID(),value:{...value,visibility:'everyone-ish'}},400);
});

test('story letters reach only their recipient, are durable and do not grant NFC participation',async()=>{
 const a=await visitor(),b=await visitor(),c=await visitor();
 const send=async(cookie,action,status=200,origin=base)=>{const r=await fetch(base+'/api/letters',{method:'POST',headers:{cookie,origin,'Content-Type':'application/json'},body:JSON.stringify(action)});const text=await r.text();assert.equal(r.status,status,text);return r.headers.get('content-type')?.includes('json')?JSON.parse(text):text;};
 const bName='friend-'+crypto.randomUUID().slice(0,8);
 await send(b.cookie,{type:'profile',handle:bName.toUpperCase()});
 assert.equal((await read(b.cookie)).profile.displayHandle,bName.toUpperCase());
 await send(b.cookie,{type:'profile',handle:bName[0].toUpperCase()+bName.slice(1)});
 assert.equal((await read(b.cookie)).profile.displayHandle,bName[0].toUpperCase()+bName.slice(1));
 await send(c.cookie,{type:'profile',handle:bName.toUpperCase()},409);
 await send(c.cookie,{type:'profile',handle:'member-fake'},400);
 assert.equal((await read(b.cookie)).profile.handle,bName);
 await write(a.cookie,{type:'vote',id:'g2'});await write(a.cookie,design('g2'));
 const action={type:'send',id:crypto.randomUUID(),recipient:'@'+bName.toUpperCase(),garmentId:'g2'};
 await send(a.cookie,action,403,'https://untrusted.example');
 await send('',action,401);
 await send(a.cookie,{...action,recipient:'missing-'+crypto.randomUUID().slice(0,8)},404);
 await send(a.cookie,{...action,recipient:a.state.profile.handle},400);
 await Promise.all([send(a.cookie,action),send(a.cookie,action)]);
 const inbox=(await read(b.cookie)).receivedLetters;
 assert.equal(inbox[0].toDisplayHandle,bName[0].toUpperCase()+bName.slice(1));
 assert.equal(inbox.length,1);assert.equal(inbox[0].garment.id,'g2');assert.equal(Object.hasOwn(inbox[0],'design'),false);assert.equal((await read(a.cookie)).nfcDesigns.g2.color,'blue');assert.equal(inbox[0].senderHandle,a.state.profile.handle);assert.equal(inbox[0].opened,false);
 assert.equal(inbox[0].sender,undefined);assert.equal(inbox[0].recipient,undefined);
 assert.equal((await read(c.cookie)).receivedLetters.length,0);assert.equal((await read(a.cookie)).receivedLetters.length,0);
 await send(c.cookie,{type:'read',id:action.id},404);
 await send(b.cookie,{type:'read',id:action.id});assert.equal((await read(b.cookie)).receivedLetters[0].opened,true);
 await write(b.cookie,design('g2'),403);
 await send(a.cookie,{...action,garmentId:'g1'},409);
 await send(c.cookie,action,409);
 // Renaming never redirects an already delivered letter; retries stay idempotent.
 await send(b.cookie,{type:'profile',handle:bName+'x'});await send(a.cookie,action);assert.equal((await read(b.cookie)).receivedLetters.length,1);
 const p=await photo(a.cookie),id='dn-'+crypto.randomUUID();
 await write(a.cookie,{type:'donation',id,value:{visibility:'private',photoId:p.id,name:'Private letter test',cat:'Tops',color:'Grey',material:'Not confirmed',condition:'Good',size:'M',drop:'UTS Grab-A-Fit point',note:'Not for sharing'}});
 await send(a.cookie,{type:'send',id:crypto.randomUUID(),recipient:bName+'x',garmentId:id},403);
 assert.equal((await read(b.cookie)).receivedLetters.length,1);
 // Only the recipient can delete; deletion is durable and retries cannot resurrect a letter.
 await write(b.cookie,{type:'follow',id:'g2',value:{active:true}});
 await send(c.cookie,{type:'delete',id:action.id},404);
 await send(a.cookie,{type:'delete',id:action.id},404);
 assert.equal((await read(b.cookie)).receivedLetters.length,1);
 await send(b.cookie,{type:'delete',id:action.id});await send(b.cookie,{type:'delete',id:action.id});
 await send(a.cookie,action);
 const afterDelete=await read(b.cookie);assert.equal(afterDelete.receivedLetters.length,0);assert.equal(afterDelete.followed.g2,true);
 await send(b.cookie,{type:'read',id:action.id},404);
 await write(b.cookie,design('g2'),403);
});

test('letters use the server donor story and ignore supplied tag designs',async()=>{
 const a=await visitor(),b=await visitor();
 const r=await fetch(base+'/api/letters',{method:'POST',headers:{cookie:a.cookie,origin:base,'Content-Type':'application/json'},body:JSON.stringify({type:'send',id:crypto.randomUUID(),recipient:b.state.profile.handle,garmentId:'g1',donor:{note:'Forged donor note'},design:{color:'red'}})});
 assert.equal(r.status,200,await r.clone().text());
 const letter=(await read(b.cookie)).receivedLetters[0];assert.notEqual(letter.donor.note,'Forged donor note');assert.equal(Object.hasOwn(letter,'design'),false);assert.equal(letter.garment.id,'g1');
});


test('edited letter content is delivered without changing the original story',async()=>{
 const a=await visitor(),b=await visitor();
 const action={type:'send',id:crypto.randomUUID(),recipient:b.state.profile.handle,garmentId:'g1',message:'A little memory for you.\n\nWith care,\nLily'};
 const send=body=>fetch(base+'/api/letters',{method:'POST',headers:{cookie:a.cookie,origin:base,'Content-Type':'application/json'},body:JSON.stringify(body)});
 assert.equal((await send(action)).status,200);
 assert.equal((await send(action)).status,200);
 const letters=(await read(b.cookie)).receivedLetters;
 assert.equal(letters.length,1);assert.equal(letters[0].message,action.message);
 assert.notEqual(letters[0].donor.note,action.message);
 assert.equal((await send({...action,message:'Changed retry'})).status,409);
 for(const message of ['', '   ', {}, 'x'.repeat(4001)])assert.equal((await send({...action,id:crypto.randomUUID(),message})).status,400);
});


test('featured chat starts with two unread introductions and remembers each visitor separately',async()=>{
 const a=await visitor(),b=await visitor();
 const initial=await room(a.cookie,'g2');
 assert.ok(initial.unread>=2);
 await room(a.cookie,'g2',{type:'read',cursor:'intro'},403,'https://untrusted.example');
 const acknowledged=await room(a.cookie,'g2',{type:'read',cursor:'intro'});
 assert.equal(acknowledged.unread,initial.unread-2);
 assert.equal((await room(a.cookie,'g2')).unread,acknowledged.unread);
 assert.equal((await room(b.cookie,'g2')).unread,initial.unread);
 assert.equal((await room(a.cookie,'g2',{type:'read',cursor:'intro'})).unread,acknowledged.unread);
 // Restoring unread is durable, visitor-scoped, and also surfaces in My.
 await room('', 'g2',{type:'unread'},401);
 await room(a.cookie,'g2',{type:'unread'},403,'https://untrusted.example');
 await room(a.cookie,'missing',{type:'unread'},404);
 const otherRoom=(await room(a.cookie,'g1')).unread;
 const restored=await room(a.cookie,'g2',{type:'unread'});
 assert.equal(restored.unread,initial.unread);assert.deepEqual(restored.messages,initial.messages);
 assert.equal((await room(a.cookie,'g2')).unread,initial.unread);
 assert.equal((await room(a.cookie,'g1')).unread,otherRoom);
 assert.equal((await room(b.cookie,'g2')).unread,initial.unread);
 assert.equal((await read(a.cookie)).chatUnread.g2,initial.unread);
 assert.equal((await room(a.cookie,'g2',{type:'unread'})).unread,initial.unread);
 await write(a.cookie,design('g2'),403); // A reminder never grants NFC participation.
 await room(a.cookie,'g2',{type:'read',cursor:'intro'});
 assert.equal((await read(a.cookie)).chatUnread.g2,acknowledged.unread);
 await room(a.cookie,'n1',{type:'read',cursor:'intro'},400);
});

test('chat usernames follow the saved profile, including historical messages after renaming',async()=>{
 const a=await visitor(),b=await visitor(),id=crypto.randomUUID();
 const name='Chat-'+crypto.randomUUID().slice(0,8);
 const rename=async handle=>{
  const r=await fetch(base+'/api/letters',{method:'POST',headers:{cookie:a.cookie,origin:base,'Content-Type':'application/json'},body:JSON.stringify({type:'profile',handle})});
  assert.equal(r.status,200,await r.clone().text());
 };
 await rename(name);
 try{
  const own=await room(a.cookie,'n1',{type:'send',id,text:'Profile display check'});
  assert.equal(own.messages.find(m=>m.id===id).author,'@'+name);
  assert.equal((await room(b.cookie,'n1')).messages.find(m=>m.id===id).author,'@'+name);
  await rename(name+'x');
  assert.equal((await room(b.cookie,'n1')).messages.find(m=>m.id===id).author,'@'+name+'x');
 }finally{await room(a.cookie,'n1',{type:'delete',id});}
});

test('chat photos stay private until sent, survive reload, reject theft and disappear for others after removal',async()=>{
 const a=await visitor(),b=await visitor(),p=await photo(a.cookie),id=crypto.randomUUID();
 const get=cookie=>fetch(base+p.url,{headers:{cookie}});
 assert.equal((await get(b.cookie)).status,404);
 await room(b.cookie,'n1',{type:'send',id:crypto.randomUUID(),text:'',photoId:p.id},400);
 await room(a.cookie,'n1',{type:'send',id:crypto.randomUUID(),text:'',photoId:'invalid'},400);
 const action={type:'send',id,text:'',photoId:p.id};
 try{
  await room(a.cookie,'n1',action);await room(a.cookie,'n1',action);
  const data=await room(b.cookie,'n1');assert.equal(data.messages.filter(m=>m.id===id).length,1);
  assert.equal(data.messages.find(m=>m.id===id).photoUrl,p.url);
  assert.equal((await get(b.cookie)).status,200);
  assert.equal((await get('')).status,200);
  await room(a.cookie,'n1',{...action,text:'Changed retry'},409);
  const remove=await fetch(base+p.url,{method:'DELETE',headers:{cookie:a.cookie,origin:base}});assert.equal(remove.status,409);
 }finally{await room(a.cookie,'n1',{type:'delete',id});}
 assert.equal((await get(b.cookie)).status,404);
 assert.equal((await get(a.cookie)).status,200);
});

test('photos in a private garment chat are not exposed to other visitors',async()=>{
 const a=await visitor(),b=await visitor(),garmentPhoto=await photo(a.cookie),attachment=await photo(a.cookie),id='dn-'+crypto.randomUUID();
 await write(a.cookie,{type:'donation',id,value:{visibility:'private',photoId:garmentPhoto.id,name:'Private photo room',cat:'Tops',color:'Grey',material:'Not confirmed',condition:'Good',size:'M',drop:'UTS Grab-A-Fit point',note:''}});
 await room(a.cookie,id,{type:'send',id:crypto.randomUUID(),text:'A detail photo',photoId:attachment.id});
 assert.equal((await fetch(base+attachment.url,{headers:{cookie:a.cookie}})).status,200);
 for(const cookie of ['',b.cookie])assert.equal((await fetch(base+attachment.url,{headers:{cookie}})).status,404);
});

test('story summaries include all room members, exclude private notes and never grant participation',async()=>{
 const donor=await visitor(),maker=await visitor(),follower=await visitor();
 const image=await photo(donor.cookie),id='dn-'+crypto.randomUUID(),privateId='dn-'+crypto.randomUUID();
 const details={name:'Summary test hoodie',cat:'Tops',color:'Grey',material:'Cotton',condition:'Good',size:'M',drop:'UTS Grab-A-Fit point',note:'A memory.',photoId:image.id};
 await write(donor.cookie,{type:'donation',id,value:{...details,visibility:'public'}});
 await write(donor.cookie,{type:'donation',id:privateId,value:{...details,visibility:'private'}});
 await write(follower.cookie,{type:'follow',id,value:{active:true}});
 const first=crypto.randomUUID(),second=crypto.randomUUID();
 await room(donor.cookie,id,{type:'send',id:first,text:'The cuffs are worn.'});
 await room(maker.cookie,id,{type:'send',id:second,text:'We can keep the pockets.'});
 await write(donor.cookie,{type:'post',id:crypto.randomUUID(),value:{garmentId:id,text:'Only my private memory'}});
 await room(donor.cookie,privateId,{type:'send',id:crypto.randomUUID(),text:'A private room message'});
 const state=await read(follower.cookie),summary=state.chatSummary[id];
 assert.equal(summary.count,2);assert.equal(summary.latest.text,'We can keep the pockets.');
 assert.equal(summary.latest.author,'@'+maker.state.profile.displayHandle);
 assert.ok(!('owner' in summary.latest));assert.equal(state.chatSummary[privateId],undefined);
 assert.equal(state.posts[id],undefined);assert.equal(state.points,120);
 await write(follower.cookie,design(id),403);
 const own=await read(donor.cookie);assert.equal(own.chatSummary[id].count,2);assert.equal(own.posts[id].length,2);
 await room(maker.cookie,id,{type:'delete',id:second});
 const after=(await read(follower.cookie)).chatSummary[id];
 assert.equal(after.count,1);assert.equal(after.latest.id,first);
});
