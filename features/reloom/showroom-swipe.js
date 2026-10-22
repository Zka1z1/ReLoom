import {swipeStep} from './showroom.js';
import {swipeEvents} from './swipe-events.js';

export function createShowroomSwipeHandlers(state, onMove) {
  function start(event, input = 'pointer') {
    if (!event.isPrimary || event.button !== 0 || state.gesture || event.target.closest?.('input, select, textarea')) return;
    state.suppressClick = false;
    state.gesture = {id: event.pointerId, x: event.clientX, y: event.clientY, input, locked: false};
  }
  function move(event) {
    const g = state.gesture;
    if (!g || g.id !== event.pointerId) return;
    const dx = Math.abs(event.clientX - g.x), dy = Math.abs(event.clientY - g.y);
    if (!g.locked) {
      if (Math.max(dx, dy) < 12) return;
      state.suppressClick = true;
      if (dx <= dy * 1.4) { state.gesture = null; return; }
      g.locked = true;
      if (g.input === 'pointer') event.currentTarget.setPointerCapture(event.pointerId);
    }
    event.preventDefault();
  }
  function finish(event) {
    const g = state.gesture;
    if (!g || g.id !== event.pointerId) return;
    state.gesture = null;
    if (!g.locked) return;
    if (g.input === 'touch') event.preventDefault();
    const step = swipeStep(event.clientX - g.x, event.clientY - g.y);
    if (step) onMove(step);
  }
  function cancel(event) {
    if (state.gesture?.id !== event.pointerId) return;
    state.gesture = null;
    state.suppressClick = true;
  }
  return {
    ...swipeEvents(state, {start, move, finish, cancel}),
    onKeyDown: () => { state.suppressClick = false; },
    onClickCapture: event => {
      if (!state.suppressClick) return;
      state.suppressClick = false;
      event.preventDefault(); event.stopPropagation();
    },
  };
}
