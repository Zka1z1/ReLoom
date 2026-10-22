import React,{useEffect,useRef} from 'react';
export default function Modal({label,onClose,children}){
 const ref=useRef(null);
 useEffect(()=>{const dialog=ref.current;dialog.showModal();return ()=>dialog.close();},[]);
 return <dialog ref={ref} className="rl-modal" aria-label={label} onCancel={e=>{e.preventDefault();onClose();}}>{children}</dialog>;
}
