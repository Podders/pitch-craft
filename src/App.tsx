import { useEffect, useMemo, useRef, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import PitchSlider from "./components/PitchSlider";
import ResultsTable from "./components/ResultsTable";
import TrackSelector from "./components/TrackSelector";
import LibraryManager from "./components/LibraryManager";
import { sampleTracks } from "./data/sampleTracks";
import { findCompatibleTracks } from "./engine/compatibility";
import { bpmAfterPitch, pitchToMatchBpm, roundedSemitoneShift } from "./engine/pitch";
import { formatKey, formatKeyDisplay, parseKey, shiftKey, type KeyDisplayFormat } from "./engine/key";
import { getTracks, initDb, insertTrack, replaceTracks, updateTrack } from "./db/tauriDb";
import { parseTracksFromFile } from "./utils/trackImport";
import pitchCraftLogo from "./assets/pitchcraft.png";

const App = () => {
  const [tracks, setTracks] = useState(sampleTracks);
  const [selectedId, setSelectedId] = useState("");
  const [pitchPercent, setPitchPercent] = useState(0);
  const [pitchRange, setPitchRange] = useState<8 | 16>(8);
  const [keyFormat, setKeyFormat] = useState<KeyDisplayFormat>("musical");
  const [kciThreshold, setKciThreshold] = useState(2.5);
  const [isLoading, setIsLoading] = useState(true);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<{ processed: number; total: number } | null>(null);
  const [isEditingBpm, setIsEditingBpm] = useState(false);
  const [bpmInput, setBpmInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<"mix" | "library">("mix");

  useEffect(() => {
    const loadTracks = async () => {
      try {
        await initDb();
        const storedTracks = await getTracks();
        if (storedTracks.length === 0) {
          setSelectedId("");
        } else {
          setTracks(storedTracks);
          setSelectedId("");
        }
      } catch (error) {
        console.error("Failed to load tracks from SQLite.", error);
      } finally {
        setIsLoading(false);
      }
    };
    void loadTracks();
  }, []);

  useEffect(() => {
    const listenForImport = async () => {
      const unlisten = await listen("menu-import-csv", () => {
        fileInputRef.current?.click();
      });
      return unlisten;
    };
    let cleanup: (() => void) | undefined;
    void listenForImport().then((unlisten) => {
      cleanup = unlisten;
    });
    return () => {
      cleanup?.();
    };
  }, []);

  const currentTrack = tracks.find((track) => track.id === selectedId);

  const currentBpm = currentTrack ? bpmAfterPitch(currentTrack.bpm, pitchPercent) : 0;
  const currentKey = useMemo(() => {
    if (!currentTrack) {
      return "";
    }
    const parsed = parseKey(currentTrack.key);
    if (!parsed) {
      return currentTrack.key;
    }
    const shifted = shiftKey(parsed, roundedSemitoneShift(pitchPercent));
    return formatKey(shifted);
  }, [currentTrack, pitchPercent]);
  const currentKeyDisplay = formatKeyDisplay(currentKey, keyFormat);

  const applyManualBpm = () => {
    if (!currentTrack) {
      setIsEditingBpm(false);
      return;
    }
    const desiredBpm = Number.parseFloat(bpmInput);
    if (!Number.isFinite(desiredBpm) || desiredBpm <= 0) {
      setIsEditingBpm(false);
      return;
    }
    const desiredPitch = pitchToMatchBpm(currentTrack.bpm, desiredBpm);
    const clampedPitch = Math.max(-pitchRange, Math.min(pitchRange, desiredPitch));
    setPitchPercent(clampedPitch);
    setIsEditingBpm(false);
  };

  const results = useMemo(() => {
    if (!currentTrack) {
      return [];
    }
    return findCompatibleTracks(currentTrack, pitchPercent, tracks, {
      bpmTolerance: 0.3,
      maxPitchPercent: pitchRange,
      kciThreshold
    });
  }, [currentTrack, pitchPercent, pitchRange, tracks, kciThreshold]);

  const handleImport = async (newTracks: typeof tracks) => {
    setIsImporting(true);
    setImportProgress({ processed: 0, total: newTracks.length });
    await replaceTracks(newTracks, (processed, total) => {
      setImportProgress({ processed, total });
    });
    const updated = await getTracks();
    setTracks(updated);
    setSelectedId("");
    setIsImporting(false);
    setImportProgress(null);
  };

  const handleAddTrack = async (track: typeof tracks[number]) => {
    await insertTrack(track);
    const updated = await getTracks();
    setTracks(updated);
  };

  const handleTrackUpdate = async (track: typeof tracks[number]) => {
    await updateTrack(track);
    const updated = await getTracks();
    setTracks(updated);
  };

  const handleFileImport = async (file: File) => {
    try {
      setImportStatus(null);
      setImportError(null);
      const { tracks: importedTracks, error } = await parseTracksFromFile(file);
      if (error) {
        setImportStatus(error);
        return;
      }
      if (importedTracks.length === 0) {
        setImportStatus("No valid rows found.");
        return;
      }
      await handleImport(importedTracks);
      setImportStatus(`Imported ${importedTracks.length} tracks.`);
    } catch (error) {
      console.error("CSV import failed.", error);
      setImportError("Import failed. Check the console for details.");
      setIsImporting(false);
      setImportProgress(null);
    }
  };

  return (
    <div className="h-screen px-6 py-6 text-slate-100 flex flex-col">
      <header className="mx-auto mb-6 flex w-full max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <img src={pitchCraftLogo} alt="PitchCraft" className="h-20 w-120 rounded-lg" />
            <div>
              <h1 className="font-display text-3xl tracking-wide md:text-4xl">PitchCraft</h1>
              <p className="mt-1 text-[0.6rem] uppercase tracking-[0.3em] text-neon-500">
                Vinyl harmonic mixing
              </p>
            </div>
          </div>
          <div className="hidden h-10 w-px bg-night-600 md:block" />
          <div className="hidden text-sm text-slate-400 md:block">
            <div>Dial in your real turntable pitch and</div>
            <div>discover harmonically compatible tracks.</div>
          </div>
        </div>
        <div className="hidden lg:block" />
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-1 min-h-0 flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs uppercase tracking-[0.2em] text-slate-500">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("mix")}
              className={`rounded-full border px-4 py-2 ${
                activeTab === "mix" ? "border-neon-500 text-neon-400" : "border-night-600 text-slate-400"
              }`}
            >
              Mix
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("library")}
              className={`rounded-full border px-4 py-2 ${
                activeTab === "library"
                  ? "border-neon-500 text-neon-400"
                  : "border-night-600 text-slate-400"
              }`}
            >
              Library
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[0.6rem] uppercase tracking-[0.2em] text-slate-500">Key display</span>
            <button
              type="button"
              onClick={() => setKeyFormat("musical")}
              className={`rounded-full border px-3 py-2 ${
                keyFormat === "musical"
                  ? "border-neon-500 text-neon-400"
                  : "border-night-600 text-slate-400"
              }`}
            >
              Musical
            </button>
            <button
              type="button"
              onClick={() => setKeyFormat("camelot")}
              className={`rounded-full border px-3 py-2 ${
                keyFormat === "camelot"
                  ? "border-neon-500 text-neon-400"
                  : "border-night-600 text-slate-400"
              }`}
            >
              Camelot
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-night-600 bg-night-800/70 p-6 text-slate-400 shadow-lg">
            Loading tracks from SQLite...
          </div>
        ) : (
          <>
            {isImporting && importProgress ? (
              <div className="rounded-2xl border border-neon-500/30 bg-night-800/70 p-4 text-sm text-slate-200 shadow-lg">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-500">
                  <span>Importing library</span>
                  <span>
                    {importProgress.processed} / {importProgress.total}
                  </span>
                </div>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-night-700">
                  <div
                    className="h-full bg-neon-500"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round((importProgress.processed / Math.max(1, importProgress.total)) * 100)
                      )}%`
                    }}
                  />
                </div>
              </div>
            ) : null}
            {importStatus ? (
              <div className="rounded-2xl border border-night-600 bg-night-800/70 p-4 text-sm text-slate-400 shadow-lg">
                {importStatus}
              </div>
            ) : null}
            {importError ? (
              <div className="rounded-2xl border border-ember-400/40 bg-ember-500/10 p-4 text-sm text-ember-400 shadow-lg">
                {importError}
              </div>
            ) : null}
            {activeTab === "mix" ? (
              <div className="flex min-h-0 flex-1 flex-col gap-6">
                <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
                  <div className="rounded-2xl border border-night-600 bg-night-800/70 p-6 shadow-lg">
                    <TrackSelector tracks={tracks} selectedId={selectedId} onChange={setSelectedId} />
                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      <div className="rounded-xl border border-night-600 bg-night-700/60 px-4 py-3">
                        <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Current BPM</div>
                        <div className="mt-2 text-3xl font-semibold text-neon-400">
                          {currentTrack ? (
                            isEditingBpm ? (
                              <input
                                value={bpmInput}
                                onChange={(event) => setBpmInput(event.target.value)}
                                onBlur={applyManualBpm}
                                onKeyDown={(event) => {
                                  if (event.key === "Enter") {
                                    applyManualBpm();
                                  }
                                  if (event.key === "Escape") {
                                    setIsEditingBpm(false);
                                  }
                                }}
                                autoFocus
                                inputMode="decimal"
                                className="w-full bg-transparent text-3xl font-semibold text-neon-400 outline-none"
                              />
                            ) : (
                              <button
                                type="button"
                                onDoubleClick={() => {
                                  setBpmInput(currentBpm.toFixed(2));
                                  setIsEditingBpm(true);
                                }}
                                className="text-left"
                              >
                                {currentBpm.toFixed(2)}
                              </button>
                            )
                          ) : (
                            "--"
                          )}
                        </div>
                      </div>
                      <div className="rounded-xl border border-night-600 bg-night-700/60 px-4 py-3">
                        <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Current Key</div>
                        <div className="mt-2 text-3xl font-semibold text-ember-400">
                          {currentTrack ? currentKeyDisplay : "--"}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-night-600 bg-night-800/70 p-6 shadow-lg">
                    <div className="flex items-center justify-between pb-4 text-xs uppercase tracking-[0.2em] text-slate-500">
                      <span>Range</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setPitchRange(8);
                            setPitchPercent((current) => Math.max(-8, Math.min(8, current)));
                          }}
                          className={`rounded-full border px-3 py-1 ${
                            pitchRange === 8
                              ? "border-neon-500 text-neon-400"
                              : "border-night-600 text-slate-400"
                          }`}
                        >
                          +/- 8%
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPitchRange(16);
                            setPitchPercent((current) => Math.max(-16, Math.min(16, current)));
                          }}
                          className={`rounded-full border px-3 py-1 ${
                            pitchRange === 16
                              ? "border-neon-500 text-neon-400"
                              : "border-night-600 text-slate-400"
                          }`}
                        >
                          +/- 16%
                        </button>
                      </div>
                    </div>
                    <PitchSlider
                      value={pitchPercent}
                      onChange={setPitchPercent}
                      min={-pitchRange}
                      max={pitchRange}
                      rangeLabel={`(+/- ${pitchRange}%)`}
                    />
                    <div className="mt-5 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-500">
                      <span>KCI threshold</span>
                      <span className="text-neon-400">
                        {kciThreshold === 0 ? "Off" : kciThreshold.toFixed(2)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={6}
                      step={0.05}
                      value={kciThreshold}
                      onChange={(event) => setKciThreshold(Number(event.target.value))}
                      className="mt-2 w-full accent-neon-500"
                    />
                  </div>
                </section>
                <div className="flex-1 min-h-0">
                  <ResultsTable
                    results={results}
                    keyFormat={keyFormat}
                    onSelectMatch={(result) => {
                      setSelectedId(result.track.id);
                      setPitchPercent(result.pitchPercent);
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex-1 min-h-0">
                <LibraryManager
                  tracks={tracks}
                  keyFormat={keyFormat}
                  onUpdate={handleTrackUpdate}
                  onAdd={handleAddTrack}
                  onImportClick={() => fileInputRef.current?.click()}
                  onUseTrack={(track) => {
                    setSelectedId(track.id);
                    setActiveTab("mix");
                  }}
                />
              </div>
            )}
          </>
        )}
      </main>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            setPendingImportFile(file);
          }
          event.currentTarget.value = "";
        }}
      />
      {pendingImportFile ? (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/60 px-6">
          <div className="w-full max-w-lg rounded-2xl border border-night-600 bg-night-800 p-6 shadow-xl">
            <h3 className="font-display text-xl tracking-wide text-slate-100">Replace library?</h3>
            <p className="mt-3 text-sm text-slate-400">
              Importing will replace your current library with the selected file. This cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingImportFile(null)}
                className="rounded-full border border-night-600 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-400"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const file = pendingImportFile;
                  setPendingImportFile(null);
                  if (file) {
                    void handleFileImport(file);
                  }
                }}
                className="rounded-full border border-ember-400 px-4 py-2 text-xs uppercase tracking-[0.2em] text-ember-400"
              >
                Replace
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default App;
