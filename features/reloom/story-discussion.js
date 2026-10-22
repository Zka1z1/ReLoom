import {POSTS} from './data.js';

export function storyDiscussion(state, id) {
  const own = state.posts[id] || [], summary = state.chatSummary?.[id];
  const local = summary ? own.filter(post => !post.public) : own;
  const latest = [summary?.latest, ...local].filter(Boolean)
    .sort((a,b) => String(b.created || b.when).localeCompare(String(a.created || a.when)))[0];
  return {
    count: (summary?.count || 0) + local.length + (POSTS[id]?.length || 0),
    latest: latest ? {...latest, text:latest.text || (latest.hasPhoto ? 'Shared a photo' : '')} : null,
  };
}
