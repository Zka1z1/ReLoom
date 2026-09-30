import React, { useRef, useState } from 'react';
import { swipeStep } from '../showroom.js';

export default function Showroom({ model }) {
  const [direction,setDirection] = useState(1);
  const gesture = useRef(null);
  const suppressClickUntil = useRef(0);
  if (!model.isStore) return null;
  const room = model.showroom;
  const move = step => {if((step<0&&!room.canPrev)||(step>0&&!room.canNext))return;setDirection(step);room.move(step);};
  const startSwipe = e => {
    if (!e.isPrimary || e.button !== 0 || e.target.closest('input, select, textarea')) return;
    gesture.current = {x: e.clientX, y: e.clientY, id: e.pointerId};
  };
  const finishSwipe = e => {
    const start = gesture.current;
    gesture.current = null;
    if (!start || start.id !== e.pointerId) return;
    const step = swipeStep(e.clientX - start.x, e.clientY - start.y);
    if (step) { suppressClickUntil.current = performance.now() + 350; move(step); }
  };
  return <section className="zone-showroom" aria-label="Virtual showroom" onKeyDown={e => {
    if (e.target.closest('input,select,textarea') || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); move(e.key === 'ArrowLeft' ? -1 : 1); }
  }}>
    <header className="zone-heading spatial-toolbar">
      <h1 className="zone-area-title">{room.label}</h1>
      <div className="zone-search-row">
        <label className="zone-search"><span className="sr-only">{room.search}</span><span aria-hidden="true">⌕</span>
          <input id="showroom-search" type="search" value={room.filters.query} placeholder={room.search} onChange={e => room.setFilters({query:e.target.value})} />
        </label>
        <button className="zone-filter-toggle" type="button" aria-expanded={room.filters.expanded} aria-controls="zone-filters" onClick={() => room.setFilters({expanded: !room.filters.expanded})}>Filters{room.activeFilters.length > 0 && <span aria-label="Active filters"> •</span>}</button>
      </div>
      {room.filters.expanded && <div className="zone-filters" id="zone-filters">
        {room.groups.map(group => <label key={group.key}>{group.label}<select value={room.filters[group.key]} onChange={e => room.setFilters({[group.key]:e.target.value})}>
          {group.options.map(option => <option key={option}>{option}</option>)}
        </select></label>)}
      </div>}
      <div className="zone-results-meta" role="status"><span className="sr-only">{room.label}: {room.countLabel}</span>
        {(room.filters.query || room.activeFilters.length > 0) && <button type="button" onClick={room.reset}>Clear all</button>}
      </div>
      {!room.filters.expanded && room.activeFilters.length > 0 && <p className="zone-active-filters">{room.activeFilters.map(group => room.filters[group.key]).join(' · ')}</p>}
    </header>
    <div className="zone-body">
      <button type="button" className="zone-arrow zone-arrow-left" aria-label="Previous area" disabled={!room.canPrev} onClick={()=>move(-1)}>‹</button>
      <div key={room.id} className={`zone-scroll zone-perspective ${direction>0?'turn-next':'turn-prev'}`} role="region" aria-label={room.label} tabIndex={0}
        onPointerDown={startSwipe}
        onPointerMove={e => { const start=gesture.current; if(start && start.id === e.pointerId && Math.abs(e.clientX-start.x)>12 && Math.abs(e.clientX-start.x)>Math.abs(e.clientY-start.y)*1.4) e.currentTarget.setPointerCapture?.(e.pointerId); }}
        onPointerUp={finishSwipe} onPointerCancel={() => {gesture.current=null;}}
        onLostPointerCapture={() => {gesture.current=null;}}
        onClickCapture={e => {if(performance.now()<suppressClickUntil.current){e.preventDefault();e.stopPropagation();}}}>
        {room.items.length === 0 && <div className="zone-empty"><h2>No matches here</h2><p>Try another search or clear the filters for this area.</p><button type="button" onClick={room.reset}>Clear search &amp; filters</button></div>}
        {room.items.map(item => <article key={item.id} className={`zone-card zone-card-${room.id}`}>
          {room.id === 'designers' ? <>
            <div className="zone-card-heading"><span className="zone-avatar" aria-hidden="true">{item.designer.slice(1,2)}</span><div><h2>{item.designer}</h2><p>{item.bio}</p></div></div>
            <div className="zone-card-label">{item.category} · {item.pieces.length} pieces</div>
            <div className="zone-work"><span className="zone-eyebrow">Work in progress</span><p>{item.wip}</p><progress aria-label={`${item.designer} work progress`} value={item.progress} max="100"/><div className="zone-progress-caption"><span>{item.progress}% complete</span><span>{item.eta}</span></div></div>
            <button type="button" className="zone-card-primary" onClick={item.open}>Visit booth</button>
          </> : room.id === 'donated' ? <>
            <div className="zone-card-label">{item.when} · Waiting for a maker</div>
            <h2>{item.name}</h2><p className="zone-material">{item.material}</p>
            <dl className="zone-garment-facts"><div><dt>Condition</dt><dd>{item.condition}</dd></div><div><dt>Size</dt><dd>{item.size}</dd></div></dl>
            <p className="zone-donor-note">“{item.note}”</p><p className="zone-donor">Passed on by {item.donor}</p><p className="zone-drop">Drop-off: {item.drop}</p>
          </> : <>
            <button type="button" className="zone-piece-open" onClick={item.open}><div className="rl-x zone-piece-placeholder" aria-hidden="true"><span>{item.cat}</span></div><span className="zone-piece-name">{item.name}</span></button>
            <div className="zone-piece-meta"><span>{item.designer}</span><strong>${item.price}</strong></div>
            <div className="zone-piece-actions"><button type="button" onClick={item.vote} aria-label={`Vote for ${item.name}`} aria-pressed={item.voted}>♥ {item.votes}</button><button type="button" onClick={item.save} aria-pressed={item.saved} aria-label={`${item.saved ? 'Unsave' : 'Save'} ${item.name}`}>{item.saved ? '★ Saved' : '☆ Save'}</button><button type="button" onClick={item.addCart} aria-label={`Add ${item.name} to cart`}>{item.inCart ? 'In cart' : '＋ Cart'}</button></div>
          </>}
        </article>)}
      </div>
      <button type="button" className="zone-arrow zone-arrow-right" aria-label="Next area" disabled={!room.canNext} onClick={()=>move(1)}>›</button>
    </div>
    <footer className="zone-footer"><span>Swipe to explore</span><div aria-label="Current area">{room.zones.map(zone => <span key={zone.id} className={zone.active ? 'active' : ''} aria-hidden="true" />)}</div></footer>
  </section>;
}
