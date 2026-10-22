import {useEffect,useRef,useState} from 'react';
import {chatRequest} from './chat.js';
import {createChatTimeline} from './chat-timeline.js';

export function useChatTimeline(room, onUnread) {
  const [snapshot,setSnapshot] = useState({messages:[],more:false});
  const [status,setStatus] = useState('connecting');
  const session = useRef(null), syncRef = useRef(null), unread = useRef(onUnread);
  unread.current = onUnread;
  useEffect(() => {
    let active = true, polling = false;
    const timeline = createChatTimeline(
      (action,before) => chatRequest(room,action,before),
      value => { setSnapshot(value); setStatus('live'); },
      count => unread.current(count),
    );
    session.current = timeline;
    const sync = async () => {
      if (!active || document.hidden || polling) return;
      polling = true;
      try { await timeline.refresh(); }
      catch { if (active) setStatus('offline'); }
      finally { polling = false; }
    };
    const visibility = () => document.hidden ? setStatus('paused') : sync();
    syncRef.current = sync;
    sync();
    const timer = setInterval(sync,2500);
    document.addEventListener('visibilitychange',visibility);
    window.addEventListener('online',sync);
    return () => {
      active = false; timeline.dispose(); clearInterval(timer);
      document.removeEventListener('visibilitychange',visibility);
      window.removeEventListener('online',sync);
    };
  },[room]);
  return {
    ...snapshot,status,
    refresh: () => syncRef.current?.(),
    update: action => session.current?.refresh(action),
    older: () => session.current?.older(),
    read: cursor => session.current?.read(cursor),
  };
}
