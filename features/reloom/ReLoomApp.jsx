"use client";
import React from "react";
import { findGarment, voteCount, garmentPosts } from "./domain.js";
import { createViewModel } from "./view-model.js";
import { ZONES, EMPTY_FILTERS, DONATIONS } from "./showroom.js";
import { DEFAULT_DESIGN, readDesigns, DESIGN_STORAGE_KEY, participatingGarments, canBindStory } from "./nfc.js";
import {SEED_TAG} from './records.js';
import {requestRecords,loadSharedGarment} from './api.js';
import AppView from "./components/AppView.jsx";
export default class ReLoomApp extends React.Component {
    state = {
        nfcDesign: {...DEFAULT_DESIGN,emojis:[...DEFAULT_DESIGN.emojis]}, nfcDesigns:{}, legacyDesigns:{}, nfcSaved:false, nfcError:"", nfcReturn:"store", dataReady:false, dataError:"", saving:false, sharedGarments:[],
        showroomZone: 0, showroomFilters: Object.fromEntries(ZONES.map(z => [z.id, {...EMPTY_FILTERS}])), donations: DONATIONS, publicDonations:[],
        screen: "welcome", guideReturn: "store", threadFilter:"all",boardTab:"story",boardReturn:"messages",
        points: 120, followed:{}, votes: {}, voted: {}, saved: {}, cart: [], toast: null,
        modal: null, boardGarment: null, draft: "", attachment: null, replyTarget: null, posts: {}, seen: {}, booth: null,
        donationVisibility:'public',donateStep: 1, donateChat: "photo", photos: false, photo:null, photoBusy:false, photoError:"", garmentDetails:{name:"",cat:"",color:"",material:""}, condition: null, size: null, desc: "", drop: null,
        tags: [SEED_TAG], newTag: null, shareId:null, itemsTab: "donated",
        profile:null,receivedLetters:[],receivedLetter:null,chatUnread:{},chatSummary:{}
    };
    async componentDidMount() {
        this.disposed=false;
        const initialize=async()=>{
            await this.refreshRecords();
            let legacy={};try{legacy=readDesigns(window.localStorage);}catch{}
            this.setState({legacyDesigns:legacy});
            if(this.state.dataReady&&Object.keys(legacy).length) {
                const saved=await this.persist({type:'import',value:legacy});
                if(saved)this.cleanLegacy();
            }
        };
        if(navigator.locks)await navigator.locks.request('reloom-initialize',initialize);else await initialize();
        if(this.disposed)return;
        const storyId=new URLSearchParams(window.location.search).get('story');
        if(storyId){this.setState({screen:"store"});await this.openStory(storyId);}
        if(this.disposed)return;
        this.onFocus=async()=>{
            if(document.hidden||this.refreshing)return;
            this.refreshing=true;
            try{await this.refreshRecords();}finally{this.refreshing=false;}
        };
        window.addEventListener('focus',this.onFocus);
        document.addEventListener('visibilitychange',this.onFocus);
        this.inboxTimer=setInterval(this.onFocus,5000);
        if(typeof BroadcastChannel!=='undefined'){
            this.channel=new BroadcastChannel('reloom-records');
            this.channel.onmessage=()=>this.refreshRecords();
        }
    }
    cleanLegacy() {
        const remaining=Object.fromEntries(Object.entries(this.state.legacyDesigns).filter(([id])=>!this.state.nfcDesigns[id]));
        this.setState({legacyDesigns:remaining});
        try{if(Object.keys(remaining).length)window.localStorage.setItem(DESIGN_STORAGE_KEY,JSON.stringify(remaining));else window.localStorage.removeItem(DESIGN_STORAGE_KEY);}catch{}
    }
    request=action=>requestRecords(action);
    enqueue(work) {const next=(this.pending||Promise.resolve()).then(work);this.pending=next.catch(()=>{});return next;}
    applyRecords(records) {
        const {ownedDonations,publicDonations=[],sharedGarments=[],...data}=records;
        return new Promise(resolve=>this.setState(s=>({...data,publicDonations,sharedGarments:[...new Map([...s.sharedGarments,...sharedGarments].map(g=>[g.id,g])).values()],donations:[...ownedDonations,...publicDonations,...DONATIONS],dataReady:true,dataError:''}),resolve));
    }
    refreshRecords() {
        return this.enqueue(async()=>{try{await this.applyRecords(await this.request());return true;}catch(error){this.setState({dataError:error.message});return false;}});
    }
    persist(action) {
        if(!this.state.dataReady){this.toast('Your items are still loading. Please retry.');return Promise.resolve(false);}
        return this.enqueue(async()=>{
            this.setState({saving:true});
            try{await this.applyRecords(await this.request(action));if(action.type==='design')this.cleanLegacy();this.channel?.postMessage('updated');return true;}
            catch(error){this.setState({dataError:error.message});return false;}
            finally{this.setState({saving:false});}
        });
    }
    openNfc(id) {
        if(id&&!canBindStory(this.state,id))return this.toast('Only stories you have participated in can be linked.');
        const available=participatingGarments(this.state);
        const garmentId=id||(canBindStory(this.state,this.state.nfcDesign.garmentId)?this.state.nfcDesign.garmentId:available[0]?.id)||'';
        const saved=this.state.nfcDesigns[garmentId]||this.state.legacyDesigns[garmentId];
        this.setState({screen:'nfc',modal:null,booth:null,
            nfcReturn:this.state.screen==='nfc'?this.state.nfcReturn:this.state.screen,
            nfcDesign:saved?{...saved,emojis:[...saved.emojis]}:{...DEFAULT_DESIGN,emojis:[...DEFAULT_DESIGN.emojis],garmentId},nfcSaved:!!saved,nfcError:''});
    }
    componentWillUnmount() { this.disposed=true; clearTimeout(this.tt); clearInterval(this.inboxTimer); window.removeEventListener('focus',this.onFocus); document.removeEventListener('visibilitychange',this.onFocus); this.channel?.close(); }
    changeZone(index) {
        if (index < 0 || index >= ZONES.length) return;
        this.setState({showroomZone: index, screen: 'store'});
    }
    toast(msg) { clearTimeout(this.tt); this.setState({ toast: msg }); this.tt = setTimeout(() => this.setState({ toast: null }), 1700); }
    chooseIntent(id) {
        if(id==='donate')return this.setState({screen:'donate',modal:null,booth:null});
        const zone={designers:0,donated:1,upcycled:2}[id];
        if(zone===undefined)return;
        this.setState(s=>({screen:'store',showroomZone:zone,modal:null,booth:null,
            showroomFilters:{...s.showroomFilters,[ZONES[zone].id]:{...EMPTY_FILTERS}}}));
    }
    openShare(id,returnScreen=this.state.screen) {
        if(this.item(id)?.visibility==='private')return this.toast('Only you can view this story.');
        this.setState({shareId:id,shareReturn:returnScreen,shareReturnModal:this.state.modal,receivedLetter:null,modal:null,screen:'tag'});
    }
    closeShare() {
        this.setState({screen:this.state.receivedLetter?'messages':this.state.shareReturn||'messages',modal:this.state.receivedLetter?null:this.state.shareReturnModal||null,shareId:null,receivedLetter:null});
    }
    item(id) { return findGarment(id,[...this.state.donations,...this.state.sharedGarments]); }
    count(id) { return voteCount(id, this.state.votes); }
    postsFor(id) { return garmentPosts(id, this.state.posts); }
    async vote(id) {
        if(!findGarment(id))return;
        if(this.state.voted[id])return this.toast('Already voted');
        if(await this.persist({type:'vote',id}))this.toast('Vote counted');
    }
    toggleSave(id) {
        this.setState(s => {
            const saved = Object.assign({}, s.saved);
            if (saved[id]) {
                delete saved[id];
                return { saved };
            }
            saved[id] = true;
            return { saved };
        }, () => this.toast(this.state.saved[id] ? "Saved" : "Removed from saved"));
    }
    addCart(id) {
        if (!findGarment(id))
            return;
        if (this.state.cart.includes(id))
            return this.toast("Already in cart");
        this.setState(s => ({ cart: [...s.cart, id] }), () => this.toast("Added to cart"));
    }
    async openInvitationDestination(id,chat=false) {
        const receipt=this.state.receivedLetter;
        if(!receipt||receipt.garment.id!==id)return;
        try {
            const garment=this.item(id)||await loadSharedGarment(id);
            // A slow request must not reopen an invitation the user has closed.
            if(this.state.receivedLetter?.id!==receipt.id)return;
            this.setState(s=>({
                sharedGarments:[...s.sharedGarments.filter(g=>g.id!==id),garment],
                screen:chat?'board':'messages',threadFilter:'friends',receivedLetter:null,shareId:null,booth:null,
                ...(chat?{modal:null,boardGarment:id,boardTab:'notes',boardReturn:'messages',draft:'',attachment:null,replyTarget:null}
                    :{modal:id,seen:{...s.seen,[id]:true}})
            }));
        }catch(error){this.toast(error.message);}
    }
    async openStory(id) {
        if(!this.item(id)) {
            try{const garment=await loadSharedGarment(id);this.setState(s=>({sharedGarments:[...s.sharedGarments.filter(g=>g.id!==id),garment]}));}
            catch(error){this.toast(error.message);return;}
        }
        this.setState({modal:id,booth:null,seen:{...this.state.seen,[id]:true}});
    }
    chip(active) {
        return active
            ? { border: "var(--color-text)", bg: "var(--color-text)", color: "var(--color-neutral-100)" }
            : { border: "var(--color-neutral-400)", bg: "var(--color-neutral-100)", color: "var(--color-text)" };
    }
    render() { return <AppView model={createViewModel(this)}/>; }
}
