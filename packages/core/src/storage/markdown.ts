// Open Diary — Markdown storage backend (DEFAULT).
// One human-readable `.md` file per entry, with YAML front-matter for metadata.
// Spec: docs/features/0001-storage-adapters.md

import { mkdir, readdir, readFile, writeFile, unlink } from "node:fs/promises";
import { join } from "node:path";
import matter from "gray-matter";
import type { Entry, EntrySummary, ListQuery } from "../entry.ts";
import { applyQuery, slugForEntry, toSummary } from "../entry.ts";
import type { StorageAdapter } from "./adapter.ts";

export interface MarkdownAdapterOptions {
  /** Directory that holds the `.md` entry files. */
  dir: string;
}

/**
 * Stores each entry as `<dir>/<date>-<slug>.md`.
 * Front-matter carries id/date/title/tags/timestamps; body is the markdown content.
 * Use `gray-matter` to read (split fence + parse YAML) and serialize.
 */
export class MarkdownAdapter implements StorageAdapter {
  constructor(private readonly options: MarkdownAdapterOptions) {}

  async init(): Promise<void> {
    await mkdir(this.options.dir, { recursive: true });
  }

  async create(entry: Entry): Promise<Entry> {
    await writeFile(this.filename(entry), serialize(entry), { flag: "wx" });
    return entry;
  }

  async read(id: string): Promise<Entry | null> {
    const file = await this.findFile(id);
    if (!file) return null;
    return parse(await readFile(join(this.options.dir, file), "utf8"));
  }

  async list(query?: ListQuery): Promise<EntrySummary[]> {
    const entries = await this.readAll();
    return applyQuery(entries, query).map((e) => toSummary(e));
  }

  async update(id: string, patch: Partial<Entry>): Promise<Entry> {
    const file = await this.findFile(id);
    if (!file) throw new Error(`entry not found: ${id}`);
    const current = parse(await readFile(join(this.options.dir, file), "utf8"));
    const next: Entry = { ...current, ...patch, id: current.id, createdAt: current.createdAt };
    const oldPath = join(this.options.dir, file);
    const newPath = this.filename(next);
    await writeFile(newPath, serialize(next));
    if (newPath !== oldPath) await unlink(oldPath);
    return next;
  }

  async remove(id: string): Promise<void> {
    const file = await this.findFile(id);
    if (file) await unlink(join(this.options.dir, file));
  }

  // --- internals ---

  private filename(entry: Entry): string {
    return join(this.options.dir, `${slugForEntry(entry)}.md`);
  }

  /** Locate the `.md` file whose front-matter id matches. */
  private async findFile(id: string): Promise<string | null> {
    for (const file of await this.mdFiles()) {
      const entry = parse(await readFile(join(this.options.dir, file), "utf8"));
      if (entry.id === id) return file;
    }
    return null;
  }

  private async readAll(): Promise<Entry[]> {
    const entries: Entry[] = [];
    for (const file of await this.mdFiles()) {
      entries.push(parse(await readFile(join(this.options.dir, file), "utf8")));
    }
    return entries;
  }

  private async mdFiles(): Promise<string[]> {
    try {
      return (await readdir(this.options.dir)).filter((f) => f.endsWith(".md"));
    } catch {
      return [];
    }
  }
}

/** Serialize an Entry into front-matter + markdown body. */
function serialize(entry: Entry): string {
  const data: Record<string, unknown> = {
    id: entry.id,
    date: entry.date,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  };
  if (entry.title !== undefined) data.title = entry.title;
  if (entry.tags !== undefined) data.tags = entry.tags;
  return matter.stringify(entry.body, data);
}

/** Parse front-matter + body back into an Entry. */
function parse(content: string): Entry {
  const { data, content: body } = matter(content);
  return {
    id: String(data.id),
    date: asDate(data.date),
    title: data.title != null ? String(data.title) : undefined,
    // gray-matter frames body with surrounding newlines; strip the framing pair.
    body: body.replace(/^\n/, "").replace(/\n$/, ""),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : undefined,
    createdAt: asTimestamp(data.createdAt),
    updatedAt: asTimestamp(data.updatedAt),
  };
}

// js-yaml coerces ISO-looking scalars to Date; normalize back to our string forms.
function asDate(v: unknown): string {
  return v instanceof Date ? v.toISOString().slice(0, 10) : String(v);
}
function asTimestamp(v: unknown): string {
  return v instanceof Date ? v.toISOString() : String(v);
}
