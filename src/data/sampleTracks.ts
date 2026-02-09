import type { Track } from "../types/track";

const baseTracks: Omit<Track, "id">[] = [
  { title: "Nightshift Groove", artist: "Mara Vale", bpm: 126, key: "Amin" },
  { title: "Chrome Harbor", artist: "Analog Reach", bpm: 124, key: "Cmaj" },
  { title: "Glass Alley", artist: "Kirox", bpm: 128, key: "Emin" },
  { title: "Velvet Circuit", artist: "Jun Osei", bpm: 122, key: "Gmaj" },
  { title: "Low Tide", artist: "Civic Orbit", bpm: 120, key: "Dmin" },
  { title: "Signal Bloom", artist: "Rena K", bpm: 130, key: "F#min" },
  { title: "Afterhours Type", artist: "Niko Lane", bpm: 125, key: "Bmin" },
  { title: "Midnight Relay", artist: "The Resin", bpm: 123, key: "Amaj" },
  { title: "Metro Pulse", artist: "Lumenfield", bpm: 127, key: "C#min" },
  { title: "Static Dawn", artist: "Vera Moss", bpm: 118, key: "Emaj" }
];

const keyPool = [
  "Cmaj",
  "Gmaj",
  "Dmaj",
  "Amaj",
  "Emaj",
  "Bmaj",
  "F#maj",
  "C#maj",
  "Fmaj",
  "Bbmaj",
  "Ebmaj",
  "Abmaj",
  "Amin",
  "Emin",
  "Bmin",
  "F#min",
  "C#min",
  "G#min",
  "D#min",
  "A#min",
  "Dmin",
  "Gmin",
  "Cmin",
  "Fmin"
];

const makeSeedTracks = (count: number): Track[] => {
  const tracks: Track[] = [];
  for (let i = 0; i < count; i += 1) {
    const base = baseTracks[i % baseTracks.length];
    const bpmOffset = ((i * 7) % 15) - 7;
    const bpm = Math.max(90, Math.min(140, base.bpm + bpmOffset));
    const key = keyPool[i % keyPool.length];
    tracks.push({
      id: `seed_${i + 1}`,
      title: `${base.title} ${i + 1}`,
      artist: base.artist,
      bpm,
      key
    });
  }
  return tracks;
};

export const sampleTracks: Track[] = makeSeedTracks(1500);
