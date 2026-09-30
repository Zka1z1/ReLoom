// Run against the local D1 preview with RELOOM_TEST_URL=http://localhost:3000.
import test from 'node:test';
import assert from 'node:assert/strict';
const base=process.env.RELOOM_TEST_URL;
if(!base||!/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(base))throw Error('Integration tests require a local preview URL');
async function visitor(){const r=await fetch(base+'/api/reloom');assert.equal(r.status,200);const cookie=r.headers.get('set-cookie').split(';')[0];return {cookie,state:await r.json()};}
async function read(cookie){const r=await fetch(base+'/api/reloom',{headers:{cookie}});assert.equal(r.status,200);return r.json();}
async function write(cookie,action,status=200,origin=base){const r=await fetch(base+'/api/reloom',{method:'POST',headers:{cookie,origin,'Content-Type':'application/json'},body:JSON.stringify(action)});const text=await r.text();assert.equal(r.status,status,text);return r.headers.get('content-type')?.includes('json')?JSON.parse(text):text;}
const design=id=>({type:'design',id,value:{garmentId:id,color:'blue',emojis:['🌿']}});
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
 const action={type:'donation',id,value:{condition:'Good',size:'M',drop:'UTS Grab-A-Fit point',note:'My travelling jacket'}};
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
