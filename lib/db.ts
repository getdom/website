import Database from 'better-sqlite3';
import { join } from 'path';

export interface Website {
  id: number;
  title: string;
  url: string;
  description?: string;
  category?: string;
  tags?: string;
  screenshotPath: string;
  colorPalette?: string; // JSON string of color array
  createdAt: string;
}

let db: Database.Database | null = null;

export function getDb() {
  if (!db) {
    const dbPath = join(process.cwd(), 'data', 'websites.db');
    db = new Database(dbPath);
    
    // Create table if it doesn't exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS websites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        url TEXT NOT NULL UNIQUE,
        description TEXT,
        category TEXT,
        tags TEXT,
        screenshotPath TEXT NOT NULL,
        colorPalette TEXT,
        createdAt TEXT NOT NULL
      )
    `);
    
    // Add colorPalette column if it doesn't exist (for existing databases)
    try {
      db.exec(`ALTER TABLE websites ADD COLUMN colorPalette TEXT`);
    } catch (error) {
      // Column already exists, ignore error
    }
  }
  
  return db;
}

export function getAllWebsites(): Website[] {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM websites ORDER BY createdAt DESC');
  return stmt.all() as Website[];
}

export function addWebsite(website: Omit<Website, 'id' | 'createdAt'>): Website {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO websites (title, url, description, category, tags, screenshotPath, colorPalette, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const createdAt = new Date().toISOString();
  const result = stmt.run(
    website.title,
    website.url,
    website.description || null,
    website.category || null,
    website.tags || null,
    website.screenshotPath,
    website.colorPalette || null,
    createdAt
  );
  
  return {
    id: result.lastInsertRowid as number,
    ...website,
    createdAt,
  };
}

export function updateWebsiteTags(id: number, tags: string): void {
  const db = getDb();
  const stmt = db.prepare('UPDATE websites SET tags = ? WHERE id = ?');
  stmt.run(tags, id);
}

export function deleteWebsite(id: number): void {
  const db = getDb();
  const stmt = db.prepare('DELETE FROM websites WHERE id = ?');
  stmt.run(id);
}

export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}
