export const TRACKS_TABLE = `
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

export type TrackRow = {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  key: string;
  created_at: string;
  updated_at: string;
};
