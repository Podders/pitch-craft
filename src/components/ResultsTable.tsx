import { useMemo, useRef } from "react";
import { useReactTable, getCoreRowModel, flexRender, type ColumnDef } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { CompatibleResult } from "../types/track";
import type { KeyDisplayFormat } from "../engine/key";
import { formatKeyDisplay } from "../engine/key";

type ResultsTableProps = {
  results: CompatibleResult[];
  keyFormat: KeyDisplayFormat;
  onSelectMatch?: (result: CompatibleResult) => void;
};

const ResultsTable = ({ results, keyFormat, onSelectMatch }: ResultsTableProps) => {
  const columns = useMemo<ColumnDef<CompatibleResult>[]>(
    () => [
      {
        header: "Track",
        accessorFn: (row) => row.track.title,
        cell: (info) => (
          <span className="truncate-cell font-semibold md:font-normal">{info.getValue() as string}</span>
        )
      },
      {
        header: "Artist",
        accessorFn: (row) => row.track.artist,
        cell: (info) => (
          <span className="truncate-cell text-slate-400 md:text-slate-200">{info.getValue() as string}</span>
        )
      },
      {
        header: "Pitch %",
        accessorFn: (row) => row.pitchPercent,
        cell: (info) => <span className="text-neon-400">{Number(info.getValue()).toFixed(2)}%</span>
      },
      {
        header: "BPM",
        accessorFn: (row) => row.bpm,
        cell: (info) => <span>{Number(info.getValue()).toFixed(2)}</span>
      },
      {
        header: "Key",
        accessorFn: (row) => row.key,
        cell: (info) => <span>{formatKeyDisplay(info.getValue() as string, keyFormat)}</span>
      },
      {
        header: "Compatibility",
        accessorFn: (row) => row.compatibility,
        cell: (info) => <span className="text-ember-400">{info.getValue() as string}</span>
      },
      {
        header: "Use",
        id: "use",
        cell: (info) => (
          <button
            type="button"
            onClick={() => onSelectMatch?.(info.row.original)}
            className="rounded-full border border-neon-500/60 px-3 py-1 text-xs uppercase tracking-[0.2em] text-neon-400"
            disabled={!onSelectMatch}
          >
            Use
          </button>
        )
      }
    ],
    [keyFormat]
  );

  const table = useReactTable({
    data: results,
    columns,
    getCoreRowModel: getCoreRowModel()
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: table.getRowModel().rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 52,
    overscan: 8
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  return (
    <div className="flex h-full flex-col rounded-2xl border border-night-600 bg-night-800/70 p-6 shadow-lg">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-2xl tracking-wide text-slate-100">Compatible tracks</h2>
        <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
          {results.length} matches
        </span>
      </div>
      {results.length === 0 ? (
        <div className="mt-2 rounded-xl border border-dashed border-night-600 px-4 py-6 text-center text-slate-500">
          No compatible tracks yet. Adjust pitch or choose another track.
        </div>
      ) : (
        <div ref={scrollRef} className="table-scroll mt-2 flex-1 min-h-0 overflow-auto">
          <div className="table-grid sticky top-0 z-10 bg-night-800/95 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-500">
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
                  className="table-grid absolute left-0 right-0 rounded-xl border border-night-600 bg-night-700/70 px-4 py-3 text-sm text-slate-100"
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
      )}
    </div>
  );
};

export default ResultsTable;
