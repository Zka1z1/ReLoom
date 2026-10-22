type SummaryRow = {room:string; count:number; text:string; created:string; id:string; photo_id:string|null; username:string|null; owner:string};
type ChatSummary = {count:number; latest:{id:string; text:string; created:string; hasPhoto:boolean; author:string}|null};

// Only summaries of authorized rooms; never mix other members' messages into
// the viewer's own posts, which determine participation and tag permissions.
export async function chatSummaries(db:D1Database, rooms:string[]) {
  if (!rooms.length) return {};
  const rows = await db.prepare(`
    SELECT latest.*, COALESCE(p.display_handle,p.handle) AS username
    FROM (
      SELECT m.*, COUNT(*) OVER (PARTITION BY room) AS count,
        ROW_NUMBER() OVER (PARTITION BY room ORDER BY created DESC,id DESC) AS position
      FROM reloom_messages m WHERE room IN (SELECT value FROM json_each(?))
    ) latest
    LEFT JOIN reloom_profiles p ON p.owner=latest.owner
    WHERE latest.position=1
  `).bind(JSON.stringify([...new Set(rooms)])).all<SummaryRow>();
  const summaries:Record<string,ChatSummary> = Object.fromEntries(rooms.map(room => [room, {count:0, latest:null}]));
  for (const row of rows.results) {
    summaries[row.room] = {count:row.count, latest:{
      id:row.id, text:row.text, created:row.created, hasPhoto:!!row.photo_id,
      author:'@'+(row.username || 'member-'+row.owner.slice(0,6)),
    }};
  }
  return summaries;
}
