import React from 'react';
const SLOTS={g1:0,g2:1,n1:3,n2:4,n3:5,b1:6,b2:7,'don-denim':8};
export default function GarmentVisual({id,name='',className='',src}){
 if(!src&&id==='don-shirt')return <img className={`garment-visual ${className}`} src="/assets/striped-cotton-shirt.jpg" alt={`${name||'Striped Cotton Shirt'} · AI-generated prototype illustration`} loading="lazy"/>;
 src=src||(id==='g2'?'/assets/hao-tote-after.png':null);
 if(src)return <img className={`garment-visual ${className}`} src={src} alt={name||'Garment photo'} loading="lazy"/>;
 const slot=SLOTS[id]??(id?.startsWith('dn-')?8:null);
 return slot===null?<img className={`garment-visual ${className}`} src="/assets/donated-textiles.png" alt="Illustrative donated textiles" loading="lazy"/>:<span className={`garment-visual garment-sprite ${className}`} role="img" aria-label={`${name||'Garment'} · prototype illustration`} style={{backgroundPosition:`${slot%3*50}% ${Math.floor(slot/3)*50}%`}}/>;
}
