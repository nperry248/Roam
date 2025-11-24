import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as schema from './schema';

const expoDb = openDatabaseSync('roam.db');
export const db = drizzle(expoDb, { schema });

export const initDb = () => {
  // Create Trips Table
  expoDb.execSync(`
    CREATE TABLE IF NOT EXISTS trips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      destination TEXT NOT NULL,
      status TEXT CHECK(status IN ('ideated', 'planned', 'confirmed')) NOT NULL DEFAULT 'ideated',
      start_date TEXT,
      end_date TEXT,
      cover_image TEXT,
      notes TEXT,
      budget INTEGER
    );
  `);

  // NEW: Create Photos Table
  expoDb.execSync(`
    CREATE TABLE IF NOT EXISTS photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER NOT NULL,
      uri TEXT NOT NULL,
      caption TEXT,
      created_at INTEGER,
      FOREIGN KEY (trip_id) REFERENCES trips (id) ON DELETE CASCADE
    );
  `);
  console.log("Database initialized: trips & photos tables ready.");
};