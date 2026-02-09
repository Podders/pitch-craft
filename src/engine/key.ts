import type { KeyMode, TrackKey } from "../types/track";

const ROOTS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const FLATS: Record<string, string> = {
  Db: "C#",
  Eb: "D#",
  Gb: "F#",
  Ab: "G#",
  Bb: "A#"
};

export const normalizeRoot = (root: string): string => {
  const trimmed = root.trim();
  const normalized =
    trimmed.length === 1
      ? trimmed.toUpperCase()
      : trimmed[0].toUpperCase() + trimmed.slice(1, 2).toLowerCase();
  if (FLATS[normalized]) {
    return FLATS[normalized];
  }
  return normalized;
};

export const parseKey = (value: string): TrackKey | null => {
  const clean = value.trim();
  const match = clean.match(/^([A-G](?:#|b)?)(?:\s*)(maj|min|major|minor|m)?$/i);
  if (!match) {
    return null;
  }
  const rootRaw = match[1];
  const modeRaw = match[2] ?? "maj";
  const root = normalizeRoot(rootRaw);
  const lowerMode = modeRaw.toLowerCase();
  const mode: KeyMode = lowerMode === "min" || lowerMode === "minor" || lowerMode === "m" ? "min" : "maj";
  return { root, mode };
};

export const keyToIndex = (key: TrackKey): number => {
  return ROOTS.indexOf(key.root);
};

export const indexToKey = (index: number, mode: KeyMode): TrackKey => {
  const wrapped = ((index % 12) + 12) % 12;
  return { root: ROOTS[wrapped], mode };
};

export const formatKey = (key: TrackKey): string => {
  return `${key.root}${key.mode}`;
};

export const shiftKey = (key: TrackKey, semitoneShift: number): TrackKey => {
  const index = keyToIndex(key);
  return indexToKey(index + semitoneShift, key.mode);
};

const KEY_FREQUENCIES: Record<string, number> = {
  C: 261.63,
  "C#": 277.18,
  D: 293.66,
  "D#": 311.13,
  E: 329.63,
  F: 349.23,
  "F#": 369.99,
  G: 392,
  "G#": 415.3,
  A: 440,
  "A#": 466.16,
  B: 493.88
};

export const keyToFrequency = (value: string): number | null => {
  const parsed = parseKey(value);
  if (!parsed) {
    return null;
  }
  return KEY_FREQUENCIES[parsed.root] ?? null;
};

export type KeyDisplayFormat = "musical" | "camelot";

const CAMELOT_MAJOR: Record<string, string> = {
  C: "8B",
  "C#": "3B",
  D: "10B",
  "D#": "5B",
  E: "12B",
  F: "7B",
  "F#": "2B",
  G: "9B",
  "G#": "4B",
  A: "11B",
  "A#": "6B",
  B: "1B"
};

const CAMELOT_MINOR: Record<string, string> = {
  C: "5A",
  "C#": "12A",
  D: "7A",
  "D#": "2A",
  E: "9A",
  F: "4A",
  "F#": "11A",
  G: "6A",
  "G#": "1A",
  A: "8A",
  "A#": "3A",
  B: "10A"
};

export const keyToCamelot = (value: string): string | null => {
  const parsed = parseKey(value);
  if (!parsed) {
    return null;
  }
  const map = parsed.mode === "maj" ? CAMELOT_MAJOR : CAMELOT_MINOR;
  return map[parsed.root] ?? null;
};

export const formatKeyDisplay = (value: string, format: KeyDisplayFormat): string => {
  if (format === "camelot") {
    return keyToCamelot(value) ?? value;
  }
  const parsed = parseKey(value);
  return parsed ? formatKey(parsed) : value;
};

export const camelotToKey = (value: string): string | null => {
  const normalized = value.trim().toUpperCase();
  const lookup = (map: Record<string, string>) =>
    Object.entries(map).find(([, camelot]) => camelot.toUpperCase() === normalized)?.[0] ?? null;
  const majorKey = lookup(CAMELOT_MAJOR);
  if (majorKey) {
    return `${majorKey}maj`;
  }
  const minorKey = lookup(CAMELOT_MINOR);
  if (minorKey) {
    return `${minorKey}min`;
  }
  return null;
};
