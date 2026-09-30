import { createNfcModel, canBindStory, STRAP_COLORS, validateDesign, storyUrl } from "./nfc.js";
import { createShowroomModel } from "./showroom.js";
import { CATALOG, BOOTHS, STORIES, DEFAULT_STORY, CONDITIONS, SIZES, DROPS, NODES } from "./data.js";
export function createViewModel(self) {
    const s = self.state;
    const node = NODES[s.node];
    const boothData = BOOTHS.find(b => b.id === s.booth) || BOOTHS[0];
    const mg = self.item(s.modal) || CATALOG[0];
    const story = mg.kind==='donation' ? {...mg,donated:true,donorNote:mg.note,steps:[]} : {...(STORIES[mg.id]||DEFAULT_STORY),name:mg.name,designer:mg.designer,price:'$'+mg.price,zone:mg.zone,votes:self.count(mg.id)};
    const boardGarment = self.item(s.boardGarment) || mg;
    const cartItems = s.cart.map(id => self.item(id)).filter(Boolean);
    const cartTotal = cartItems.reduce((a, g) => a + g.price, 0);
    const savedIds = Object.keys(s.saved);
    const boardList = self.postsFor(boardGarment.id);
    const unread = CATALOG.filter(i => !i.id.startsWith("b") && !s.seen[i.id]).length;

    return {
        nfc: createNfcModel(self), openNfc: id=>self.openNfc(id), storyNfc:()=>self.openNfc(mg.id), canDesignStory:canBindStory(s,mg.id),
        dataError:s.dataError, retry:()=>self.refreshRecords(),
        points: s.points, toast: s.toast, showroom: createShowroomModel(self),
        headerSub: s.screen === "nfc" ? "your story tag" : s.screen === "store" ? "show room" : s.screen === "donate" ? "pass on a piece" : s.screen === "mytags" ? "my tags" : s.screen === "tags" ? "items" : s.screen === "messages" ? "community notes" : "community notes",
        openDialog: () => self.node("welcome"),
        closeDialog: () => { clearInterval(self.t); self.setState({ dialog: false }); },
        isStore: s.screen === "store", isDonate: s.screen === "donate", isTags: s.screen === "tags", isMyTags: s.screen === "mytags", isMessages: s.screen === "messages", isBoard: s.screen === "board", isTagView: s.screen === "tag",
        goStore: () => self.setState({ screen: "store" }), goTags: () => self.setState({ screen: "tags" }),
        closeTagView: () => {if(s.shareId)self.setState({screen:s.shareReturn||"store",modal:s.shareId,shareId:null});else self.setState({screen:"tags"});},
        dialogOpen: s.dialog, typed: node.text.slice(0, s.typedLen), typing: s.typing, showChoices: !s.typing,
        skipTyping: () => { clearInterval(self.t); self.setState({ typedLen: node.text.length, typing: false }); },
        choices: node.choices.map(c => ({
            label: c.label,
            pick: () => {
                if (c.to)
                    return self.node(c.to);
                if (c.act === "goTop")
                    return self.changeZone(2);
                if (c.act === "goBooths")
                    return self.changeZone(0);
                if (c.act === "goNew")
                    return self.changeZone(1);
                if (c.act === "donate")
                    return self.setState({ dialog: false, screen: "donate", donateStep: 1, donateChat: "photo" });
                self.setState({ dialog: false });
            }
        })),
        boothOpen: !!s.booth, closeBooth: () => self.setState({ booth: null }),
        booth: Object.assign({}, boothData, {
            pieces: boothData.pieces.map(id => {
                const g = self.item(id);
                return { name: g.name, price: "$" + g.price, votes: self.count(id), posts: self.postsFor(id).length, open: () => self.openStory(id) };
            })
        }),
        modalOpen: !!self.item(s.modal), story, closeModal: () => self.setState({ modal: null }),
        shareStory: () => self.setState({shareId:mg.id,shareReturn:s.screen,modal:null,screen:"tag"}),
        modalCartCta: s.cart.indexOf(mg.id) >= 0 ? "Reserved · $" + mg.price : "Reserve · $" + mg.price,
        modalCartBg: s.cart.indexOf(mg.id) >= 0 ? "var(--color-accent-700)" : "var(--color-text)",
        modalCart: () => self.addCart(mg.id),
        openBoard: () => self.setState({ screen: "board", modal: null, boardGarment: mg.id }),
        closeBoard: () => self.setState({ screen: "store", boardGarment: null, draft: "", attachment: null, replyTarget: null }),
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
                self.toast('Posted to your threads');
            }
        },
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
        donateName: "Old Denim Jacket",
        addPhotos: () => { self.setState({ photos: true }); self.toast("Demo photos added — no files uploaded"); },
        photosDone: s.photos,
        photoShots: [{ label: "front · uploaded" }, { label: "back · uploaded" }, { label: "detail · uploaded" }],
        step1Blocked: !s.photos,
        step1Bg: s.photos ? "var(--color-text)" : "var(--color-neutral-500)",
        step1Cta: s.photos ? "Continue to details" : "Add photos to continue",
        toStep2: () => { if (s.photos)
            self.setState({ donateStep: 2, donateChat: "condition" }); },
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
        step2Blocked: !(s.condition && s.size && s.drop),
        step2Bg: s.condition && s.size && s.drop ? "var(--color-text)" : "var(--color-neutral-500)",
        step2Cta: s.condition && s.size && s.drop ? "Create my Digital Garment Tag" : "Pick condition, size and drop-off",
        finishDonate: async () => {
            if(!(s.condition&&s.size&&s.drop)||s.saving)return;
            const id=self.donationRequestId||(self.donationRequestId='dn-'+crypto.randomUUID());
            if(await self.persist({type:'donation',id,value:{condition:s.condition,size:s.size,drop:s.drop,note:s.desc.trim()||'Ready for a new chapter.'}})) {
                const tag=self.state.tags.find(t=>t.garmentId===id);
                self.donationRequestId=null;
                self.setState({newTag:tag,shareId:null,screen:'tag',condition:null,size:null,drop:null,desc:'',photos:false,donateStep:1,donateChat:'photo'});
                self.toast('Tag created +40 pts');
            }
        },
        tag:s.shareId?self.item(s.shareId):s.newTag,
        isShare:!!s.shareId,
        tagUrl:storyUrl(s.shareId||s.newTag?.id,[...s.donations,...s.sharedGarments]),
        openTagStory:()=>self.openStory(s.shareId||s.newTag?.id),
        copyTagLink:async()=>{try{await navigator.clipboard.writeText(storyUrl(s.shareId||s.newTag?.id,[...s.donations,...s.sharedGarments]));self.toast('Story link copied');}catch{self.toast('Copy the story link shown above.');}},
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
            return { name: g.name, designer: g.designer, price: "$" + g.price, votes: self.count(id), open: () => self.openStory(id), unsave: () => self.toggleSave(id) };
        }),
        noSaved: savedIds.length === 0,
        messageCards: Object.keys(s.posts).reduce((all, id) => {
            const garment = self.item(id), mine = (s.posts[id] || []).filter(p => p.author === "you")[0];
            return mine ? all.concat([{ garment: garment ? garment.name : "Garment", text: mine.text, when: mine.when, open: () => self.setState({ screen: "board", boardGarment: id }) }]) : all;
        }, []).concat(s.tags.map(t => ({ garment: t.name, text: t.firstMessage || ("Passed on · " + t.meta), when: "earlier", open: () => self.setState({ screen: "board", boardGarment: t.garmentId }) }))),
        noMessageCards: !Object.keys(s.posts).some(id => (s.posts[id] || []).some(p => p.author === "you")) && !s.tags.length,
        cartList: cartItems.map(g => ({
            name: g.name, designer: g.designer, price: "$" + g.price,
            charity: (STORIES[g.id] || DEFAULT_STORY).charity,
            remove: () => self.setState(st => ({ cart: st.cart.filter(x => x !== g.id) }))
        })),
        cartEmpty: cartItems.length === 0, cartHasItems: cartItems.length > 0,
        cartSummary: cartItems.length + (cartItems.length === 1 ? " piece" : " pieces"),
        cartTotal: "$" + cartTotal,
        checkout: () => self.toast("Demo only — no real reservation has been placed"),
        tabs: [
            { key: "store", icon: "◈", label: "Explore" },
            { key: "donate", icon: "📦", label: "Donate" },
            { key: "mytags", icon: "◇", label: "My tags" },
            { key: "tags", icon: "👔", label: "Items", badge: (unread + s.cart.length) ? String(unread + s.cart.length) : null },
            { key: "messages", icon: "☷", label: "Threads" }
        ].map(t => ({
            icon: t.icon, label: t.label, badge: t.badge || null,
            pick: () => self.setState({ screen: t.key, modal: null, booth: null }),
            bg: s.screen === t.key ? "var(--color-text)" : "var(--color-neutral-100)",
            color: s.screen === t.key ? "var(--color-neutral-100)" : "var(--color-text)"
        }))
    };
}
