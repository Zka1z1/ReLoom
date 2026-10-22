import {POSTS} from '../features/reloom/data.js';

export const introCount=(room:string)=>(POSTS as Record<string,unknown[]>)[room]?.length||0;
export const introRoom=(room:string)=>`intro:${room}`;

// Reuse the same read cursors for the room badge and the My summary.
export async function chatUnreadCounts(db:D1Database,owner:string,rooms:string[]) {
 if(!rooms.length)return {};
 const rows=await db.prepare(`
  SELECT rooms.value AS room,COUNT(m.id) AS unread,intro.cursor AS intro_read
  FROM json_each(?) AS rooms
  LEFT JOIN reloom_reads r ON r.owner=? AND r.room=rooms.value
  LEFT JOIN reloom_reads intro ON intro.owner=? AND intro.room='intro:' || rooms.value
  LEFT JOIN reloom_messages m ON m.room=rooms.value AND m.owner<>? AND m.created || m.id>COALESCE(r.cursor,'')
  GROUP BY rooms.value
 `).bind(JSON.stringify([...new Set(rooms)]),owner,owner,owner).all<{room:string;unread:number;intro_read:string|null}>();
 return Object.fromEntries(rows.results.map(row=>[row.room,row.unread+(row.intro_read?0:introCount(row.room))]));
}
