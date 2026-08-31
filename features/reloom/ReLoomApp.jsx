"use client";
import React from "react";
import { ITEMS, WALLS, ROOM, SHOWROOM_SCALE, NODES } from "./data.js";
import { castVote, findGarment, voteCount, garmentPosts } from "./domain.js";
import { createViewModel } from "./view-model.js";
import AppView from "./components/AppView.jsx";
export default class ReLoomApp extends React.Component {
    state = {
        screen: "store", dialog: true, node: "welcome", typedLen: 0, typing: true,
        points: 120, votes: {}, voted: {}, saved: {}, cart: [], toast: null, focus: null,
        search: false, query: "", cat: "All", sort: "Most voted", price: "Any",
        modal: null, boardGarment: null, draft: "", attachment: null, replyTarget: null, posts: {}, seen: {}, booth: null,
        donateStep: 1, donateChat: "photo", photos: false, condition: null, size: null, desc: "", drop: null,
        tags: [{ id: "#PS-1180", name: "Patchwork Cargo Skirt", meta: "good · size S", status: "upcycled · rehomed", dot: "var(--color-neutral-500)", boardLabel: "5 posts", firstMessage: "Note fromthe last wearer: good · size S" }],
        newTag: null, tagSaved: false, itemsTab: "donated"
    };
    constructor(props) {
        super(props);
        this.cam = { x: 0, z: -180, yaw: 0 };
        this.joy = { x: 0, y: 0 };
        this.els = {};
        this.wallEls = {};
        this.drag = null;
        this.joyActive = false;
    }
    componentDidMount() { this.loop(); this.type(); }
    componentDidUpdate(previousProps, previousState) {
        if (previousState.screen !== this.state.screen) {
            cancelAnimationFrame(this.raf);
            this.lastFrame = null;
            this.lastCamera = null;
            if (this.state.screen === "store")
                this.loop();
        }
    }
    componentWillUnmount() { cancelAnimationFrame(this.raf); clearInterval(this.t); clearTimeout(this.tt); }
    loop = (timestamp = performance.now()) => {
        if (this.state.screen !== "store")
            return;
        const elapsed = this.lastFrame == null ? 1 : Math.min((timestamp - this.lastFrame) / (1000 / 60), 2);
        this.lastFrame = timestamp;
        const c = this.cam, j = this.joy, speed = (this.props.walkSpeed ?? 8) * elapsed;
        const rad = c.yaw * Math.PI / 180;
        const fx = Math.sin(rad), fz = -Math.cos(rad);
        if (j.y) {
            c.x += fx * speed * -j.y;
            c.z += fz * speed * -j.y;
        }
        if (j.x) {
            c.x += -fz * speed * 0.85 * j.x;
            c.z += fx * speed * 0.85 * j.x;
        }
        c.x = Math.max(ROOM.minX, Math.min(ROOM.maxX, c.x));
        c.z = Math.max(ROOM.minZ, Math.min(ROOM.maxZ, c.z));
        const cameraKey = `${c.x},${c.z},${c.yaw}`;
        if (cameraKey === this.lastCamera) {
            this.raf = requestAnimationFrame(this.loop);
            return;
        }
        this.lastCamera = cameraKey;
        if (this.world)
            this.world.style.transform = "scale(" + SHOWROOM_SCALE + ") rotateY(" + c.yaw + "deg) translate3d(" + (-c.x) + "px, 250px, " + (-c.z) + "px)";
        if (this.floor)
            this.floor.style.transform = "rotateX(90deg)";
        WALLS.forEach(w => {
            const el = this.wallEls[w.id];
            if (!el)
                return;
            el.style.width = w.w + "px";
            el.style.height = w.h + "px";
            el.style.marginLeft = (-w.w / 2) + "px";
            el.style.marginTop = (-w.h) + "px";
            el.style.transform = "translate3d(" + w.x + "px, 0px, " + w.z + "px) rotateY(" + w.rot + "deg)";
        });
        let best = null, bestD = 560;
        ITEMS.forEach(it => {
            const el = this.els[it.id];
            const dx = it.x - this.cam.x, dz = it.z - this.cam.z;
            const along = dx * fx + dz * fz;
            const d = Math.sqrt(dx * dx + dz * dz);
            if (el) {
                el.style.width = it.w + "px";
                el.style.height = it.h + "px";
                el.style.marginLeft = (-it.w / 2) + "px";
                el.style.marginTop = (-(it.h + (it.y || 0))) + "px";
                el.style.transform = "translate3d(" + it.x + "px, 0px, " + it.z + "px) rotateY(" + (it.kind === "sign" ? (it.rot || 0) : -c.yaw) + "deg)";
                el.style.visibility = along < 120 ? "hidden" : "visible";
                el.style.opacity = d > 1250 ? "0.6" : "1";
            }
            if (it.kind !== "sign" && d < bestD && (along / (d || 1)) > 0.1) {
                bestD = d;
                best = it.id;
            }
        });
        if (best !== this.state.focus)
            this.setState({ focus: best });
        if (this.dot) {
            this.dot.style.left = ((c.x - ROOM.minX) / (ROOM.maxX - ROOM.minX) * 100) + "%";
            this.dot.style.top = ((c.z - ROOM.minZ) / (ROOM.maxZ - ROOM.minZ) * 100) + "%";
        }
        this.raf = requestAnimationFrame(this.loop);
    };
    toast(msg) { clearTimeout(this.tt); this.setState({ toast: msg }); this.tt = setTimeout(() => this.setState({ toast: null }), 1700); }
    award(n, msg) { this.setState(s => ({ points: s.points + n })); this.toast(msg + " +" + n + " pts"); }
    type() {
        clearInterval(this.t);
        const full = NODES[this.state.node].text.length;
        this.setState({ typedLen: 0, typing: true });
        this.t = setInterval(() => this.setState(s => {
            if (s.typedLen >= full) {
                clearInterval(this.t);
                return { typing: false };
            }
            return { typedLen: s.typedLen + 2 };
        }), 16);
    }
    node(id) { this.setState({ dialog: true, node: id }, () => this.type()); }
    walkTo(x, z, yaw) { this.cam.x = x; this.cam.z = z; this.cam.yaw = yaw; this.setState({ dialog: false, screen: "store" }); }
    item(id) { return findGarment(id); }
    count(id) { return voteCount(id, this.state.votes); }
    postsFor(id) { return garmentPosts(id, this.state.posts); }
    vote(id) {
        if (this.state.voted[id])
            return this.toast("Already voted");
        this.setState(state => castVote(state, id), () => this.toast("Vote counted +5 pts"));
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
        }, () => this.toast(this.state.saved[id] ? "Saved to My items" : "Removed from My items"));
    }
    addCart(id) {
        if (!findGarment(id))
            return;
        if (this.state.cart.includes(id))
            return this.toast("Already in cart");
        this.setState(s => ({ cart: [...s.cart, id] }), () => this.toast("Added to cart"));
    }
    openStory(id) { this.setState({ modal: id, booth: null, search: false, seen: Object.assign({}, this.state.seen, { [id]: true }) }); }
    interact(id) {
        const it = ITEMS.filter(i => i.id === id)[0];
        if (!it)
            return;
        if (it.kind === "sign")
            return;
        if (it.kind === "booth")
            return this.setState({ booth: id, search: false });
        this.openStory(id);
    }
    chip(active) {
        return active
            ? { border: "var(--color-text)", bg: "var(--color-text)", color: "var(--color-neutral-100)" }
            : { border: "var(--color-neutral-400)", bg: "var(--color-neutral-100)", color: "var(--color-text)" };
    }
    qrEl() {
        const n = 21, cells = [];
        for (let y = 0; y < n; y++)
            for (let x = 0; x < n; x++) {
                const quiet = (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13);
                const eye = quiet && (x % 6 === 0 || y % 6 === 0 || (x > 1 && x < 5 && y > 1 && y < 5) || (x > 15 && x < 19 && y > 1 && y < 5) || (x > 1 && x < 5 && y > 15 && y < 19));
                const on = quiet ? eye : ((x * 7 + y * 13 + ((x * y) % 5)) % 3 === 0);
                cells.push(React.createElement("span", { key: x + "-" + y, style: { background: on ? "var(--color-text)" : "transparent" } }));
            }
        return React.createElement("div", { style: { width: 86, height: 86, flex: "none", display: "grid", gridTemplateColumns: "repeat(21,1fr)", gridTemplateRows: "repeat(21,1fr)", border: "1.5px solid var(--color-text)", padding: 4 } }, cells);
    }
    render() { return <AppView model={createViewModel(this)}/>; }
}
