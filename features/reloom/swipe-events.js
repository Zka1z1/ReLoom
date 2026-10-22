// Native listeners let iOS cancel scrolling and the compatibility click.
export function attachSwipeTouchEvents(element, getHandlers) {
  const listeners = [
    ['touchstart', 'onTouchStart', {passive: true}],
    ['touchmove', 'onTouchMove', {passive: false}],
    ['touchend', 'onTouchEnd', {passive: false}],
    ['touchcancel', 'onTouchCancel', {passive: true}],
  ].map(([type, name, options]) => {
    const listener = event => getHandlers()[name](event);
    element.addEventListener(type, listener, options);
    return [type, listener, options];
  });
  return () => listeners.forEach(args => element.removeEventListener(...args));
}

// Handle touch once, independently of pointer capture; share this across swipes.
export function swipeEvents(state, {start, move, finish, cancel}) {
  const touchPoint = (event, touch) => ({
    pointerId: touch.identifier, clientX: touch.clientX, clientY: touch.clientY,
    target: event.target, currentTarget: event.currentTarget,
    isPrimary: true, button: 0,
    preventDefault: () => { if (event.cancelable) event.preventDefault(); },
  });
  const touch = handler => event => {
    if (state.gesture?.input !== 'touch') return;
    const point = Array.from(event.changedTouches).find(t => t.identifier === state.gesture.id);
    if (point) handler(touchPoint(event, point));
  };
  const pointer = handler => event => {
    if (event.pointerType !== 'touch' && !event.nativeEvent?.sourceCapabilities?.firesTouchEvents && state.gesture?.input !== 'touch') handler(event);
  };
  return {
    onTouchStart: event => {
      if (event.touches.length !== 1) {
        if (state.gesture?.input === 'touch') cancel({pointerId: state.gesture.id});
        return;
      }
      start(touchPoint(event, event.touches[0]), 'touch');
    },
    onTouchMove: touch(move), onTouchEnd: touch(finish), onTouchCancel: touch(cancel),
    onPointerDown: pointer(start), onPointerMove: pointer(move),
    onPointerUp: pointer(finish), onPointerCancel: pointer(cancel),
    onLostPointerCapture: pointer(event => {
      // Capture moving from a child bubbles here without ending our gesture.
      if (event.target === event.currentTarget) cancel(event);
    }),
    onDragStart: event => event.preventDefault(),
  };
}
