export const CATALOG = [
    { id: "g1", name: "Patchwork Cargo Skirt", designer: "@Hao", cat: "Skirts", price: 74, votes: 412, zone: "Top Voted of Aug", posts: 3 },
    { id: "g2", name: "Hoodie to Everyday Tote", designer: "@Alex", cat: "Bags", price: 96, votes: 377, zone: "Top Voted of Aug", posts: 2 },
    { id: "n1", name: "Two-Shirt Shirt", designer: "@Bo", cat: "Tops", price: 58, votes: 96, zone: "New Arrivals", posts: 2, isNew: true },
    { id: "n2", name: "Split-Seam Jeans", designer: "@Hao", cat: "Denim", price: 88, votes: 64, zone: "New Arrivals", posts: 1, isNew: true },
    { id: "n3", name: "Sock-Yarn Beanie", designer: "@Alex", cat: "Tops", price: 32, votes: 41, zone: "New Arrivals", posts: 1, isNew: true },
    { id: "b1", name: "Curtain Trench", designer: "@Chloe", cat: "Outerwear", price: 140, votes: 142, zone: "Booth @Chloe", posts: 2 },
    { id: "b2", name: "Denim Corset Top", designer: "@Bo", cat: "Denim", price: 66, votes: 76, zone: "Booth @Bo", posts: 1 }
];
export const BOOTHS = [
    { id: "bo-alex", designer: "@Alex", bio: "Accessories · Sydney", wip: "Reworking a grey hoodie into an everyday tote, keeping its zip and pockets.", progress: 35, eta: "design concept", pieces: ["g2", "n3"] },
    { id: "bo-nao", designer: "@Hao", bio: "denim surgeon · Marrickville", wip: "Panel-cutting a jacket the community passed on — handles go on Friday.", progress: 60, eta: "listing Fri", pieces: ["g1", "n2"] },
    { id: "bo-rue", designer: "@Chloe", bio: "soft tailoring · Redfern", wip: "Second seam-seal coat drying. Hood pattern in review with the board.", progress: 80, eta: "listing tomorrow", pieces: ["b1"] }
];
export const STORIES = {
    g1: { donor: "Priya, passed on 12 Jun", donorNote: "It carried me through four house moves. I wanted its next chapter to be someone else's.", steps: [{ text: "Side seams unpicked, original hem kept." }, { text: "Patch panels from three other pieces." }, { text: "Topstitch in magenta — the signature." }], kg: 3.4, pct1: 68, water: 2700, split: "60%", charity: "Pass It On Clothing" },
    g2: { concept: true, featured: true, beforeImage: "/assets/hao-hoodie-before.jpg", afterImage: "/assets/hao-tote-after.png", donor: "The original piece", donorNote: "A faded grey zip hoodie. Its soft fabric, silver zip and familiar pockets are the starting point for a new design.", steps: [{ text: "Alex’s design keeps the original zip, kangaroo pockets and ribbed hem." }, { text: "The body becomes a roomy tote; the sleeves become broad shoulder handles." }, { text: "A reclaimed pillowcase lining is proposed for the inside." }], kg: 2.1, pct1: 42, water: 1800, split: "60%", charity: "Two Good Co." },
};
export const DEFAULT_STORY = { donor: "A neighbour on the floor", donorNote: "Loved it for years and wanted it to keep going.", steps: [{ text: "Assessed with the maker." }, { text: "Upcycled with shared offcuts." }, { text: "Finished and photographed." }], kg: 2.8, pct1: 55, water: 2200, split: "60%", charity: "Pass It On Clothing" };
export const POSTS = {
    g1: [
        { author: "@Hao", role: "maker", when: "2h", text: "Black leather won the thread — thanks everyone who weighed in." },
        { author: "Priya", role: "passed it on", when: "5h", text: "Seeing my old skirt like this is unreal. The magenta stitch is perfect." },
        { author: "@kit", role: "community", when: "1d", text: "Would you ever do a version with the pocket on the left? Left-handed here." }
    ],
    g2: [
        { author: "@Alex", role: "maker", when: "40m", text: "New: strap tested at 8kg of groceries. Holding. Photos uploaded." },
        { author: "Tomas", when: "3h", text: "I love how the hoodie’s original zip and pockets are kept in the tote. Could the sleeves become the handles?" }
    ],

};
export const CONDITIONS = ["New with tags", "Like new", "Good", "Fair", "Damaged"];
export const SIZES = ["XS", "S", "M", "L", "XL", "One size", "Not sure"];
export const DROPS = [
    { label: "UTS Grab-A-Fit point", sub: "Building 4 · open until 5pm", dist: "400 m" },
    { label: "Chippendale repair night", sub: "Thursdays 6–9pm · tea provided", dist: "1.2 km" },
    { label: "Vinnies Glebe", sub: "Op Shop · 10am–6pm", dist: "1.6 km" }
];
export const GUIDE_CHOICES = [
    {id:'donate',icon:'📦',label:'Donate clothes',detail:'Give a piece its next chapter'},
    {id:'designers',icon:'🧵',label:'Find a designer',detail:'Meet the makers behind the pieces'},
    {id:'donated',icon:'👕',label:'Explore donated clothes',detail:'Find materials for a new idea'},
    {id:'upcycled',icon:'✦',label:'Discover upcycled pieces',detail:'Explore clothes reimagined'}
];
