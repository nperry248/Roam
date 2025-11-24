import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const trips = sqliteTable('trips', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  destination: text('destination').notNull(),
  status: text('status', { enum: ['ideated', 'planned', 'confirmed'] }).notNull().default('ideated'),
  startDate: text('start_date'),
  endDate: text('end_date'),
  coverImage: text('cover_image'),
  notes: text('notes'),
  budget: integer('budget'),
});

// NEW: Photos Table
export const photos = sqliteTable('photos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tripId: integer('trip_id').references(() => trips.id).notNull(), // Links to specific trip
  uri: text('uri').notNull(), // Path to the file on phone
  caption: text('caption'),
  createdAt: integer('created_at'), // Timestamp
});

export type Trip = typeof trips.$inferSelect;
export type Photo = typeof photos.$inferSelect;