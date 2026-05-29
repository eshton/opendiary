// Typed fetch client over /api/*. Types shared from @opendiary/core.
// Spec: docs/features/0003-local-web-server.md

import type { Entry, EntrySummary, ListQuery, NewEntry } from "@opendiary/core";

async function jsonOrThrow<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const message = await res
      .json()
      .then((d: { error?: string }) => d.error)
      .catch(() => res.statusText);
    throw new Error(message ?? res.statusText);
  }
  return (await res.json()) as T;
}

function qs(query: ListQuery): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value != null && value !== "") params.set(key, String(value));
  }
  const s = params.toString();
  return s ? `?${s}` : "";
}

const JSON_HEADERS = { "content-type": "application/json" };

export const api = {
  list: (query: ListQuery = {}) =>
    fetch(`/api/entries${qs(query)}`).then(jsonOrThrow<EntrySummary[]>),

  get: (id: string) => fetch(`/api/entries/${id}`).then(jsonOrThrow<Entry>),

  create: (entry: NewEntry) =>
    fetch("/api/entries", {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify(entry),
    }).then(jsonOrThrow<Entry>),

  update: (id: string, patch: Partial<Entry>) =>
    fetch(`/api/entries/${id}`, {
      method: "PATCH",
      headers: JSON_HEADERS,
      body: JSON.stringify(patch),
    }).then(jsonOrThrow<Entry>),

  remove: async (id: string) => {
    const res = await fetch(`/api/entries/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error(`delete failed: ${id}`);
  },
};
