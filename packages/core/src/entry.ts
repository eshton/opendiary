// Open Diary — Entry domain model.
// Spec: docs/features/0001-storage-adapters.md, docs/features/0002-cli-write-read.md

import { ulid } from "ulid";

/** A single diary entry. The unit of everything Open Diary stores. */
export interface Entry {
  /** Stable unique id (e.g. ULID). Adapter-independent. */
  id: string;
  /** ISO 8601 timestamp the entry is *about* (user-facing date). */
  date: string;
  /** Optional short title. */
  title?: string;
  /** Free-form body (markdown or plain text depending on backend). */
  body: string;
  /** Optional user tags. */
  tags?: string[];
  /** ISO 8601 created/updated bookkeeping. */
  createdAt: string;
  updatedAt: string;
}

/** Lightweight projection returned by list operations (no full body). */
export interface EntrySummary {
  id: string;
  date: string;
  title?: string;
  tags?: string[];
  /** First N characters of the body, for previews. */
  excerpt?: string;
}

/** Filter/sort options for listing entries. */
export interface ListQuery {
  from?: string; // ISO date inclusive
  to?: string; // ISO date inclusive
  tag?: string;
  /** Substring search across title/body. */
  search?: string;
  limit?: number;
  offset?: number;
  order?: "asc" | "desc"; // by date; default "desc"
}

/** Fields a caller may supply when creating an entry; the rest are derived. */
export type NewEntry = Pick<Entry, "body"> &
  Partial<Pick<Entry, "id" | "date" | "title" | "tags" | "createdAt" | "updatedAt">>;

/** Today's date as `YYYY-MM-DD` in local time. */
export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Build a full Entry from caller-supplied fields. Generates a ULID id,
 * defaults the date to today, and stamps created/updated timestamps.
 * Any field explicitly provided in `input` wins.
 */
export function newEntry(input: NewEntry): Entry {
  const now = new Date().toISOString();
  return {
    id: input.id ?? ulid(),
    date: input.date ?? today(),
    title: input.title,
    body: input.body,
    tags: input.tags,
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? now,
  };
}

/**
 * Filesystem-safe slug for file-based backends: `<date>-<title-or-id>`.
 * Title is lowercased, non-alphanumerics collapsed to hyphens, trimmed.
 * Falls back to the id when there is no usable title.
 */
export function slugForEntry(entry: Pick<Entry, "id" | "date" | "title">): string {
  const base = (entry.title ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${entry.date}-${base || entry.id}`;
}

/** Build an EntrySummary from a full Entry. `excerptLen` caps the preview. */
export function toSummary(entry: Entry, excerptLen = 140): EntrySummary {
  const flat = entry.body.replace(/\s+/g, " ").trim();
  return {
    id: entry.id,
    date: entry.date,
    title: entry.title,
    tags: entry.tags,
    excerpt: flat.length > excerptLen ? `${flat.slice(0, excerptLen)}…` : flat,
  };
}

/** Apply ListQuery filters/sort/paging to a set of entries. Shared by file backends. */
export function applyQuery(entries: Entry[], query: ListQuery = {}): Entry[] {
  let result = entries;
  if (query.from) result = result.filter((e) => e.date >= query.from!);
  if (query.to) result = result.filter((e) => e.date <= query.to!);
  if (query.tag) result = result.filter((e) => e.tags?.includes(query.tag!));
  if (query.search) {
    const q = query.search.toLowerCase();
    result = result.filter(
      (e) =>
        e.body.toLowerCase().includes(q) ||
        (e.title?.toLowerCase().includes(q) ?? false),
    );
  }
  const order = query.order ?? "desc";
  result = [...result].sort((a, b) =>
    order === "asc" ? cmp(a, b) : cmp(b, a),
  );
  const offset = query.offset ?? 0;
  const end = query.limit != null ? offset + query.limit : undefined;
  return result.slice(offset, end);
}

// Sort by date, breaking ties by id (ULIDs are time-ordered) for stability.
function cmp(a: Entry, b: Entry): number {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}
