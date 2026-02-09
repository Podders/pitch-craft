import type { Track } from "../types/track";
import { read, utils } from "xlsx";
import { parseCsv } from "./csv";

type ImportResult =
  | { tracks: Track[]; error?: undefined }
  | { tracks: Track[]; error: string };

const headerAliases: Record<string, string> = {
  title: "title",
  track: "title",
  artist: "artist",
  bpm: "bpm",
  tempo: "bpm",
  key: "key",
  musicalkey: "key"
};

const normalizeHeader = (value: string) => value.toLowerCase().replace(/[^a-z]/g, "");

export const createTrackId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `track_${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

const detectHeaderMap = (headers: string[]) => {
  const indexMap = headers.reduce<Record<string, number>>((acc, header, index) => {
    const alias = headerAliases[header];
    if (alias) {
      acc[alias] = index;
    }
    return acc;
  }, {});
  const hasRequired = "title" in indexMap && "artist" in indexMap && "bpm" in indexMap && "key" in indexMap;
  return hasRequired ? indexMap : null;
};

const fallbackIndexMap = {
  artist: 1,
  title: 2,
  bpm: 3,
  key: 4
};

const parseRowsToTracks = (rows: string[][]): ImportResult => {
  if (rows.length === 0) {
    return { tracks: [], error: "CSV file is empty." };
  }

  const headers = rows[0].map((header) => normalizeHeader(header));
  const headerMap = detectHeaderMap(headers);

  const indexMap = headerMap ?? fallbackIndexMap;
  const dataRows = headerMap ? rows.slice(1) : rows;

  const tracks: Track[] = dataRows.reduce<Track[]>((acc, row) => {
    const title = row[indexMap.title]?.trim() ?? "";
    const artist = row[indexMap.artist]?.trim() ?? "";
    const bpmValue = Number.parseFloat(row[indexMap.bpm] ?? "");
    const key = row[indexMap.key]?.trim() ?? "";
    if (!title || !artist || !Number.isFinite(bpmValue) || !key) {
      return acc;
    }
        acc.push({
          id: createTrackId(),
          title,
          artist,
          bpm: bpmValue,
          key
        });
    return acc;
  }, []);

  if (tracks.length === 0) {
    return { tracks, error: "No valid rows found." };
  }

  return { tracks };
};

export const parseTracksFromCsv = (text: string): ImportResult => {
  const rows = parseCsv(text);
  const parsed = parseRowsToTracks(rows);
  if (!parsed.error && parsed.tracks.length > 0) {
    return parsed;
  }
  return parsed.error
    ? { ...parsed, error: parsed.error }
    : { tracks: [], error: "Missing required headers. Need title, artist, bpm, key." };
};

export const parseTracksFromXlsx = (data: ArrayBuffer): ImportResult => {
  const workbook = read(data, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { tracks: [], error: "No sheets found in XLSX file." };
  }
  const sheet = workbook.Sheets[sheetName];
  const rows = utils.sheet_to_json<string[]>(sheet, { header: 1, raw: false }) as string[][];
  const normalizedRows = rows.map((row) => row.map((cell) => (cell ?? "").toString()));
  const parsed = parseRowsToTracks(normalizedRows);
  if (parsed.tracks.length === 0 && !parsed.error) {
    return { tracks: [], error: "No valid rows found." };
  }
  return parsed;
};

export const parseTracksFromFile = async (file: File): Promise<ImportResult> => {
  const name = file.name.toLowerCase();
  if (name.endsWith(".xlsx")) {
    const buffer = await file.arrayBuffer();
    return parseTracksFromXlsx(buffer);
  }
  const text = await file.text();
  return parseTracksFromCsv(text);
};
