import {sql} from 'drizzle-orm';
import {sqliteTable, text, primaryKey, index, uniqueIndex} from 'drizzle-orm/sqlite-core';
export const records = sqliteTable('reloom_records', {
  owner: text('owner').notNull(), kind: text('kind').notNull(), id: text('id').notNull(),
  data: text('data').notNull(), created: text('created').notNull(),
}, table => [primaryKey({columns:[table.owner,table.kind,table.id]}), index('reloom_public_story').on(table.kind,table.id), uniqueIndex('reloom_donation_identity').on(table.id).where(sql`${table.kind} = 'donation'`)]);
