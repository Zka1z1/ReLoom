import {requestLetter} from './letters.js';
import {uploadPhoto} from './photo.js';
import { createNfcModel, canBindStory, STRAP_COLORS, validateDesign } from "./nfc.js";
import {garmentJourney,createThreadsModel} from "./story-feed.js";
import { createShowroomModel } from "./showroom.js";
import { CATALOG, BOOTHS, STORIES, DEFAULT_STORY, CONDITIONS, SIZES, DROPS, GUIDE_CHOICES } from "./data.js";
export function createViewModel(self) {
    const s = self.state;
    const threads = createThreadsModel(self);
    const boothData = BOOTHS.find(b => b.id === s.booth) || BOOTHS[0];
    const mg = self.item(s.modal) || CATALOG[0];
    const story = mg.kind==='donation' ? {...mg,donated:true,donorNote:mg.note,steps:[]} : {...(STORIES[mg.id]||DEFAULT_STORY),id:mg.id,name:mg.name,designer:mg.designer,price:'$'+mg.price,zone:mg.zone,votes:self.count(mg.id)};
    const boardGarment = self.item(s.boardGarment) || mg;
    const cartItems = s.cart.map(id => self.item(id)).filter(Boolean);
    const cartTotal = cartItems.reduce((a, g) => a + g.price, 0);
    const savedIds = Object.keys(s.saved);
    const boardList = self.postsFor(boardGarment.id);
    const unread = CATALOG.filter(i => !i.id.startsWith("b") && !s.seen[i.id]).length;

    return {
        boardPrivateNotes:(s.posts[boardGarment.id]||[]).filter(p=>!p.public), chatRoom:boardGarment.id,chatDraft:s.draft,onChatActivity:()=>{self.setState({draft:''});self.refreshRecords();}, threads, storyJourney:garmentJourney(mg), boardStory:garmentJourney(boardGarment),
        onChatUnread:count=>self.setState(state=>state.chatUnread[boardGarment.id]===count?null:{chatUnread:{...state.chatUnread,[boardGarment.id]:count}}),
        boardTab:s.boardTab, setBoardTab:boardTab=>self.setState({boardTab}),
        boardShare:()=>self.openShare(boardGarment.id,'board'),
        dataReady:s.dataReady, saving:s.saving, postDisabled:s.saving||!s.dataReady||(!s.draft.trim()&&!s.attachment),
        startDonate:()=>self.chooseIntent('donate'), nfc: createNfcModel(self), openNfc: id=>self.openNfc(id), canDesignStory:canBindStory(s,mg.id),
        dataError:s.dataError, retry:()=>self.refreshRecords(),
        points: s.points, toast: s.toast, showroom: createShowroomModel(self),
        headerSub: s.screen === "welcome" ? "every piece has a next chapter" : s.screen === "nfc" ? "your story tag" : s.screen === "store" ? "show room" : s.screen === "donate" ? "pass on a piece" : s.screen === "mytags" ? "my tags" : s.screen === "tags" ? "items" : s.screen === "messages" ? "garment stories" : "garment stories",
        isWelcome:s.screen==='welcome',
        openDialog:()=>self.setState({screen:'welcome',guideReturn:s.screen==='welcome'?'store':s.screen,modal:null,booth:null}),
        closeGuide:()=>self.setState({screen:s.guideReturn||'store'}),
        guideChoices:GUIDE_CHOICES.map(c=>({...c,pick:()=>self.chooseIntent(c.id)})),
        isStore: s.screen === "store", isDonate: s.screen === "donate", isTags: s.screen === "tags", isMyTags: s.screen === "mytags", isMessages: s.screen === "messages", isBoard: s.screen === "board", isTagView: s.screen === "tag",
        goStore: () => self.setState({ screen: "store" }), goTags: () => self.setState({ screen: "tags" }),
        closeTagView: () => self.closeShare(),
        boothOpen: !!s.booth, closeBooth: () => self.setState({ booth: null }),
        booth: Object.assign({}, boothData, {
            pieces: boothData.pieces.map(id => {
                const g = self.item(id);
                return { id:g.id, name: g.name, price: "$" + g.price, votes: self.count(id), posts: self.postsFor(id).length, open: () => self.openStory(id) };
            })
        }),
        modalOpen: !!self.item(s.modal), story, closeModal: () => self.setState({ modal: null }),
        shareStory: () => self.openShare(mg.id),
        storyFollowing:!!s.followed?.[mg.id],
        followStory:async()=>{
            if(self.state.saving)return;
            const active=!self.state.followed?.[mg.id];
            if(await self.persist({type:'follow',id:mg.id,value:{active}}))self.toast(active?'Following · saved to My':'Story unfollowed');
        },
        openBoard: () => self.setState({ screen: "board", modal: null, draft:"", boardGarment: mg.id,boardTab:"notes",boardReturn:s.screen }),
        closeBoard: () => self.setState({ screen: s.boardReturn||"messages", boardGarment: null, draft: "", attachment: null, replyTarget: null }),
        boardTitle: boardGarment.name,
        boardDesigner: boardGarment.designer,
        boardPosts: boardList.map(p => ({ author: p.author, role: p.role, when: p.when, text: p.text, ring: p.role === "maker" ? "var(--color-accent-2-700)" : "var(--color-text)", hasAttachment: !!p.attachment, attachmentName: p.attachment ? p.attachment.name : "", hasReplyTo: !!p.replyTo, replyTo: p.replyTo || "", reply: () => self.setState({ replyTarget: p.author }) })),
        draft: s.draft, onDraft: e => self.setState({ draft: e.target.value }),
        hasAttachment: !!s.attachment,
        attachmentName: s.attachment ? s.attachment.name : "",
        imageUploadRef: el => { self.imageUpload = el; },
        chooseImage: () => { if (self.imageUpload)
            self.imageUpload.click(); },
        pickImage: e => { const file = e.target.files && e.target.files[0]; if (file)
            self.setState({ attachment: { name: file.name, kind: "image" } }); },
        clearAttachment: () => self.setState({ attachment: null }),
        isReplying: !!s.replyTarget,
        replyTarget: s.replyTarget || "",
        clearReply: () => self.setState({ replyTarget: null }),
        postMessage: async () => {
            const text=s.draft.trim()||(s.attachment?'Shared an image.':'');if(!text||s.saving)return;
            const id=self.postRequestId||(self.postRequestId=crypto.randomUUID());
            if(await self.persist({type:'post',id,value:{garmentId:boardGarment.id,text,replyTo:s.replyTarget,attachment:s.attachment}})) {
                self.postRequestId=null;
                self.setState({draft:'',attachment:null,replyTarget:null,modal:null,boardGarment:null,screen:'messages'});
                self.toast('Posted to your stories');
            }
        },
        donationVisibility:s.donationVisibility, setDonationVisibility:donationVisibility=>{if(['public','private'].includes(donationVisibility))self.setState({donationVisibility});},
        donateStep: s.donateStep, onStep1: s.donateStep === 1, onStep2: s.donateStep === 2,
        donateBack: () => {
            const previous = { complete: "drop", drop: "desc", desc: "size", size: "condition", condition: "photo" }[s.donateChat];
            const cleared = { drop: { drop: null }, desc: { desc: "", drop: null }, size: { size: null, desc: "", drop: null }, condition: { condition: null, size: null, desc: "", drop: null }, photo: { condition: null, size: null, desc: "", drop: null } }[previous] || {};
            if (previous === "photo")
                return self.setState(Object.assign({ donateStep: 1, donateChat: "photo" }, cleared));
            if (previous)
                return self.setState(Object.assign({ donateChat: previous }, cleared));
            self.setState({ screen: "store" });
        },
        donateName: s.garmentDetails.name||'Your garment',
        photo:s.photo,photoBusy:s.photoBusy,photoError:s.photoError,garmentDetails:s.garmentDetails,
        updateGarment:(field,value)=>self.setState(st=>({garmentDetails:{...st.garmentDetails,[field]:value}})),
        pickPhoto:async file=>{
            if(!file||self.state.photoBusy)return;
            self.setState({photoBusy:true,photoError:''});
            try{
                const photo=await uploadPhoto(file),d=photo.analysis.details||{},old=self.state.photo;
                self.setState({photo,photos:true,garmentDetails:{name:'',cat:d.category||'',color:d.color||'',material:d.material||''},size:SIZES.includes(d.labelSize)?d.labelSize:null});
                if(old?.id)fetch('/api/photos?id='+encodeURIComponent(old.id),{method:'DELETE'}).catch(()=>{});
            }catch(error){self.setState({photoError:error.name==='TimeoutError'?'Upload timed out. Please try again.':error.message});}
            finally{self.setState({photoBusy:false});}
        },
        photosDone: !!s.photo,
        step1Blocked: !s.photo||s.photoBusy||!s.garmentDetails.name.trim(),
        step1Cta: s.photoBusy?'Saving photo…':'Continue',
        toStep2: () => { if (s.photo&&!s.photoBusy&&s.garmentDetails.name.trim())
            self.setState({ donateStep: 2, donateChat: 'condition' }); },
        askCondition: s.donateChat === "condition", askSize: s.donateChat === "size", askDesc: s.donateChat === "desc", askDrop: s.donateChat === "drop", donateComplete: s.donateChat === "complete",
        hasCondition: !!s.condition, hasSize: !!s.size, hasDescTurn: s.donateChat === "drop" || s.donateChat === "complete", hasDrop: !!s.drop,
        condition: s.condition, size: s.size, drop: s.drop, descAnswer: s.desc.trim() || "No additional note.",
        conditionChips: CONDITIONS.map(c => Object.assign({ label: c, pick: () => self.setState({ condition: c, donateChat: "size" }) }, self.chip(s.condition === c))),
        sizeChips: SIZES.map(c => Object.assign({ label: c, pick: () => self.setState({ size: c, donateChat: "desc" }) }, self.chip(s.size === c))),
        desc: s.desc, onDesc: e => self.setState({ desc: e.target.value }),
        toDrop: () => self.setState({ donateChat: "drop" }),
        dropSpots: DROPS.map((d, i) => {
            const on = s.drop === d.label;
            return {
                label: d.label, sub: d.sub, dist: d.dist, recommended: i === 0,
                border: on ? "var(--color-accent-700)" : "var(--color-text)",
                bg: on ? "var(--color-accent-100)" : "var(--color-neutral-100)",
                distColor: i === 0 ? "var(--color-accent-2-700)" : "var(--color-neutral-700)",
                pick: () => self.setState({ drop: d.label, donateChat: "complete" })
            };
        }),
        step2Blocked: s.saving || !s.dataReady || !s.photo || !(s.condition && s.size && s.drop),
        step2Bg: s.condition && s.size && s.drop ? "var(--color-text)" : "var(--color-neutral-500)",
        step2Cta: s.saving ? "Saving donation…" : "Complete donation",
        finishDonate: async () => {
            if(!(s.condition&&s.size&&s.drop&&s.photo&&s.garmentDetails.name.trim())||s.saving||s.photoBusy)return;
            const id=self.donationRequestId||(self.donationRequestId='dn-'+crypto.randomUUID());
            if(await self.persist({type:'donation',id,value:{...s.garmentDetails,cat:s.garmentDetails.cat.trim()||'Other',visibility:s.donationVisibility,photoId:s.photo.id,condition:s.condition,size:s.size,drop:s.drop,note:s.desc.trim()||'Ready for a new chapter.'}})) {
                const tag=self.state.tags.find(t=>t.garmentId===id);
                self.donationRequestId=null;
                self.setState({newTag:tag,donationVisibility:'public',shareId:null,screen:'messages',threadFilter:'mine',condition:null,size:null,drop:null,desc:'',photos:false,photo:null,garmentDetails:{name:'',cat:'',color:'',material:''},donateStep:1,donateChat:'photo'},()=>self.openNfc(id));
                self.toast('Donation saved. Make this tag yours.');
            }
        },
        tag:s.shareId?self.item(s.shareId):s.newTag,
        profile:s.profile,receivedLetters:s.receivedLetters||[],followed:s.followed||{},
        followReceivedStory:async id=>{
            if(self.state.saving||self.state.followed?.[id])return;
            if(await self.persist({type:'follow',id,value:{active:true}}))self.toast('Following · saved to My');
            else throw Error(self.state.dataError||'Unable to follow. Please retry.');
        },
        deleteReceivedLetter:async id=>{
            await self.enqueue(async()=>{await requestLetter({type:'delete',id});self.setState(st=>({receivedLetters:st.receivedLetters.filter(l=>l.id!==id)}));});
            self.channel?.postMessage('updated');
        },
        refreshInbox:()=>self.refreshRecords(),
        updateProfile:profile=>self.setState({profile}),
        receivedLetter:s.receivedLetter,
        openReceivedLetter:letter=>self.setState({receivedLetter:letter,screen:'tag',threadFilter:'friends',shareId:null,modal:null}),
        letterRead:id=>self.setState(st=>({receivedLetters:st.receivedLetters.map(l=>l.id===id?{...l,opened:true}:l)})),
        openReceivedStory:id=>self.openInvitationDestination(id),
        joinReceivedChat:id=>self.openInvitationDestination(id,true),
        isShare:!!s.shareId,
        tagsSummary: s.tags.length + " passed on · " + savedIds.length + " saved",
        savedNfcTags: Object.values({...s.legacyDesigns,...s.nfcDesigns}).filter(d=>validateDesign(d,[...s.donations,...s.sharedGarments])).map(d=>({
            ...d, name:self.item(d.garmentId).name, color:STRAP_COLORS.find(c=>c.id===d.color),
            canEdit:canBindStory(s,d.garmentId), edit:()=>self.openNfc(d.garmentId), open:()=>self.openStory(d.garmentId)
        })),
        itemTabs: [
            { key: "donated", label: "Donated (" + s.tags.length + ")" },
            { key: "favourites", label: "Favourites (" + savedIds.length + ")" },
            { key: "cart", label: "Cart (" + cartItems.length + ")" }
        ].map(t => ({
            label: t.label,
            pick: () => self.setState({ itemsTab: t.key }),
            bg: s.itemsTab === t.key ? "var(--color-text)" : "var(--color-neutral-100)",
            color: s.itemsTab === t.key ? "var(--color-neutral-100)" : "var(--color-text)"
        })),
        showDonated: s.itemsTab === "donated",
        showFavourites: s.itemsTab === "favourites",
        showCart: s.itemsTab === "cart",
        myTags: s.tags.map(t => Object.assign({}, t, { open: () => self.openStory(t.garmentId) })),
        savedList: savedIds.map(id => {
            const g = self.item(id);
            return { id:g.id, name: g.name, designer: g.designer, price: "$" + g.price, votes: self.count(id), open: () => self.openStory(id), unsave: () => self.toggleSave(id) };
        }),
        noSaved: savedIds.length === 0,
        cartList: cartItems.map(g => ({
            id:g.id, name: g.name, designer: g.designer, price: "$" + g.price,
            charity: (STORIES[g.id] || DEFAULT_STORY).charity,
            remove: () => self.setState(st => ({ cart: st.cart.filter(x => x !== g.id) }))
        })),
        cartEmpty: cartItems.length === 0, cartHasItems: cartItems.length > 0,
        cartSummary: cartItems.length + (cartItems.length === 1 ? " piece" : " pieces"),
        cartTotal: "$" + cartTotal,
        checkout: () => self.toast("Demo only — no real reservation has been placed"),
        tabs: [
            { key: "welcome", icon: "◈", label: "Mei" },
            { key: "donate", icon: "◇", label: "Donate" },
            { key: "store", icon: "◈", label: "Explore" },
            { key: "mytags", icon: "◇", label: "My tags" },
            { key: "messages", icon: "☷", label: "Stories", badge: threads.unread }
        ].map(t => ({
            key:t.key, active:s.screen===t.key||(s.screen==='board'&&t.key==='messages')||(s.screen==='nfc'&&t.key==='mytags'), icon: t.icon, label: t.label, badge: t.badge || null,
            pick: () => self.setState({ screen: t.key, modal: null, booth: null }),
            bg: s.screen === t.key ? "var(--color-text)" : "var(--color-neutral-100)",
            color: s.screen === t.key ? "var(--color-neutral-100)" : "var(--color-text)"
        }))
    };
}
