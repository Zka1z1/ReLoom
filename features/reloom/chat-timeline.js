export const messageCursor = message => message.created + message.id;
const ordered = messages => [...new Map(messages.map(m => [m.id,m])).values()]
  .sort((a,b) => messageCursor(a).localeCompare(messageCursor(b)));

// Serialize polling, writes and paging so a slower response cannot overwrite a
// newer one. A refresh is published only after every missing page has arrived.
export function createChatTimeline(load, onChange, onUnread) {
  let messages = [], more = false, active = true, queue = Promise.resolve();
  const enqueue = operation => {
    const result = queue.then(() => active ? operation() : null);
    queue = result.catch(() => {});
    return result;
  };
  function publish(next, hasMore, unread) {
    if (!active) return null;
    messages = next; more = hasMore;
    onChange({messages,more}); onUnread(unread);
    return {messages,more};
  }
  return {
    refresh: action => enqueue(async () => {
      const latest = await load(action);
      if (!active) return null;
      const anchor = messages.at(-1), pages = [latest.messages];
      let page = latest;
      while (anchor && page.more && page.messages.length && messageCursor(page.messages[0]) > messageCursor(anchor)) {
        const before = messageCursor(page.messages[0]);
        page = await load(null,before);
        if (!active) return null;
        // Reject a non-advancing cursor instead of silently accepting a gap.
        if (page.more && (!page.messages.length || messageCursor(page.messages[0]) >= before)) throw Error('Chat history could not be loaded. Please reconnect.');
        pages.push(page.messages);
      }
      const fetched = ordered(pages.flat()), first = fetched[0];
      const older = page.more && first ? messages.filter(m => messageCursor(m) < messageCursor(first)) : [];
      const next = ordered([...older,...fetched]).filter(m => action?.type !== 'delete' || m.id !== action.id);
      const hasMore = page.more && (older.length ? more : true);
      return publish(next,hasMore,latest.unread);
    }),
    older: () => enqueue(async () => {
      if (!more || !messages.length) return null;
      const page = await load(null,messageCursor(messages[0]));
      return publish(ordered([...page.messages,...messages]),page.more,page.unread);
    }),
    read: cursor => enqueue(async () => {
      const data = await load({type:'read',cursor});
      if (active) onUnread(data.unread);
      return data;
    }),
    dispose: () => { active = false; },
  };
}
