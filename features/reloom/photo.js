// Re-encode locally to strip EXIF (including location) and keep phone uploads small.
export async function preparePhoto(file) {
 if(!file||file.size>20*1024*1024)throw Error('Choose a photo smaller than 20 MB.');
 if(!/^image\/(jpeg|png|webp|heic|heif)$/.test(file.type))throw Error('Use a JPEG, PNG, WebP or a camera photo.');
 const url=URL.createObjectURL(file);
 try{
 const img=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(Error('This photo cannot be opened. Please take a new photo or choose a JPEG.'));i.src=url;});
 const scale=Math.min(1,1600/Math.max(img.naturalWidth,img.naturalHeight));
 const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
 const context=canvas.getContext('2d');if(!context)throw Error('Photo processing is unavailable in this browser.');context.fillStyle='#ffffff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(img,0,0,canvas.width,canvas.height);
 return await new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('Unable to prepare this photo.')),'image/jpeg',0.85));
 }finally{URL.revokeObjectURL(url);}
}
export async function uploadPhoto(file) {
 return uploadPreparedPhoto(await preparePhoto(file));
}
export async function uploadPreparedPhoto(image,{chat=false}={}) {
 const r=await fetch('/api/photos'+(chat?'?purpose=chat':''),{method:'POST',credentials:'same-origin',headers:{'Content-Type':'image/jpeg'},body:image,signal:AbortSignal.timeout(55000)});
 const data=await r.json();if(!r.ok)throw Error(data.error||'Upload failed. Please retry.');return data;
}
