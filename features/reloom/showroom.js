import { BOOTHS, CATALOG } from './data.js';
import { voteCount } from './domain.js';

export const ZONES = [
  { id: 'designers', label: 'Designer booths', short: 'Designers', search: 'Search designers or specialties', description: 'Meet the makers and explore their work.' },
  { id: 'donated', label: 'Newly donated', short: 'Donated', search: 'Search donated clothes or materials', description: 'Pre-loved pieces waiting for their next chapter.' },
  { id: 'upcycled', label: 'Upcycled clothes', short: 'Upcycled', search: 'Search clothes or designers', description: 'Finished pieces, reimagined by our makers.' },
];
const ALL = 'All';
export const EMPTY_FILTERS = { query: '', category: ALL, condition: ALL, size: ALL, price: ALL, sort: 'Featured', expanded: false };
export const DONATIONS = [
  { id: 'don-denim', name: 'Faded Denim Jacket', cat: 'Denim', material: 'Cotton denim', condition: 'Good', size: 'M', donor: 'Priya', note: 'Worn cuffs, with plenty of strong fabric left to work with.', drop: 'UTS Grab-A-Fit point', when: 'Today' },
  { id: 'don-shirt', name: 'Striped Cotton Shirt', cat: 'Tops', material: 'Cotton', condition: 'Like new', size: 'L', donor: 'Tomas', note: 'Soft cotton with all buttons intact.', drop: 'Chippendale repair night', when: 'Today' },
  { id: 'don-knit', name: 'Wool Cardigan', cat: 'Knitwear', material: 'Wool blend', condition: 'Fair', size: 'S', donor: 'Sam', note: 'A small hole near the hem; the yarn could be reused.', drop: 'Vinnies Glebe', when: 'Yesterday' },
  { id: 'don-skirt', name: 'Pleated Midi Skirt', cat: 'Skirts', material: 'Cotton blend', condition: 'Good', size: 'M', donor: 'Jess', note: 'A loose waistband seam needs a little attention.', drop: 'UTS Grab-A-Fit point', when: 'Yesterday' },
];
const SPECIALTIES = { 'bo-alex': 'Denim', 'bo-nao': 'Accessories', 'bo-rue': 'Tailoring' };
export const FILTER_GROUPS = {
  designers: [{ key: 'category', label: 'Specialty', options: [ALL, 'Denim', 'Accessories', 'Tailoring'] }],
  donated: [
    { key: 'category', label: 'Category', options: [ALL, 'Denim', 'Tops', 'Knitwear', 'Skirts', 'Outerwear'] },
    { key: 'condition', label: 'Condition', options: [ALL, 'New with tags', 'Like new', 'Good', 'Fair', 'Damaged'] },
    { key: 'size', label: 'Size', options: [ALL, 'XS', 'S', 'M', 'L', 'XL'] },
  ],
  upcycled: [
    { key: 'category', label: 'Category', options: [ALL, 'Denim', 'Outerwear', 'Tops', 'Bags', 'Skirts'] },
    { key: 'price', label: 'Price', options: [ALL, 'Under $60', '$60–100', '$100+'] },
    { key: 'sort', label: 'Sort by', options: ['Featured', 'Most voted', 'Newest', 'Price: low to high'] },
  ],
};
export function selectZoneItems(zone, filters, donations = DONATIONS, votes = {}) {
  const query = filters.query.trim().toLowerCase();
  const source = zone === 'designers' ? BOOTHS.map(b => ({ ...b, category: SPECIALTIES[b.id] })) : zone === 'donated' ? donations : CATALOG;
  const result = source.filter(item => {
    const searchText = zone === 'designers' ? `${item.designer} ${item.bio} ${item.category}` : `${item.name} ${item.designer ?? ''} ${item.material ?? ''} ${item.donor ?? ''} ${item.note ?? ''}`;
    if (!searchText.toLowerCase().includes(query)) return false;
    if (filters.category !== ALL && (item.category ?? item.cat) !== filters.category) return false;
    if (zone === 'donated') return (filters.condition === ALL || item.condition === filters.condition) && (filters.size === ALL || item.size === filters.size);
    if (zone === 'upcycled') return filters.price === ALL || (filters.price === 'Under $60' && item.price < 60) || (filters.price === '$60–100' && item.price >= 60 && item.price <= 100) || (filters.price === '$100+' && item.price > 100);
    return true;
  });
  if (zone === 'upcycled') {
    if (filters.sort === 'Price: low to high') result.sort((a, b) => a.price - b.price);
    if (filters.sort === 'Most voted') result.sort((a, b) => voteCount(b.id, votes) - voteCount(a.id, votes));
    if (filters.sort === 'Newest') result.sort((a, b) => Number(!!b.isNew) - Number(!!a.isNew));
  }
  return result;
}
export function swipeStep(dx, dy) {
  return Math.abs(dx) >= 56 && Math.abs(dx) > Math.abs(dy) * 1.4 ? (dx < 0 ? 1 : -1) : 0;
}
export function createShowroomModel(self) {
  const index = self.state.showroomZone;
  const zone = ZONES[index];
  const filters = self.state.showroomFilters[zone.id];
  const setFilters = patch => self.setState(s => ({showroomFilters: {...s.showroomFilters, [zone.id]: {...s.showroomFilters[zone.id], ...patch}}}));
  const activeFilters = FILTER_GROUPS[zone.id].filter(group => filters[group.key] !== EMPTY_FILTERS[group.key]);
  const items = selectZoneItems(zone.id, filters, self.state.donations, self.state.votes).map(item => ({
    ...item,
    open: () => zone.id === 'designers' ? self.setState({booth: item.id}) : self.openStory(item.id),
    vote: () => self.vote(item.id), votes: self.count(item.id), voted: !!self.state.voted[item.id],
    save: () => self.toggleSave(item.id), saved: !!self.state.saved[item.id],
    addCart: () => self.addCart(item.id), inCart: self.state.cart.includes(item.id),
  }));
  return {
    ...zone, index, items, filters, activeFilters, groups: FILTER_GROUPS[zone.id],
    zones: ZONES.map((z, i) => ({...z, active: i === index, pick: () => self.changeZone(i)})),
    prev: () => self.changeZone(index - 1), next: () => self.changeZone(index + 1),
    move: step => self.changeZone(index + step), canPrev: index > 0, canNext: index < ZONES.length - 1,
    setFilters, reset: () => setFilters({...EMPTY_FILTERS, expanded: filters.expanded}),
    countLabel: `${items.length} ${zone.id === 'designers' ? (items.length === 1 ? 'designer' : 'designers') : (items.length === 1 ? 'piece' : 'pieces')}`,
  };
}
