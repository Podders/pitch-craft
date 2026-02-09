import { useDeferredValue, useMemo, useState } from "react";
import { Combobox } from "@headlessui/react";
import type { Track } from "../types/track";

type TrackSelectorProps = {
  tracks: Track[];
  selectedId: string;
  onChange: (id: string) => void;
};

const TrackSelector = ({ tracks, selectedId, onChange }: TrackSelectorProps) => {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const selectedTrack = tracks.find((track) => track.id === selectedId) ?? null;

  const searchIndex = useMemo(
    () =>
      tracks.map((track) => ({
        track,
        haystack: `${track.title} ${track.artist}`.toLowerCase()
      })),
    [tracks]
  );

  const filteredTracks = useMemo(() => {
    const lower = deferredQuery.trim().toLowerCase();
    if (!lower) {
      return tracks.slice(0, 50);
    }
    const matches: Track[] = [];
    for (const entry of searchIndex) {
      if (entry.haystack.includes(lower)) {
        matches.push(entry.track);
      }
      if (matches.length >= 100) {
        break;
      }
    }
    return matches;
  }, [deferredQuery, searchIndex, tracks]);

  return (
    <div className="space-y-2">
      <label className="text-sm uppercase tracking-[0.2em] text-slate-400">Current track</label>
      <Combobox
        value={selectedTrack}
        onChange={(track: Track | null) => {
          if (track) {
            onChange(track.id);
          } else {
            onChange("");
          }
        }}
        nullable
      >
        <div className="relative">
          <Combobox.Input
            className="w-full rounded-lg border border-night-600 bg-night-700 px-4 py-3 text-slate-100 shadow-glow focus:outline-none focus:ring-2 focus:ring-neon-500"
            displayValue={(track: Track | null) => (track ? `${track.title} - ${track.artist}` : "")}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by title or artist"
          />
          <Combobox.Options className="absolute z-10 mt-2 max-h-60 w-full overflow-auto rounded-xl border border-night-600 bg-night-800/95 p-2 text-sm shadow-lg">
            {filteredTracks.length === 0 ? (
              <div className="px-3 py-2 text-slate-500">No tracks found.</div>
            ) : (
              filteredTracks.map((track) => (
                <Combobox.Option
                  key={track.id}
                  value={track}
                  className={({ active }) =>
                    `cursor-pointer rounded-lg px-3 py-2 ${
                      active ? "bg-night-600 text-neon-300" : "text-slate-200"
                    }`
                  }
                >
                  <div className="font-medium">{track.title}</div>
                  <div className="text-xs text-slate-400">{track.artist}</div>
                </Combobox.Option>
              ))
            )}
          </Combobox.Options>
        </div>
      </Combobox>
    </div>
  );
};

export default TrackSelector;
