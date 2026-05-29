// Read view for a single entry, with edit/delete actions.

import type { ReactNode } from "react";
import { useEntry, useDeleteEntry } from "../queries.ts";

interface Props {
  id: string;
  onEdit: () => void;
  onDeleted: () => void;
}

export function EntryView({ id, onEdit, onDeleted }: Props) {
  const { data: entry, isLoading, error } = useEntry(id);
  const del = useDeleteEntry();

  if (isLoading) return <Pad>Loading…</Pad>;
  if (error) return <Pad>Error: {(error as Error).message}</Pad>;
  if (!entry) return <Pad>Not found.</Pad>;

  async function handleDelete() {
    if (!confirm("Delete this entry? This cannot be undone.")) return;
    await del.mutateAsync(id);
    onDeleted();
  }

  return (
    <article className="mx-auto max-w-2xl px-8 py-10">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl text-stone-900">
            {entry.title || <span className="italic text-stone-400">Untitled</span>}
          </h2>
          <p className="mt-1 text-sm text-stone-400">
            {entry.date} · updated {new Date(entry.updatedAt).toLocaleString()}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={onEdit}
            className="rounded-md border border-stone-300 px-3 py-1.5 text-sm text-stone-700 transition hover:bg-stone-100"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={del.isPending}
            className="rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-600 transition hover:bg-red-50 disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </div>

      {entry.tags && entry.tags.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-1.5">
          {entry.tags.map((t) => (
            <span key={t} className="rounded bg-stone-200 px-2 py-0.5 text-xs text-stone-600">
              {t}
            </span>
          ))}
        </div>
      )}

      <div className="whitespace-pre-wrap font-serif text-lg leading-relaxed text-stone-800">
        {entry.body}
      </div>
    </article>
  );
}

function Pad({ children }: { children: ReactNode }) {
  return <div className="px-8 py-10 text-stone-400">{children}</div>;
}
