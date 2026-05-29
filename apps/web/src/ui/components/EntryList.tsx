// Sidebar list of entry summaries.

import type { ReactNode } from "react";
import { useEntries } from "../queries.ts";

interface Props {
  search: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function EntryList({ search, selectedId, onSelect }: Props) {
  const { data: entries, isLoading, error } = useEntries(search ? { search } : {});

  if (isLoading) return <Status>Loading…</Status>;
  if (error) return <Status>Error: {(error as Error).message}</Status>;
  if (!entries || entries.length === 0) return <Status>No entries yet.</Status>;

  return (
    <ul className="flex-1 overflow-y-auto">
      {entries.map((e) => {
        const active = e.id === selectedId;
        return (
          <li key={e.id}>
            <button
              onClick={() => onSelect(e.id)}
              className={`w-full border-b border-stone-100 px-4 py-3 text-left transition hover:bg-stone-100 ${
                active ? "bg-stone-200/70" : ""
              }`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate font-medium text-stone-800">
                  {e.title || <span className="italic text-stone-400">Untitled</span>}
                </span>
                <time className="shrink-0 text-xs text-stone-400">{e.date}</time>
              </div>
              {e.excerpt && <p className="mt-0.5 truncate text-sm text-stone-500">{e.excerpt}</p>}
              {e.tags && e.tags.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {e.tags.map((t) => (
                    <span key={t} className="rounded bg-stone-200 px-1.5 py-0.5 text-[11px] text-stone-600">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function Status({ children }: { children: ReactNode }) {
  return <p className="flex-1 px-4 py-6 text-sm text-stone-400">{children}</p>;
}
