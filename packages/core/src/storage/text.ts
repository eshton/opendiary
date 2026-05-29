// Open Diary — Plain-text storage backend.
// One `.txt` file per entry (raw body) + a `.json` sidecar for metadata.
// Spec: docs/features/0001-storage-adapters.md

import { mkdir, readdir, readFile, writeFile, unlink } from "node:fs/promises";
import { join } from "node:path";
import type { Entry, EntrySummary, ListQuery } from "../entry.ts";
import { applyQuery, slugForEntry, toSummary } from "../entry.ts";
import type { StorageAdapter } from "./adapter.ts";

export interface TextAdapterOptions {
  /** Directory that holds the `.txt` entry files. */
  dir: string;
}

type Sidecar = Omit<Entry, "body">;

/**
 * Stores each entry as `<dir>/<date>-<slug>.txt` (raw body) with metadata in
 * `<date>-<slug>.txt.json` alongside it. Minimal, maximally portable.
 */
export class TextAdapter implements StorageAdapter {
  constructor(private readonly options: TextAdapterOptions) {}

  async init(): Promise<void> {
    await mkdir(this.options.dir, { recursive: true });
  }

  async create(entry: Entry): Promise<Entry> {
    const base = this.basename(entry);
    await writeFile(this.txtPath(base), entry.body, { flag: "wx" });
    await writeFile(this.metaPath(base), serializeMeta(entry));
    return entry;
  }

  async read(id: string): Promise<Entry | null> {
    const base = await this.findBase(id);
    return base ? this.load(base) : null;
  }

  async list(query?: ListQuery): Promise<EntrySummary[]> {
    const entries: Entry[] = [];
    for (const base of await this.bases()) entries.push(await this.load(base));
    return applyQuery(entries, query).map((e) => toSummary(e));
  }

  async update(id: string, patch: Partial<Entry>): Promise<Entry> {
    const oldBase = await this.findBase(id);
    if (!oldBase) throw new Error(`entry not found: ${id}`);
    const current = await this.load(oldBase);
    const next: Entry = { ...current, ...patch, id: current.id, createdAt: current.createdAt };
    const newBase = this.basename(next);
    await writeFile(this.txtPath(newBase), next.body);
    await writeFile(this.metaPath(newBase), serializeMeta(next));
    if (newBase !== oldBase) {
      await unlink(this.txtPath(oldBase));
      await unlink(this.metaPath(oldBase));
    }
    return next;
  }

  async remove(id: string): Promise<void> {
    const base = await this.findBase(id);
    if (!base) return;
    await unlink(this.txtPath(base)).catch(() => {});
    await unlink(this.metaPath(base)).catch(() => {});
  }

  // --- internals ---

  private basename(entry: Entry): string {
    return slugForEntry(entry);
  }
  private txtPath(base: string): string {
    return join(this.options.dir, `${base}.txt`);
  }
  private metaPath(base: string): string {
    return join(this.options.dir, `${base}.txt.json`);
  }

  private async load(base: string): Promise<Entry> {
    const meta = JSON.parse(await readFile(this.metaPath(base), "utf8")) as Sidecar;
    const body = await readFile(this.txtPath(base), "utf8");
    return { ...meta, body };
  }

  private async findBase(id: string): Promise<string | null> {
    for (const base of await this.bases()) {
      const meta = JSON.parse(await readFile(this.metaPath(base), "utf8")) as Sidecar;
      if (meta.id === id) return base;
    }
    return null;
  }

  /** Entry basenames (filename without the `.txt` extension). */
  private async bases(): Promise<string[]> {
    try {
      return (await readdir(this.options.dir))
        .filter((f) => f.endsWith(".txt"))
        .map((f) => f.slice(0, -".txt".length));
    } catch {
      return [];
    }
  }
}

function serializeMeta(entry: Entry): string {
  const { body: _body, ...meta } = entry;
  return JSON.stringify(meta, null, 2);
}
