import Database from "@tauri-apps/plugin-sql";
import type { Track } from "../types/track";

const DATABASE_URL = "sqlite:pitchcraft.db";

const CREATE_TRACKS_TABLE = `
  CREATE TABLE IF NOT EXISTS tracks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    bpm REAL NOT NULL,
    key TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`;

let dbPromise: Promise<Database> | null = null;

const getDb = () => {
  if (!dbPromise) {
    dbPromise = Database.load(DATABASE_URL);
  }
  return dbPromise;
};

export const initDb = async (): Promise<void> => {
  const db = await getDb();
  await db.execute(CREATE_TRACKS_TABLE);
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const executeWithRetry = async (db: Database, sql: string, bind?: unknown[], retries = 3) => {
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      if (bind) {
        await db.execute(sql, bind);
      } else {
        await db.execute(sql);
      }
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (attempt < retries && message.toLowerCase().includes("database is locked")) {
        await sleep(200 * (attempt + 1));
        continue;
      }
      throw error;
    }
  }
};

export const getTracks = async (): Promise<Track[]> => {
  const db = await getDb();
  const rows = await db.select<Track[]>(
    "SELECT id, title, artist, bpm, key FROM tracks ORDER BY artist, title"
  );
  return rows;
};

export const insertTracks = async (tracks: Track[]): Promise<void> => {
  if (tracks.length === 0) {
    return;
  }
  const db = await getDb();
  await executeWithRetry(db, "BEGIN TRANSACTION");
  try {
    for (const track of tracks) {
      await executeWithRetry(
        db,
        "INSERT OR REPLACE INTO tracks (id, title, artist, bpm, key, updated_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)",
        [track.id, track.title, track.artist, track.bpm, track.key]
      );
    }
    await executeWithRetry(db, "COMMIT");
  } catch (error) {
    await executeWithRetry(db, "ROLLBACK");
    throw error;
  }
};

export const insertTrack = async (track: Track): Promise<void> => {
  await insertTracks([track]);
};

export const updateTrack = async (track: Track): Promise<void> => {
  const db = await getDb();
  await executeWithRetry(
    db,
    "UPDATE tracks SET title = ?, artist = ?, bpm = ?, key = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [track.title, track.artist, track.bpm, track.key, track.id]
  );
};

export const clearTracks = async (): Promise<void> => {
  const db = await getDb();
  await executeWithRetry(db, "DELETE FROM tracks");
};

export const replaceTracks = async (
  tracks: Track[],
  onProgress?: (processed: number, total: number) => void
): Promise<void> => {
  const db = await getDb();
  await executeWithRetry(db, "BEGIN IMMEDIATE TRANSACTION");
  try {
    await executeWithRetry(db, "DELETE FROM tracks");
    const total = tracks.length;
    if (onProgress) {
      onProgress(0, total);
    }
    let processed = 0;
    const batchSize = 25;
    for (const track of tracks) {
      await executeWithRetry(
        db,
        "INSERT OR REPLACE INTO tracks (id, title, artist, bpm, key, updated_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)",
        [track.id, track.title, track.artist, track.bpm, track.key]
      );
      processed += 1;
      if (onProgress && (processed % batchSize === 0 || processed === total)) {
        onProgress(processed, total);
        await sleep(0);
      }
    }
    await executeWithRetry(db, "COMMIT");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.toLowerCase().includes("no transaction is active")) {
      await executeWithRetry(db, "ROLLBACK");
    }
    throw error;
  }
};
