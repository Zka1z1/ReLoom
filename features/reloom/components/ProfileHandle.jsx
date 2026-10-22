import React,{useState} from 'react';
import {requestLetter} from '../letters.js';

export default function ProfileHandle({profile,onSave,onCancel}) {
 const [draft,setDraft]=useState(()=>profile&&!profile.handle.startsWith('member-')?(profile.displayHandle||profile.handle):''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const isNew=!profile||profile.handle.startsWith('member-');
 async function save(e){
  e.preventDefault();if(busy||!profile)return;setBusy(true);setError('');
  try{const data=await requestLetter({type:'profile',handle:draft.trim()});onSave(data.profile);}
  catch(e){setError(e.message);}finally{setBusy(false);}
 }
 return <div className="guide-username"><form onSubmit={save}>
  <label htmlFor="guide-handle">Your username</label>
  <div className="guide-username-input"><span aria-hidden="true">@</span><input id="guide-handle" autoCapitalize="none" autoComplete="off" spellCheck={false} placeholder="e.g. Alex" value={draft} maxLength={24} onChange={e=>{setDraft(e.target.value);setError('');}} disabled={busy||!profile} aria-describedby={error?'guide-handle-error':undefined}/></div>
  {error&&<p id="guide-handle-error" role="alert">{error}</p>}
  <div className="guide-username-actions"><button className="primary-button" type="submit" disabled={busy||!profile||!draft.trim()}>{busy?'Saving…':isNew?'Continue':'Save'}</button>{!isNew&&<button className="secondary-button" type="button" onClick={onCancel} disabled={busy}>Cancel</button>}</div>
 </form></div>;
}
