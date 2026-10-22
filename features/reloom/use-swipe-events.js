import {useCallback, useRef} from 'react';
import {attachSwipeTouchEvents} from './swipe-events.js';

export function useSwipeEvents(handlers, elementRef) {
  const current = useRef(handlers), detach = useRef(null);
  current.current = handlers;
  const ref = useCallback(element => {
    detach.current?.();
    if (elementRef) elementRef.current = element;
    detach.current = element ? attachSwipeTouchEvents(element, () => current.current) : null;
  }, [elementRef]);
  // Ref callbacks also reattach when the keyed showroom area is replaced.
  const {onTouchStart, onTouchMove, onTouchEnd, onTouchCancel, ...bindings} = handlers;
  return {...bindings, ref};
}
