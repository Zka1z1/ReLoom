import { selectGarments } from "./domain.js";
import { CATALOG, BOOTHS, ITEMS, WALLS, SPOT, STORIES, DEFAULT_STORY, CONDITIONS, SIZES, DROPS, NODES } from "./data.js";
export function createViewModel(self) {
    const s = self.state;
    const node = NODES[s.node];
    const focusItem = ITEMS.filter(i => i.id === s.focus)[0];
    const focusG = focusItem && focusItem.kind === "garment" ? self.item(focusItem.id) : null;
    const boothData = BOOTHS.filter(b => b.id === (s.booth || (focusItem && focusItem.kind === "booth" ? focusItem.id : null)))[0] || BOOTHS[0];
    const mg = self.item(s.modal) || CATALOG[0];
    const story = Object.assign({}, STORIES[s.modal] || DEFAULT_STORY, { name: mg.name, designer: mg.designer, price: "$" + mg.price, zone: mg.zone, votes: self.count(mg.id) });
    const boardGarment = self.item(s.boardGarment) || mg;
    const results = selectGarments(s);
    const q = s.query.trim().toLowerCase();
    const designerHits = q ? BOOTHS.filter(b => b.designer.toLowerCase().indexOf(q) >= 0) : [];
    const cartItems = s.cart.map(id => self.item(id)).filter(Boolean);
    const cartTotal = cartItems.reduce((a, g) => a + g.price, 0);
    const savedIds = Object.keys(s.saved);
    const boardList = self.postsFor(boardGarment.id);
    const unread = ITEMS.filter(i => i.kind === "garment" && !s.seen[i.id]).length;
    const heart = id => {
        const on = !!s.voted[id];
        return { border: on ? "var(--color-accent-2-700)" : "var(--color-text)", bg: on ? "var(--color-accent-2-200)" : "var(--color-neutral-100)", color: on ? "var(--color-accent-2-700)" : "var(--color-text)", pop: s.popId === id ? "rl-pop .4s ease" : "none" };
    };
    return {
        points: s.points, toast: s.toast,
        headerSub: s.screen === "store" ? "show room" : s.screen === "donate" ? "pass on a piece" : s.screen === "tags" ? "my items" : s.screen === "messages" ? "community notes" : "community notes",
        openSearch: () => self.setState({ search: true }),
        closeSearch: () => self.setState({ search: false }),
        openDialog: () => self.node("welcome"),
        closeDialog: () => { clearInterval(self.t); self.setState({ dialog: false }); },
        isStore: s.screen === "store", isDonate: s.screen === "donate", isTags: s.screen === "tags", isMessages: s.screen === "messages", isBoard: s.screen === "board", isTagView: s.screen === "tag",
        goStore: () => self.setState({ screen: "store" }), goTags: () => self.setState({ screen: "tags" }),
        closeTagView: () => self.setState({ screen: "tags" }),
        worldRef: el => { self.world = el; },
        floorRef: el => { self.floor = el; },
        dotRef: el => { self.dot = el; },
        viewRef: el => { self.view = el; },
        joyRef: el => { self.joyEl = el; },
        knobRef: el => { self.knob = el; },
        zoneJumps: [
            { label: "Top voted", zone: "top" },
            { label: "Booths", zone: "booths" },
            { label: "New in", zone: "arrivals" }
        ].map(z => ({ label: z.label, go: () => self.walkTo(SPOT[z.zone][0], SPOT[z.zone][1], SPOT[z.zone][2]) })),
        walls: WALLS.map(w => ({ ref: el => { self.wallEls[w.id] = el; } })),
        sprites: ITEMS.map(it => {
            const g = it.kind === "garment" ? self.item(it.id) : null;
            const b = it.kind === "booth" ? BOOTHS.filter(x => x.id === it.id)[0] : null;
            const postCount = g ? self.postsFor(g.id).length : 0;
            return {
                ref: el => { self.els[it.id] = el; },
                tap: it.kind === "sign" ? null : () => self.interact(it.id),
                cursor: it.kind === "sign" ? "default" : "pointer",
                isSign: it.kind === "sign", isBooth: it.kind === "booth",
                isFigure: it.kind === "garment" || it.kind === "npc", isNpc: it.kind === "npc",
                hasPosts: !!g,
                postsLabel: postCount + " posts",
                postTap: e => { if (e && e.stopPropagation)
                    e.stopPropagation(); self.setState({ screen: "board", modal: null, boardGarment: g.id }); },
                kicker: g ? g.designer + " · ♥ " + self.count(g.id) : it.kicker,
                kickerColor: g ? "var(--color-accent-2-700)" : "var(--color-neutral-600)",
                figure: g ? "mannequin" : it.figure,
                name: g ? g.name : b ? b.designer : it.name,
                sub: g ? g.designer + " · $" + g.price + " · ♥ " + self.count(g.id) : b ? b.bio : it.sub,
                priceLabel: g ? "$" + g.price : "",
                wip: b ? b.wip : "", progress: b ? b.progress : 0
            };
        }),
        onDown: e => { self.drag = { x: e.clientX, yaw: self.cam.yaw }; },
        onMove: e => { if (self.drag)
            self.cam.yaw = self.drag.yaw + (e.clientX - self.drag.x) * -0.28; },
        onUp: () => { self.drag = null; },
        joyDown: e => {
            e.stopPropagation();
            self.joyActive = true;
            if (e.currentTarget.setPointerCapture)
                e.currentTarget.setPointerCapture(e.pointerId);
            self.joyRect = e.currentTarget.getBoundingClientRect();
        },
        joyMove: e => {
            e.stopPropagation();
            if (!self.joyActive || !self.joyRect)
                return;
            const r = self.joyRect, cx = r.left + r.width / 2, cy = r.top + r.height / 2;
            let dx = e.clientX - cx, dy = e.clientY - cy;
            const max = 34, d = Math.sqrt(dx * dx + dy * dy);
            if (d > max) {
                dx = dx / d * max;
                dy = dy / d * max;
            }
            self.joy = { x: dx / max, y: dy / max };
            if (self.knob)
                self.knob.style.transform = "translate(" + dx + "px," + dy + "px)";
        },
        joyUp: e => {
            if (e)
                e.stopPropagation();
            self.joyActive = false;
            self.joy = { x: 0, y: 0 };
            if (self.knob)
                self.knob.style.transform = "translate(0,0)";
        },
        focusName: focusItem ? (focusG ? focusG.name : focusItem.kind === "booth" ? boothData.designer + "'s booth" : "Mei") : null,
        focusKicker: focusItem ? (focusG ? focusG.designer + " · $" + focusG.price : focusItem.kind === "booth" ? "designer booth" : "floor host") : "",
        focusIsGarment: !!focusG,
        focusVotes: focusG ? self.count(focusG.id) : 0,
        focusHeart: heart(focusG ? focusG.id : "none"),
        focusStar: focusG && s.saved[focusG.id]
            ? { border: "var(--color-accent-700)", bg: "var(--color-accent-200)", color: "var(--color-accent-800)", icon: "★" }
            : { border: "var(--color-text)", bg: "var(--color-neutral-100)", color: "var(--color-text)", icon: "☆" },
        cartLabel: focusG && s.cart.indexOf(focusG.id) >= 0 ? "In cart" : "＋\nCart",
        cartBg: focusG && s.cart.indexOf(focusG.id) >= 0 ? "var(--color-accent-200)" : "var(--color-neutral-100)",
        cartColor: "var(--color-text)",
        focusOpen: () => { if (focusItem)
            self.interact(focusItem.id); },
        addToCart: () => { if (focusG)
            self.addCart(focusG.id); },
        voteFocus: () => { if (focusG)
            self.vote(focusG.id); },
        saveFocus: () => { if (focusG)
            self.toggleSave(focusG.id); },
        dialogOpen: s.dialog, typed: node.text.slice(0, s.typedLen), typing: s.typing, showChoices: !s.typing,
        skipTyping: () => { clearInterval(self.t); self.setState({ typedLen: node.text.length, typing: false }); },
        choices: node.choices.map(c => ({
            label: c.label,
            pick: () => {
                if (c.to)
                    return self.node(c.to);
                if (c.act === "goTop")
                    return self.walkTo(SPOT.top[0], SPOT.top[1], SPOT.top[2]);
                if (c.act === "goBooths")
                    return self.walkTo(SPOT.booths[0], SPOT.booths[1], SPOT.booths[2]);
                if (c.act === "goNew")
                    return self.walkTo(SPOT.arrivals[0], SPOT.arrivals[1], SPOT.arrivals[2]);
                if (c.act === "donate")
                    return self.setState({ dialog: false, screen: "donate", donateStep: 1, donateChat: "photo" });
                self.setState({ dialog: false });
            }
        })),
        searchOpen: s.search, query: s.query, onQuery: e => self.setState({ query: e.target.value }),
        catChips: ["All", "Denim", "Outerwear", "Tops", "Bags", "Skirts"].map(c => Object.assign({ label: c, pick: () => self.setState({ cat: c }) }, self.chip(s.cat === c))),
        sortChips: ["Most voted", "Newest", "Price ↑"].map(c => Object.assign({ label: c, pick: () => self.setState({ sort: c }) }, self.chip(s.sort === c))),
        priceChips: ["Any", "Under $60", "$60–100", "$100+"].map(c => Object.assign({ label: c, pick: () => self.setState({ price: c }) }, self.chip(s.price === c))),
        resultCount: results.length + (results.length === 1 ? " piece" : " pieces"),
        noResults: results.length === 0,
        hasDesignerHits: designerHits.length > 0,
        designerHits: designerHits.map(b => ({ name: b.designer, bio: b.bio, pieces: b.pieces.length, open: () => self.setState({ booth: b.id, search: false }) })),
        results: results.map(g => ({
            name: g.name, designer: g.designer, price: "$" + g.price, votes: self.count(g.id),
            heart: heart(g.id),
            cartLabel: s.cart.indexOf(g.id) >= 0 ? "In cart" : "＋\nCart",
            open: () => self.openStory(g.id), cart: () => self.addCart(g.id), vote: () => self.vote(g.id)
        })),
        boothOpen: !!s.booth, closeBooth: () => self.setState({ booth: null }),
        booth: Object.assign({}, boothData, {
            pieces: boothData.pieces.map(id => {
                const g = self.item(id);
                return { name: g.name, price: "$" + g.price, votes: self.count(id), posts: self.postsFor(id).length, open: () => self.openStory(id) };
            })
        }),
        modalOpen: !!s.modal, story, closeModal: () => self.setState({ modal: null }),
        shareStory: () => self.setState({ modal: null, screen: "tag" }),
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
        postMessage: () => {
            const text = s.draft.trim();
            if (!text && !s.attachment)
                return;
            self.setState(st => {
                const posts = Object.assign({}, st.posts);
                posts[boardGarment.id] = [{ author: "you", role: "community", when: "now", text: text || "Shared an image.", attachment: st.attachment, replyTo: st.replyTarget }].concat(posts[boardGarment.id] || []);
                return { posts, draft: "", attachment: null, replyTarget: null, modal: null, boardGarment: null, screen: "messages", points: st.points + 10 };
            }, () => self.toast("Posted to your threads +10 pts"));
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
        finishDonate: () => {
            if (!(s.condition && s.size && s.drop))
                return;
            const tag = { id: "#DN-" + crypto.randomUUID().slice(0, 8).toUpperCase(), name: "Old Denim Jacket", donor: "you", condition: s.condition.toLowerCase(), size: s.size, drop: s.drop, when: new Date().toLocaleString() };
            self.setState(st => ({
                newTag: tag, screen: "tag", tagSaved: false,
                tags: [{ id: tag.id, name: tag.name, meta: tag.condition + " · size " + tag.size, status: "waiting for a maker", dot: "var(--color-accent-2)", boardLabel: "Open message board", firstMessage: "Note from the last wearer: " + tag.condition + " · size " + tag.size + (st.desc ? " · “" + st.desc + "”" : "") }].concat(st.tags)
            }), () => self.award(40, "Tag created"));
        },
        newTag: s.newTag || { id: "#PS-1180", name: "Patchwork Cargo Skirt", donor: "Priya", condition: "good", size: "S", drop: "UTS Grab-A-Fit point", when: "28 Aug 2026, 14:20" },
        qr: self.qrEl(),
        saveTagLabel: s.tagSaved ? "Save ✅" : "Save",
        saveTag: () => self.toast("Demo tag — saving is not connected"),
        tagsSummary: s.tags.length + " passed on · " + savedIds.length + " saved · " + s.points + " loom pts",
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
        myTags: s.tags.map(t => Object.assign({}, t, { open: () => self.openStory("g1") })),
        savedList: savedIds.map(id => {
            const g = self.item(id);
            return { name: g.name, designer: g.designer, price: "$" + g.price, votes: self.count(id), open: () => self.openStory(id), unsave: () => self.toggleSave(id) };
        }),
        noSaved: savedIds.length === 0,
        messageCards: Object.keys(s.posts).reduce((all, id) => {
            const garment = self.item(id), mine = (s.posts[id] || []).filter(p => p.author === "you")[0];
            return mine ? all.concat([{ garment: garment ? garment.name : "Garment", text: mine.text, when: mine.when, open: () => self.setState({ screen: "board", boardGarment: id }) }]) : all;
        }, []).concat(s.tags.map(t => ({ garment: t.name, text: t.firstMessage || ("Passed on · " + t.meta), when: "earlier", open: () => self.setState({ screen: "board", boardGarment: "g1" }) }))),
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
            { key: "tags", icon: "👔", label: "My items", badge: (unread + s.cart.length) ? String(unread + s.cart.length) : null },
            { key: "messages", icon: "◇", label: "Threads" }
        ].map(t => ({
            icon: t.icon, label: t.label, badge: t.badge || null,
            pick: () => self.setState({ screen: t.key, search: false, modal: null, booth: null }),
            bg: s.screen === t.key ? "var(--color-text)" : "var(--color-neutral-100)",
            color: s.screen === t.key ? "var(--color-neutral-100)" : "var(--color-text)"
        }))
    };
}
