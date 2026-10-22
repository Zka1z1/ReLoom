import {swipeEvents} from './swipe-events.js';

export const SWIPE_ACTION_WIDTH = 168;

const offsetFor = (gesture, x) => Math.max(-SWIPE_ACTION_WIDTH, Math.min(0, gesture.base + x - gesture.x));
const SWIPE_DISTANCE = 40;

// Keep gesture state outside rendering so moving a card cannot reset its pointer.
export function createSwipeHandlers(state, {open, disabled, onToggle, onOpen, onDrag}) {
  function start(event, input = 'pointer') {
    if (disabled || !event.isPrimary || event.button !== 0 || state.gesture) return;
    state.suppressClick = false;
    state.gesture = {
      id: event.pointerId, x: event.clientX, y: event.clientY,
      base: open ? -SWIPE_ACTION_WIDTH : 0, locked: false, input,
    };
    // Keep mouse/pen dragging on the card even when it moves under the pointer.
    if (input === 'pointer') event.currentTarget.setPointerCapture(event.pointerId);
  }

  function move(event) {
    const gesture = state.gesture;
    if (!gesture || gesture.id !== event.pointerId) return;
    const dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
    if (!gesture.locked) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 8) return;
      state.suppressClick = true;
      if (Math.abs(dy) >= Math.abs(dx)) {
        state.gesture = null;
        return;
      }
      gesture.locked = true;
    }
    event.preventDefault();
    onDrag(offsetFor(gesture, event.clientX));
  }

  function finish(event) {
    const gesture = state.gesture;
    if (!gesture || gesture.id !== event.pointerId) return;
    state.gesture = null;
    if (gesture.locked) {
      const offset = offsetFor(gesture, event.clientX);
      onToggle(gesture.base === 0 ? offset <= -SWIPE_DISTANCE : offset < -SWIPE_ACTION_WIDTH + SWIPE_DISTANCE);
      // Stops a synthetic click being sent after touchend on mobile browsers.
      if (gesture.input === 'touch') event.preventDefault();
    }
    onDrag(null);
  }

  function cancel(event) {
    if (!state.gesture || state.gesture.id !== event.pointerId) return;
    state.gesture = null;
    state.suppressClick = true;
    onDrag(null);
  }

  return {
    ...swipeEvents(state, {start, move, finish, cancel}),
    onKeyDown: event => {
      if (event.key === 'Enter' || event.key === ' ') state.suppressClick = false;
      if (!disabled && event.key === 'ArrowLeft') { event.preventDefault(); onToggle(true); }
    },
    onClick: event => {
      // Some mobile WebViews send MouseEvents with detail=0 and no pointerType.
      // A fresh touch/pointer down or keyboard activation clears this flag.
      if (disabled || state.suppressClick) {
        state.suppressClick = false;
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      if (open) onToggle(false);
      else onOpen();
    },
  };
}
