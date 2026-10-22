import {sql} from 'drizzle-orm';
import {sqliteTable, text, integer, primaryKey, index, uniqueIndex} from 'drizzle-orm/sqlite-core';
export const records = sqliteTable('reloom_records', {
  owner: text('owner').notNull(), kind: text('kind').notNull(), id: text('id').notNull(),
  data: text('data').notNull(), created: text('created').notNull(),
}, table => [primaryKey({columns:[table.owner,table.kind,table.id]}), index('reloom_public_story').on(table.kind,table.id), uniqueIndex('reloom_donation_identity').on(table.id).where(sql`${table.kind} = 'donation'`)]);
export const messages = sqliteTable('reloom_messages', {
 id:text('id').primaryKey(), owner:text('owner').notNull(), room:text('room').notNull(),
 text:text('text').notNull(), photoId:text('photo_id'), created:text('created').notNull(),
}, t=>[index('reloom_room_messages').on(t.room,t.created,t.id),index('reloom_author_messages').on(t.owner,t.created),index('reloom_message_photo').on(t.photoId)]);
export const presence = sqliteTable('reloom_presence', {
 owner:text('owner').notNull(),room:text('room').notNull(),seen:text('seen').notNull(),
},t=>[primaryKey({columns:[t.owner,t.room]}),index('reloom_room_presence').on(t.room,t.seen)]);
export const photos = sqliteTable('reloom_photos', {
 id:text('id').primaryKey(),owner:text('owner').notNull(),created:text('created').notNull(),
},t=>[index('reloom_owner_photos').on(t.owner,t.created)]);
export const limits = sqliteTable('reloom_limits', {
 owner:text('owner').notNull(),purpose:text('purpose').notNull(),window:text('window').notNull(),count:integer('count').notNull(),
},t=>[primaryKey({columns:[t.owner,t.purpose]})]);

export const reads = sqliteTable('reloom_reads', {
 owner:text('owner').notNull(),room:text('room').notNull(),cursor:text('cursor').notNull(),
},t=>[primaryKey({columns:[t.owner,t.room]})]);

export const profiles = sqliteTable('reloom_profiles', {
 owner:text('owner').primaryKey(),handle:text('handle').notNull(),displayHandle:text('display_handle'),
},t=>[uniqueIndex('reloom_profile_handle').on(t.handle)]);
export const letters = sqliteTable('reloom_letters', {
 id:text('id').primaryKey(),sender:text('sender').notNull(),recipient:text('recipient').notNull(),
 garmentId:text('garment_id').notNull(),data:text('data').notNull(),created:text('created').notNull(),
 opened:integer('opened').notNull().default(0),deleted:integer('deleted').notNull().default(0),
},t=>[index('reloom_letter_inbox').on(t.recipient,t.created),index('reloom_letter_sender').on(t.sender,t.created)]);
