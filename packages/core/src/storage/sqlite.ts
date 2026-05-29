// Open Diary — SQLite storage backend.
// Single DB file. Fast search/queries via bun:sqlite.
// Spec: docs/features/0001-storage-adapters.md

import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { Database } from "bun:sqlite";
import type { Entry, EntrySummary, ListQuery } from "../entry.ts";
import { toSummary } from "../entry.ts";
import type { StorageAdapter } from "./adapter.ts";

export interface SqliteAdapterOptions {
  /** Path to the SQLite database file. */
  path: string;
}

interface Row {
  id: string;
  date: string;
  title: string | null;
  body: string;
  tags: string | null; // JSON array text
  createdAt: string;
  updatedAt: string;
}

/** Stores entries in an `entries` table. tags are JSON-encoded text. */
export class SqliteAdapter implements StorageAdapter {
  private db?: Database;

  constructor(private readonly options: SqliteAdapterOptions) {}

  async init(): Promise<void> {
    if (this.options.path !== ":memory:") {
      await mkdir(dirname(this.options.path), { recursive: true });
    }
    const db = new Database(this.options.path, { create: true });
    db.run("PRAGMA journal_mode = WAL;");
    db.run(`
      CREATE TABLE IF NOT EXISTS entries (
        id        TEXT PRIMARY KEY,
        date      TEXT NOT NULL,
        title     TEXT,
        body      TEXT NOT NULL,
        tags      TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
    `);
    db.run("CREATE INDEX IF NOT EXISTS idx_entries_date ON entries(date);");
    this.db = db;
  }

  async create(entry: Entry): Promise<Entry> {
    this.conn()
      .query(
        `INSERT INTO entries (id, date, title, body, tags, createdAt, updatedAt)
         VALUES ($id, $date, $title, $body, $tags, $createdAt, $updatedAt)`,
      )
      .run(bind(entry));
    return entry;
  }

  async read(id: string): Promise<Entry | null> {
    const row = this.conn().query("SELECT * FROM entries WHERE id = ?").get(id) as Row | null;
    return row ? fromRow(row) : null;
  }

  async list(query: ListQuery = {}): Promise<EntrySummary[]> {
    const where: string[] = [];
    const params: Record<string, string | number> = {};
    if (query.from) (where.push("date >= $from"), (params.$from = query.from));
    if (query.to) (where.push("date <= $to"), (params.$to = query.to));
    if (query.search) {
      where.push("(body LIKE $q OR IFNULL(title,'') LIKE $q)");
      params.$q = `%${query.search}%`;
    }
    if (query.tag) {
      // tags stored as JSON array text; match the quoted element.
      where.push("IFNULL(tags,'') LIKE $tag");
      params.$tag = `%${JSON.stringify(query.tag).slice(1, -1)}%`;
    }
    const order = (query.order ?? "desc").toUpperCase();
    let sql = "SELECT * FROM entries";
    if (where.length) sql += ` WHERE ${where.join(" AND ")}`;
    sql += ` ORDER BY date ${order}, id ${order}`;
    if (query.limit != null) (sql += " LIMIT $limit"), (params.$limit = query.limit);
    if (query.offset != null) (sql += " OFFSET $offset"), (params.$offset = query.offset);

    const rows = this.conn().query(sql).all(params) as Row[];
    return rows.map((r) => toSummary(fromRow(r)));
  }

  async update(id: string, patch: Partial<Entry>): Promise<Entry> {
    const current = await this.read(id);
    if (!current) throw new Error(`entry not found: ${id}`);
    const next: Entry = { ...current, ...patch, id: current.id, createdAt: current.createdAt };
    this.conn()
      .query(
        `UPDATE entries SET date=$date, title=$title, body=$body, tags=$tags,
         createdAt=$createdAt, updatedAt=$updatedAt WHERE id=$id`,
      )
      .run(bind(next));
    return next;
  }

  async remove(id: string): Promise<void> {
    this.conn().query("DELETE FROM entries WHERE id = ?").run(id);
  }

  private conn(): Database {
    if (!this.db) throw new Error("SqliteAdapter not initialized — call init() first");
    return this.db;
  }
}

function bind(entry: Entry): Record<string, string | null> {
  return {
    $id: entry.id,
    $date: entry.date,
    $title: entry.title ?? null,
    $body: entry.body,
    $tags: entry.tags ? JSON.stringify(entry.tags) : null,
    $createdAt: entry.createdAt,
    $updatedAt: entry.updatedAt,
  };
}

function fromRow(row: Row): Entry {
  return {
    id: row.id,
    date: row.date,
    title: row.title ?? undefined,
    body: row.body,
    tags: row.tags ? (JSON.parse(row.tags) as string[]) : undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
