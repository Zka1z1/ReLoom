import { CATALOG, POSTS } from './data.js';
const garmentsById = new Map(CATALOG.map(garment => [garment.id, garment]));
export const findGarment = id => garmentsById.get(id);
export const voteCount = (id, votes) => (findGarment(id)?.votes ?? 0) + (votes[id] ?? 0);
export const garmentPosts = (id, posts) => [...(posts[id] ?? []), ...(POSTS[id] ?? [])];
/** A vote earns points once, even when the user clicks repeatedly. */
export function castVote(state, id) {
    if (!findGarment(id) || state.voted[id])
        return null;
    return { votes: { ...state.votes, [id]: (state.votes[id] ?? 0) + 1 },
        voted: { ...state.voted, [id]: true }, popId: id, points: state.points + 5 };
}
export function selectGarments({ query, cat, price, sort, votes }) {
    const text = query.trim().toLowerCase();
    const results = CATALOG.filter(garment => {
        const matchesText = !text || `${garment.name} ${garment.designer}`.toLowerCase().includes(text);
        const matchesCategory = cat === 'All' || garment.cat === cat;
        const matchesPrice = price === 'Any' || (price === 'Under $60' && garment.price < 60)
            || (price === '$60–100' && garment.price >= 60 && garment.price <= 100)
            || (price === '$100+' && garment.price > 100);
        return matchesText && matchesCategory && matchesPrice;
    });
    if (sort === 'Most voted')
        results.sort((a, b) => voteCount(b.id, votes) - voteCount(a.id, votes));
    if (sort === 'Newest')
        results.sort((a, b) => Number(!!b.isNew) - Number(!!a.isNew));
    if (sort === 'Price ↑')
        results.sort((a, b) => a.price - b.price);
    return results;
}
