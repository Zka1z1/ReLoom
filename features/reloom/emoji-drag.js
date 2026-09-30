export const STRAP_SLOTS=[[94,177,-54],[136,139,-39],[182,100,-39],[222,145,59],[244,191,70],[236,233,110]];
// A drop is atomic: cancelled drags and full straps leave the design untouched.
export function dropEmoji(emojis,source,target) {
 const next=[...emojis], existing=Number.isInteger(source.index)&&source.index>=0&&source.index<next.length;
 if(target==='remove'){if(existing)next.splice(source.index,1);return next;}
 if(!Number.isInteger(target)||target<0||target>5)return next;
 if(!existing&&next.length>=6)return next;
 const emoji=existing?next.splice(source.index,1)[0]:source.emoji;
 if(!emoji)return next;
 next.splice(Math.min(target,next.length),0,emoji);return next;
}
