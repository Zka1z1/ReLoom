import React from 'react';
import Modal from './Modal.jsx';
import StoryJourney from './StoryJourney.jsx';
import Icon from './Icon.jsx';
export default function GarmentStory({model:m}){
 if(!m.modalOpen)return null;
 return <Modal label={`${m.story.name} story`} onClose={m.closeModal}><header className="detail-toolbar"><span className="eyebrow">THE GARMENT’S STORY</span><div><button type="button" className="share-button" onClick={m.shareStory}>Invite</button><button type="button" className="icon-button" aria-label="Close garment story" onClick={m.closeModal}><Icon name="close"/></button></div></header><div className="rl-scroll modal-scroll"><StoryJourney story={m.storyJourney}/>{!m.story.donated&&<div className="story-proceeds"><p className="eyebrow">PROTOTYPE SALE SPLIT</p><p>{m.story.split} of a sale is allocated to <strong>{m.story.charity}</strong> in this sample story.</p></div>}</div><footer className="modal-actions"><button type="button" className="primary-button" aria-pressed={m.storyFollowing} onClick={m.followStory} disabled={m.saving||!m.dataReady}>{m.storyFollowing?'Following ✓':'Follow'}</button><button type="button" className="primary-button" onClick={m.openBoard}>Join chat room</button></footer></Modal>;
}
