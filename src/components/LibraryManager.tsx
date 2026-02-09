import { useMemo, useRef, useState } from "react";
import { Listbox } from "@headlessui/react";
import { useReactTable, getCoreRowModel, flexRender, type ColumnDef } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { Track } from "../types/track";
import type { KeyDisplayFormat } from "../engine/key";
import { formatKeyDisplay } from "../engine/key";
import { createTrackId } from "../utils/trackImport";

type LibraryManagerProps = {
  tracks: Track[];
  keyFormat: KeyDisplayFormat;
  onUpdate: (track: Track) => Promise<void>;
  onAdd: (track: Track) => Promise<void>;
  onImportClick: () => void;
  onUseTrack: (track: Track) => void;
};

type DraftTrack = Track;

const LibraryManager = ({ tracks, keyFormat, onUpdate, onAdd, onImportClick, onUseTrack }: LibraryManagerProps) => {
  const [status, setStatus] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [modalState, setModalState] = useState<{
    mode: "add" | "edit";
    track: DraftTrack;
  } | null>(null);
  const [newTrack, setNewTrack] = useState({ title: "", artist: "", bpm: "", key: "" });

  const keyOptions = useMemo(
    () => [
      "Cmaj",
      "C#maj",
      "Dmaj",
      "D#maj",
      "Emaj",
      "Fmaj",
      "F#maj",
      "Gmaj",
      "G#maj",
      "Amaj",
      "A#maj",
      "Bmaj",
      "Cmin",
      "C#min",
      "Dmin",
      "D#min",
      "Emin",
      "Fmin",
      "F#min",
      "Gmin",
      "G#min",
      "Amin",
      "A#min",
      "Bmin"
    ],
    []
  );

  const filteredTracks = useMemo(() => {
    if (!query) {
      return tracks;
    }
    const lower = query.toLowerCase();
    return tracks.filter((track) => `${track.title} ${track.artist}`.toLowerCase().includes(lower));
  }, [query, tracks]);

  const closeModal = () => {
    setModalState(null);
    setNewTrack({ title: "", artist: "", bpm: "", key: "" });
    setStatus(null);
  };

  const handleAdd = async () => {
    const bpmValue = Number.parseFloat(newTrack.bpm);
    if (!newTrack.title.trim() || !newTrack.artist.trim() || !newTrack.key.trim() || !Number.isFinite(bpmValue)) {
      setStatus("Title, artist, BPM, and key are required.");
      return;
    }
    await onAdd({
      id: createTrackId(),
      title: newTrack.title.trim(),
      artist: newTrack.artist.trim(),
      bpm: bpmValue,
      key: newTrack.key.trim()
    });
    setStatus("Track added.");
    closeModal();
  };

  const handleEdit = async () => {
    if (!modalState || modalState.mode !== "edit") {
      return;
    }
    const bpmValue = Number.parseFloat(newTrack.bpm);
    if (!newTrack.title.trim() || !newTrack.artist.trim() || !newTrack.key.trim() || !Number.isFinite(bpmValue)) {
      setStatus("Title, artist, BPM, and key are required.");
      return;
    }
    await onUpdate({
      ...modalState.track,
      title: newTrack.title.trim(),
      artist: newTrack.artist.trim(),
      bpm: bpmValue,
      key: newTrack.key.trim()
    });
    setStatus("Track updated.");
    closeModal();
  };

  const openAddModal = () => {
    setModalState({ mode: "add", track: { id: "", title: "", artist: "", bpm: 0, key: "" } });
    setNewTrack({ title: "", artist: "", bpm: "", key: "" });
  };

  const openEditModal = (track: Track) => {
    setModalState({ mode: "edit", track });
    setNewTrack({
      title: track.title,
      artist: track.artist,
      bpm: track.bpm.toString(),
      key: track.key
    });
  };

  const columns = useMemo<ColumnDef<Track>[]>(
    () => [
      {
        header: "Title",
        accessorKey: "title",
        cell: (info) => {
          const row = info.row.original;
          return <span className="truncate-cell font-medium">{row.title}</span>;
        }
      },
      {
        header: "Artist",
        accessorKey: "artist",
        cell: (info) => {
          const row = info.row.original;
          return <span className="truncate-cell text-slate-400">{row.artist}</span>;
        }
      },
      {
        header: "BPM",
        accessorKey: "bpm",
        cell: (info) => {
          const row = info.row.original;
          return <span>{row.bpm.toFixed(1)}</span>;
        }
      },
      {
        header: "Key",
        accessorKey: "key",
        cell: (info) => {
          const row = info.row.original;
          return <span className="text-ember-400">{formatKeyDisplay(row.key, keyFormat)}</span>;
        }
      },
      {
        header: "Action",
        id: "action",
        cell: (info) => {
          const row = info.row.original;
          return (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onUseTrack(row)}
                className="rounded-full border border-neon-500/60 px-3 py-1 text-xs uppercase tracking-[0.2em] text-neon-400"
              >
                Use
              </button>
              <button
                type="button"
                onClick={() => openEditModal(row)}
                className="rounded-full border border-night-600 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-300"
              >
                Edit
              </button>
            </div>
          );
        }
      }
    ],
    [keyFormat]
  );

  const table = useReactTable({
    data: filteredTracks,
    columns,
    getCoreRowModel: getCoreRowModel()
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: table.getRowModel().rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 56,
    overscan: 8
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  return (
    <div className="flex h-full flex-col rounded-2xl border border-night-600 bg-night-800/70 p-6 shadow-lg">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-display text-2xl tracking-wide text-slate-100">Library</h2>
          <p className="mt-2 text-sm text-slate-400">Review and correct track metadata.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={openAddModal}
            className="rounded-full border border-neon-500 px-4 py-2 text-xs uppercase tracking-[0.2em] text-neon-400"
          >
            Add
          </button>
          <button
            type="button"
            onClick={onImportClick}
            className="rounded-full border border-night-600 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-300"
          >
            Import
          </button>
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search library"
            className="w-full rounded-lg border border-night-600 bg-night-700 px-4 py-2 text-sm text-slate-100 md:w-72"
          />
        </div>
      </div>
      {status ? <div className="mt-3 text-sm text-neon-400">{status}</div> : null}
      <div className="mt-4 flex-1 min-h-0">
        <div ref={scrollRef} className="table-scroll mt-2 h-full overflow-auto">
          <div className="library-grid sticky top-0 z-10 bg-night-800/95 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-500">
            {table.getHeaderGroups().map((headerGroup) =>
              headerGroup.headers.map((header) => (
                <span key={header.id}>
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </span>
              ))
            )}
          </div>
          <div style={{ height: `${totalSize}px`, position: "relative" }}>
            {virtualRows.map((virtualRow) => {
              const row = table.getRowModel().rows[virtualRow.index];
              return (
                <div
                  key={row.id}
                  className="library-grid absolute left-0 right-0 rounded-xl border border-night-600 bg-night-700/70 px-4 py-3 text-sm text-slate-100"
                  style={{ transform: `translateY(${virtualRow.start}px)` }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <span key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</span>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {modalState ? (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/60 px-6">
          <div className="w-full max-w-lg rounded-2xl border border-night-600 bg-night-800 p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl tracking-wide text-slate-100">
                {modalState.mode === "add" ? "Add track" : "Edit track"}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="text-sm uppercase tracking-[0.2em] text-slate-500"
              >
                Close
              </button>
            </div>
            <div className="mt-4 grid gap-3">
              <input
                value={newTrack.title}
                onChange={(event) => setNewTrack((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Title"
                className="rounded-md border border-night-600 bg-night-900 px-3 py-2 text-sm text-slate-100"
              />
              <input
                value={newTrack.artist}
                onChange={(event) => setNewTrack((prev) => ({ ...prev, artist: event.target.value }))}
                placeholder="Artist"
                className="rounded-md border border-night-600 bg-night-900 px-3 py-2 text-sm text-slate-100"
              />
              <input
                value={newTrack.bpm}
                onChange={(event) => setNewTrack((prev) => ({ ...prev, bpm: event.target.value }))}
                placeholder="BPM"
                inputMode="decimal"
                className="rounded-md border border-night-600 bg-night-900 px-3 py-2 text-sm text-slate-100"
              />
              <Listbox
                value={newTrack.key || null}
                onChange={(value: string | null) => {
                  if (value) {
                    setNewTrack((prev) => ({ ...prev, key: value }));
                  }
                }}
              >
                <div className="relative">
                  <Listbox.Button className="w-full rounded-md border border-night-600 bg-night-900 px-3 py-2 text-left text-sm text-slate-100">
                    {newTrack.key ? formatKeyDisplay(newTrack.key, keyFormat) : "Select key"}
                  </Listbox.Button>
                  <Listbox.Options className="absolute z-10 mt-2 max-h-56 w-full overflow-auto rounded-xl border border-night-600 bg-night-800/95 p-2 text-sm shadow-lg">
                    {keyOptions.map((option) => (
                      <Listbox.Option
                        key={option}
                        value={option}
                        className={({ active }) =>
                          `cursor-pointer rounded-lg px-3 py-2 ${
                            active ? "bg-night-600 text-neon-300" : "text-slate-200"
                          }`
                        }
                      >
                        {formatKeyDisplay(option, keyFormat)}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </div>
              </Listbox>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full border border-night-600 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-400"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void (modalState.mode === "add" ? handleAdd() : handleEdit())}
                className="rounded-full border border-neon-500 px-4 py-2 text-xs uppercase tracking-[0.2em] text-neon-400"
              >
                {modalState.mode === "add" ? "Add track" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default LibraryManager;
