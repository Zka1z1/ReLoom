export const CATALOG = [
    { id: "g1", name: "Patchwork Cargo Skirt", designer: "@Alex", cat: "Skirts", price: 74, votes: 412, zone: "Top Voted of Aug", posts: 3 },
    { id: "g2", name: "Upcycled Tote Jacket", designer: "@Hao", cat: "Bags", price: 96, votes: 377, zone: "Top Voted of Aug", posts: 2 },
    { id: "g3", name: "Bedsheet Windbreaker", designer: "@Chloe", cat: "Outerwear", price: 120, votes: 341, zone: "Top Voted of Aug", posts: 4 },
    { id: "n1", name: "Two-Shirt Shirt", designer: "@Bo", cat: "Tops", price: 58, votes: 96, zone: "New Arrivals", posts: 2, isNew: true },
    { id: "n2", name: "Split-Seam Jeans", designer: "@Alex", cat: "Denim", price: 88, votes: 64, zone: "New Arrivals", posts: 1, isNew: true },
    { id: "n3", name: "Sock-Yarn Beanie", designer: "@Hao", cat: "Tops", price: 32, votes: 41, zone: "New Arrivals", posts: 1, isNew: true },
    { id: "b1", name: "Curtain Trench", designer: "@Chloe", cat: "Outerwear", price: 140, votes: 142, zone: "Booth @Chloe", posts: 2 },
    { id: "b2", name: "Denim Corset Top", designer: "@Bo", cat: "Denim", price: 66, votes: 76, zone: "Booth @Bo", posts: 1 }
];
export const BOOTHS = [
    { id: "bo-alex", designer: "@Alex", bio: "denim surgeon · Sydney", wip: "Panel-cutting a jacket the community passed on — handles go on Friday.", progress: 60, eta: "listing Fri", pieces: ["g1", "n2"] },
    { id: "bo-nao", designer: "@Hao", bio: "Vintage Lovers · Marrickville", wip: "Lining stitched from three pillowcases; testing strap load now.", progress: 35, eta: "listing next week", pieces: ["g2", "n3"] },
    { id: "bo-rue", designer: "@Chloe", bio: "soft tailoring · Redfern", wip: "Second seam-seal coat drying. Hood pattern in review with the board.", progress: 80, eta: "listing tomorrow", pieces: ["g3", "b1"] }
];
export const STORIES = {
    g1: { donor: "Priya, passed on 12 Jun", donorNote: "It carried me through four house moves. I wanted its next chapter to be someone else's.", steps: [{ text: "Side seams unpicked, original hem kept." }, { text: "Patch panels from three other pieces." }, { text: "Topstitch in magenta — the signature." }], kg: 3.4, pct1: 68, water: 2700, split: "60%", charity: "Pass It On Clothing" },
    g2: { donor: "Tomas, passed on 2 Jul", donorNote: "Wore it to one wedding and loved it. Somebody should get proper use out of this.", steps: [{ text: "Sleeves saved for the strap." }, { text: "Body boxed out into a tote." }, { text: "Lining from shared pillowcases." }], kg: 2.1, pct1: 42, water: 1800, split: "60%", charity: "Two Good Co." },
    g3: { donor: "A hostel laundry, passed on 28 May", donorNote: "Twelve bedsheets retired from service — the cloth was still beautiful.", steps: [{ text: "Dyed in three overlapping baths." }, { text: "Seams taped and sealed for rain." }, { text: "Hood cut from the offcuts." }], kg: 5.6, pct1: 88, water: 4100, split: "70%", charity: "Seed Mob" }
};
export const DEFAULT_STORY = { donor: "A neighbour on the floor", donorNote: "Loved it for years and wanted it to keep going.", steps: [{ text: "Assessed with the maker." }, { text: "Upcycled with shared offcuts." }, { text: "Finished and photographed." }], kg: 2.8, pct1: 55, water: 2200, split: "60%", charity: "Pass It On Clothing" };
export const POSTS = {
    g1: [
        { author: "@Alex", role: "maker", when: "2h", text: "Black leather won the thread — thanks everyone who weighed in." },
        { author: "Priya", role: "passed it on", when: "5h", text: "Seeing my old skirt like this is unreal. The magenta stitch is perfect." },
        { author: "@kit", role: "community", when: "1d", text: "Would you ever do a version with the pocket on the left? Left-handed here." }
    ],
    g2: [
        { author: "@Hao", role: "maker", when: "40m", text: "New: strap tested at 8kg of groceries. Holding. Photos uploaded." },
        { author: "Tomas", role: "passed it on", when: "3h", text: "That lining! Didn't expect pillowcases to look this good." }
    ],
    g3: [
        { author: "@Chloe", role: "maker", when: "1h", text: "Hood pattern is up for opinions — deep or cropped? Post below and I'll cut Thursday." },
        { author: "@mira", role: "community", when: "2h", text: "Deep. Sydney rain doesn't negotiate." },
        { author: "@sol", role: "community", when: "6h", text: "Cropped looks sharper with the boxy body imo." },
        { author: "@Chloe", role: "maker", when: "8h", text: "Seam sealing round two done, drying overnight." }
    ]
};
export const CONDITIONS = ["New with tags", "Like new", "Good", "Fair", "Damaged"];
export const SIZES = ["XS", "S", "M", "L", "XL"];
export const DROPS = [
    { label: "UTS Grab-A-Fit point", sub: "Building 4 · open until 5pm", dist: "400 m" },
    { label: "Chippendale repair night", sub: "Thursdays 6–9pm · tea provided", dist: "1.2 km" },
    { label: "Vinnies Glebe", sub: "Op Shop · 10am–6pm", dist: "1.6 km" }
];
export const NODES = {
    welcome: {
        text: "Hey, welcome in! I'm Mei 🌱\nSwipe between designer booths, newly donated clothes and upcycled pieces. Search or filter within each area to find what interests you.",
        choices: [{ label: "Show me around", to: "around" }, { label: "I'd like to donate", to: "donate" }, { label: "Explore the showroom", act: "close" }]
    },
    around: {
        text: "There are three areas: Designer booths, Newly donated and Upcycled clothes. Swipe left or right, or use the side arrows. Each area has its own search and filters.",
        choices: [{ label: "Browse upcycled clothes", act: "goTop" }, { label: "Take me to the booths", act: "goBooths" }, { label: "Browse newly donated clothes", act: "goNew" }]
    },
    donate: {
        text: "Awesome! Let's snap a few photos, log key details makers like to know, and anything you want to share. Once done, I\u2019ll guide you to your nearest drop-off point!",
        choices: [{ label: "Let\u2019s start！", act: "donate" }, { label: "Maybe later", act: "close" }]
    }
};
