import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// ... existing tables (trips, photos, expenses) ...
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

export const photos = sqliteTable('photos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tripId: integer('trip_id').references(() => trips.id).notNull(),
  uri: text('uri').notNull(),
  caption: text('caption'),
  createdAt: integer('created_at'),
});

export const expenses = sqliteTable('expenses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tripId: integer('trip_id').references(() => trips.id).notNull(),
  title: text('title').notNull(),
  amount: integer('amount').notNull(),
  category: text('category').notNull(),
  createdAt: integer('created_at'),
});

// NEW: Documents / Logistics Table
export const documents = sqliteTable('documents', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tripId: integer('trip_id').references(() => trips.id).notNull(),
  type: text('type').notNull(), // 'transport', 'stay', 'activity'
  title: text('title').notNull(), // e.g. "Ryanair Flight"
  subtitle: text('subtitle'), // e.g. "Ref: #88291, Seat 12A"
  link: text('link'), // e.g. https://...
});

export type Trip = typeof trips.$inferSelect;
export type Photo = typeof photos.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
export type Document = typeof documents.$inferSelect;