import type { CompatibilityType, CompatibleResult, Track } from "../types/track";
import { bpmAfterPitch, pitchToMatchBpm, roundedSemitoneShift } from "./pitch";
import { formatKey, keyToFrequency, parseKey, shiftKey } from "./key";

const INTERVALS = {
  perfectFifth: 7,
  perfectFourth: 5,
  relative: 3
};

export const isHarmonicallyCompatible = (
  currentKey: string,
  candidateKey: string
): CompatibilityType | null => {
  const current = parseKey(currentKey);
  const candidate = parseKey(candidateKey);
  if (!current || !candidate) {
    return null;
  }

  const currentRootIndex = getIndex(current.root);
  const candidateRootIndex = getIndex(candidate.root);
  if (currentRootIndex < 0 || candidateRootIndex < 0) {
    return null;
  }

  if (currentRootIndex === candidateRootIndex && current.mode === candidate.mode) {
    return "same key";
  }

  const interval = (candidateRootIndex - currentRootIndex + 12) % 12;

  if (interval === INTERVALS.perfectFifth) {
    return "perfect fifth";
  }

  if (interval === INTERVALS.perfectFourth) {
    return "perfect fourth";
  }

  const relativeInterval = interval === INTERVALS.relative || interval === 12 - INTERVALS.relative;
  if (relativeInterval && current.mode !== candidate.mode) {
    return "relative major/minor";
  }

  return null;
};

const ROOTS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const getIndex = (root: string): number => ROOTS.indexOf(root);

export type CompatibilityOptions = {
  bpmTolerance: number;
  maxPitchPercent?: number;
  kciThreshold?: number;
};

const kciValue = (bpm: number, key: string): number | null => {
  const frequency = keyToFrequency(key);
  if (!frequency || frequency === 0) {
    return null;
  }
  return (bpm / frequency) * 100;
};

export const findCompatibleTracks = (
  currentTrack: Track,
  currentPitchPercent: number,
  tracks: Track[],
  options: CompatibilityOptions = { bpmTolerance: 0.3 }
): CompatibleResult[] => {
  const compatibilityRank: Record<CompatibilityType, number> = {
    "same key": 0,
    "relative major/minor": 1,
    "perfect fifth": 2,
    "perfect fourth": 3
  };
  const currentBpm = bpmAfterPitch(currentTrack.bpm, currentPitchPercent);
  const currentKey = parseKey(currentTrack.key);
  const currentKeyString = currentKey ? formatKey(currentKey) : currentTrack.key;
  const currentKci = kciValue(currentTrack.bpm, currentTrack.key);

  return tracks
    .filter((track) => track.id !== currentTrack.id)
    .map((track) => {
      const pitchPercent = pitchToMatchBpm(track.bpm, currentBpm);
      const bpm = bpmAfterPitch(track.bpm, pitchPercent);
      const semitoneShift = roundedSemitoneShift(pitchPercent);
      const parsedKey = parseKey(track.key);
      const shiftedKey = parsedKey ? formatKey(shiftKey(parsedKey, semitoneShift)) : track.key;
      const compatibility = isHarmonicallyCompatible(currentKeyString, shiftedKey);
      const candidateKci = kciValue(bpm, shiftedKey);

      return {
        track,
        pitchPercent,
        bpm,
        key: shiftedKey,
        compatibility
      };
    })
    .filter((result) => Math.abs(result.bpm - currentBpm) <= options.bpmTolerance)
    .filter((result) =>
      options.maxPitchPercent === undefined ? true : Math.abs(result.pitchPercent) <= options.maxPitchPercent
    )
    .filter((result) => {
      if (options.kciThreshold === undefined || options.kciThreshold <= 0 || currentKci === null) {
        return true;
      }
      const candidateKci = kciValue(result.track.bpm, result.track.key);
      if (candidateKci === null) {
        return true;
      }
      return Math.abs(candidateKci - currentKci) <= options.kciThreshold;
    })
    .filter((result) => result.compatibility !== null)
    .map((result) => ({
      ...result,
      compatibility: result.compatibility as CompatibilityType
    }))
    .sort((a, b) => {
      const rankDiff = compatibilityRank[a.compatibility] - compatibilityRank[b.compatibility];
      if (rankDiff !== 0) {
        return rankDiff;
      }
      return a.pitchPercent - b.pitchPercent;
    });
};
