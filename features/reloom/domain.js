import { CATALOG, POSTS } from './data.js';
const garmentsById = new Map(CATALOG.map(garment => [garment.id, garment]));
export const findGarment = (id, donations=[]) => garmentsById.get(id) || donations.filter(d=>d.id===id).map(d=>({...d,kind:'donation',designer:'Awaiting a maker',zone:'Newly donated'}))[0];
export const voteCount = (id, votes) => (findGarment(id)?.votes ?? 0) + (votes[id] ?? 0);
export const garmentPosts = (id, posts) => [...(posts[id] ?? []), ...(POSTS[id] ?? [])];
