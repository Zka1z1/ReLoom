import { CATALOG } from './data.js';
import {findGarment} from './domain.js';
export const STRAP_COLORS = [
  {id:'blue',name:'Ocean blue',hex:'#087ac2',dark:'#035589'},
  {id:'red',name:'Cherry red',hex:'#db253a',dark:'#951b2d'},
  {id:'black',name:'Ink black',hex:'#292c32',dark:'#111318'},
];
export const EMOJI_PALETTE = [
  ['🌸','Blossom'],['🌿','Leaf'],['🍄','Mushroom'],['🦋','Butterfly'],['🐈','Cat'],
  ['❤️','Heart'],['⭐','Star'],['☀️','Sun'],['🌙','Moon'],['🌈','Rainbow'],['🍒','Cherries'],
].map(([emoji,name])=>({emoji,name}));
export const DEFAULT_DESIGN = {color:'blue',emojis:['🌿','⭐'],garmentId:'g1'};
export const DESIGN_STORAGE_KEY = 'reloom.nfc-designs.v1';
export function validateDesign(value,donations=[]) {
  if(!value || !STRAP_COLORS.some(c=>c.id===value.color) || !findGarment(value.garmentId,donations) || !Array.isArray(value.emojis) || value.emojis.length>6 || value.emojis.some(e=>!EMOJI_PALETTE.some(p=>p.emoji===e))) return null;
  return {color:value.color,emojis:[...value.emojis],garmentId:value.garmentId};
}
export function readDesigns(storage) {
  try {const data=JSON.parse(storage.getItem(DESIGN_STORAGE_KEY)||'{}');return Object.fromEntries(Object.entries(data).map(([id,d])=>[id,d&&{...d,emojis:Array.isArray(d.emojis)?d.emojis.filter(e=>e!=='🌼'):d.emojis}]).filter(([id,d])=>id===d?.garmentId&&validateDesign(d)).map(([id,d])=>[id,validateDesign(d)]));}catch{return {};}
}
// Prototype participation comes from actual actions, never saved designs or page views.
export function participatingGarments(state) {
  const donated=new Set((state.tags||[]).map(tag=>tag.garmentId).filter(Boolean));
  return [...CATALOG,...(state.donations||[]),...(state.sharedGarments||[])].filter((g,i,all)=>all.findIndex(other=>other.id===g.id)===i).filter(g=>donated.has(g.id)||state.voted?.[g.id]||(state.posts?.[g.id]||[]).some(p=>p.author==='you'));
}
export function canBindStory(state,id) {return participatingGarments(state).some(g=>g.id===id);}

export function storyUrl(id,donations=[]) {return findGarment(id,donations) ? `https://reloom-mobile.z1oey12.chatgpt.site/?story=${encodeURIComponent(id)}` : null;}
export function createNfcModel(self) {
  const s=self.state,design=s.nfcDesign,garments=participatingGarments(s),canBind=canBindStory(s,design.garmentId);
  const change=patch=>self.setState({nfcDesign:{...design,...patch},nfcSaved:false,nfcError:''});
  const save=async()=>{
    if(!canBindStory(self.state,design.garmentId)){self.setState({nfcSaved:false,nfcError:'Choose a story you have participated in.'});return;}
    const valid=validateDesign(design,[...s.donations,...s.sharedGarments]);if(!valid)return;
    if(s.saving)return;
    if(await self.persist({type:'design',id:valid.garmentId,value:valid}))self.setState({nfcSaved:true,nfcError:'',screen:'mytags',modal:null});
    else self.setState({nfcSaved:false,nfcError:self.state.dataError||'Unable to save. Please retry.'});
  };
  return {isOpen:s.screen==='nfc',design,colors:STRAP_COLORS,palette:EMOJI_PALETTE,garments,canBind,
    garment:self.item(design.garmentId),saving:s.saving,color:STRAP_COLORS.find(c=>c.id===design.color),saved:s.nfcSaved,error:s.nfcError,
    change,save,url:canBind?storyUrl(design.garmentId,[...s.donations,...s.sharedGarments]):null,
    selectGarment:id=>{if(!canBindStory(self.state,id))return;const saved=s.nfcDesigns[id]||s.legacyDesigns[id];if(saved)self.setState({nfcDesign:{...saved,emojis:[...saved.emojis]},nfcSaved:true,nfcError:''});else change({garmentId:id});},
    preview:()=>{if(canBindStory(self.state,design.garmentId))self.openStory(design.garmentId);},close:()=>self.setState({screen:s.nfcReturn||'store'}),
  };
}
