import React,{useState} from 'react';
import ProfileHandle from './ProfileHandle.jsx';

export default function WelcomeGuide({model}) {
  const [skipped,setSkipped]=useState(false),[editingName,setEditingName]=useState(false);
  if(!model.isWelcome)return null;
  const needsName=!model.profile||model.profile.handle.startsWith('member-');
  const settingName=(needsName&&!skipped)||editingName;
  return <section className="welcome-guide rl-scroll" aria-labelledby="guide-question">
    <div className="guide-portrait"><img src="/assets/mei-guide.png" alt="Mei, your ReLoom guide, holding a folded denim garment" width="640" height="640"/><span className="guide-name">Mei · your ReLoom guide</span></div>
    <div className="guide-conversation">
      <p className="guide-greeting">{needsName?'Hi, I’m Mei.':<>Hi <button type="button" className="guide-name-link" aria-label="Edit your ReLoom username" aria-expanded={editingName} onClick={()=>setEditingName(true)}>{model.profile.displayHandle||model.profile.handle}</button>, lovely to see you.</>}</p>
      <h1 id="guide-question" className={settingName?'guide-name-question':'guide-intent-question'}>{settingName?'What can I call you?':'What brings you here today?'}</h1>
      {settingName&&<ProfileHandle profile={model.profile} onSave={profile=>{model.updateProfile(profile);setEditingName(false);}} onCancel={()=>setEditingName(false)}/>}
      {settingName?needsName&&<button type="button" className="text-button guide-name-skip" onClick={()=>setSkipped(true)}>Maybe later</button>:<>
       {needsName&&<button type="button" className="text-button guide-name-setup" onClick={()=>setSkipped(false)}>Set username</button>}
       <div className="guide-choices">{model.guideChoices.map(choice=><button key={choice.id} type="button" className={`guide-choice guide-choice-${choice.id}`} onClick={choice.pick}><span className="guide-choice-icon" aria-hidden="true">{choice.icon}</span><span><strong>{choice.label}</strong><small>{choice.detail}</small></span></button>)}</div>
      </>}
    </div>
  </section>;
}
