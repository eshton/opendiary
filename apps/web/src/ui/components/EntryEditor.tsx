// Create/edit form. `id` present → edit mode (prefilled); absent → new entry.

import { useState } from "react";
import { useEntry, useCreateEntry, useUpdateEntry } from "../queries.ts";

// Local `YYYY-MM-DD` — avoids a runtime import of @opendiary/core into the
// browser bundle (the core barrel pulls bun:sqlite). Types stay import type.
const today = () => new Date().toISOString().slice(0, 10);

interface Props {
  id?: string;
  onDone: (id: string) => void;
  onCancel: () => void;
}

export function EntryEditor({ id, onDone, onCancel }: Props) {
  const editing = id != null;
  const { data: existing } = useEntry(id ?? null);
  const create = useCreateEntry();
  const update = useUpdateEntry();

  const [title, setTitle] = useState("");
  const [date, setDate] = useState(today());
  const [tags, setTags] = useState("");
  const [body, setBody] = useState("");
  const [hydrated, setHydrated] = useState(false);

  // Prefill once the existing entry loads (edit mode).
  if (editing && existing && !hydrated) {
    setTitle(existing.title ?? "");
    setDate(existing.date);
    setTags(existing.tags?.join(", ") ?? "");
    setBody(existing.body);
    setHydrated(true);
  }

  const pending = create.isPending || update.isPending;
  const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean);

  async function handleSave() {
    if (!body.trim()) return;
    const fields = {
      title: title.trim() || undefined,
      date,
      tags: tagList.length ? tagList : undefined,
      body,
    };
    if (editing) {
      const updated = await update.mutateAsync({ id, patch: fields });
      onDone(updated.id);
    } else {
      const created = await create.mutateAsync(fields);
      onDone(created.id);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-8 py-10">
      <div className="mb-6 flex items-center gap-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="flex-1 border-b border-stone-200 bg-transparent pb-1 font-serif text-2xl text-stone-900 outline-none placeholder:text-stone-300 focus:border-stone-400"
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-md border border-stone-200 px-2 py-1 text-sm text-stone-600 outline-none focus:border-stone-400"
        />
      </div>

      <input
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        placeholder="tags, comma, separated"
        className="mb-4 w-full rounded-md border border-stone-200 px-3 py-1.5 text-sm outline-none focus:border-stone-400"
      />

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write…"
        rows={16}
        className="w-full resize-y rounded-md border border-stone-200 bg-white p-4 font-serif text-lg leading-relaxed text-stone-800 outline-none focus:border-stone-400"
      />

      <div className="mt-4 flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="rounded-md border border-stone-300 px-4 py-1.5 text-sm text-stone-700 transition hover:bg-stone-100"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={pending || !body.trim()}
          className="rounded-md bg-stone-800 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-stone-700 disabled:opacity-50"
        >
          {editing ? "Save" : "Create"}
        </button>
      </div>
    </div>
  );
}
