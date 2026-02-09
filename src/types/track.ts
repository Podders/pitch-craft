export type KeyMode = "maj" | "min";

export type TrackKey = {
  root: string;
  mode: KeyMode;
};

export type Track = {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  key: string;
};

export type PitchAdjustedTrack = {
  track: Track;
  pitchPercent: number;
  bpm: number;
  key: string;
};

export type CompatibilityType =
  | "same key"
  | "perfect fifth"
  | "perfect fourth"
  | "relative major/minor";

export type CompatibleResult = PitchAdjustedTrack & {
  compatibility: CompatibilityType;
};
