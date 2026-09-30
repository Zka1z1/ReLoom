// A single garment identity is shared by Items, Threads, stories and NFC designs.
export const SEED_TAG = {id:'#PS-1180',garmentId:'g1',name:'Patchwork Cargo Skirt',meta:'good · size S',status:'upcycled · rehomed',dot:'var(--color-neutral-500)',boardLabel:'5 posts',firstMessage:'Note from the last wearer: good · size S'};
export function donationTag(d) {
  return {...d,garmentId:d.id,meta:`${d.condition.toLowerCase()} · size ${d.size}`,status:'waiting for a maker',dot:'var(--color-accent-2)',boardLabel:'Open message board',firstMessage:`Note from the last wearer: ${d.note}`};
}
export function projectRecords(rows) {
  /** @type {{nfcDesigns:Record<string,any>,voted:Record<string,boolean>,votes:Record<string,number>,posts:Record<string,any[]>,ownedDonations:any[],tags:any[],points:number}} */
  const state={nfcDesigns:{},voted:{},votes:{},posts:{},ownedDonations:[],tags:[SEED_TAG],points:120};
  for(const {kind,id,data} of rows) {
    const value=typeof data==='string'?JSON.parse(data):data;
    if(kind==='design')state.nfcDesigns[id]=value;
    if(kind==='vote'){state.voted[id]=true;state.votes[id]=1;state.points+=5;}
    if(kind==='donation'){state.ownedDonations.push(value);state.tags.push(donationTag(value));state.points+=40;}
    if(kind==='post'){(state.posts[value.garmentId]??=[]).push({...value,author:'you',role:'community'});state.points+=10;}
  }
  state.tags=[...state.tags.slice(1),SEED_TAG];
  return state;
}
