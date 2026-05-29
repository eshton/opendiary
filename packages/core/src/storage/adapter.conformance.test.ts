// Shared StorageAdapter conformance suite — run against every backend.
// Spec: docs/features/0001-storage-adapters.md

import { afterAll, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { newEntry } from "../entry.ts";
import type { StorageAdapter } from "./adapter.ts";
import { MarkdownAdapter } from "./markdown.ts";
import { TextAdapter } from "./text.ts";
import { SqliteAdapter } from "./sqlite.ts";

const tmpDirs: string[] = [];
async function scratch(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "opendiary-test-"));
  tmpDirs.push(dir);
  return dir;
}
afterAll(async () => {
  await Promise.all(tmpDirs.map((d) => rm(d, { recursive: true, force: true })));
});

type Factory = () => Promise<StorageAdapter>;

const backends: Record<string, Factory> = {
  markdown: async () => new MarkdownAdapter({ dir: await scratch() }),
  text: async () => new TextAdapter({ dir: await scratch() }),
  sqlite: async () => new SqliteAdapter({ path: join(await scratch(), "diary.db") }),
};

for (const [name, make] of Object.entries(backends)) {
  describe(`StorageAdapter conformance: ${name}`, () => {
    let adapter: StorageAdapter;

    beforeEach(async () => {
      adapter = await make();
      await adapter.init();
    });

    test("create then read round-trips", async () => {
      const e = newEntry({ body: "hello world", title: "Day one", tags: ["a", "b"] });
      await adapter.create(e);
      const got = await adapter.read(e.id);
      expect(got).toEqual(e);
    });

    test("read missing id returns null", async () => {
      expect(await adapter.read("nope")).toBeNull();
    });

    test("list returns summaries, newest first by default", async () => {
      await adapter.create(newEntry({ body: "old", date: "2026-01-01" }));
      await adapter.create(newEntry({ body: "new", date: "2026-12-31" }));
      const list = await adapter.list();
      expect(list).toHaveLength(2);
      expect(list[0]!.date).toBe("2026-12-31");
      expect(list[0]).not.toHaveProperty("body");
      expect(list[0]!.excerpt).toBe("new");
    });

    test("list filters by date range, tag, and search", async () => {
      await adapter.create(newEntry({ body: "alpha note", date: "2026-03-01", tags: ["work"] }));
      await adapter.create(newEntry({ body: "beta note", date: "2026-06-01", tags: ["home"] }));
      await adapter.create(newEntry({ body: "gamma", date: "2026-09-01", tags: ["work"] }));

      expect(await adapter.list({ from: "2026-04-01", to: "2026-07-01" })).toHaveLength(1);
      expect(await adapter.list({ tag: "work" })).toHaveLength(2);
      expect(await adapter.list({ search: "note" })).toHaveLength(2);
      expect(await adapter.list({ search: "GAMMA" })).toHaveLength(1);
    });

    test("list paginates with limit/offset and order asc", async () => {
      for (const d of ["2026-01-01", "2026-02-01", "2026-03-01"]) {
        await adapter.create(newEntry({ body: d, date: d }));
      }
      const page = await adapter.list({ order: "asc", limit: 2, offset: 1 });
      expect(page.map((e) => e.date)).toEqual(["2026-02-01", "2026-03-01"]);
    });

    test("update merges patch, bumps content, preserves id", async () => {
      const e = newEntry({ body: "draft", title: "T1" });
      await adapter.create(e);
      const updated = await adapter.update(e.id, { title: "T2", body: "final" });
      expect(updated.id).toBe(e.id);
      expect(updated.title).toBe("T2");
      expect(updated.body).toBe("final");
      const reread = await adapter.read(e.id);
      expect(reread?.body).toBe("final");
      expect(reread?.title).toBe("T2");
    });

    test("update throws on unknown id", async () => {
      expect(adapter.update("ghost", { body: "x" })).rejects.toThrow();
    });

    test("remove deletes; remove on missing id is a no-op", async () => {
      const e = newEntry({ body: "bye" });
      await adapter.create(e);
      await adapter.remove(e.id);
      expect(await adapter.read(e.id)).toBeNull();
      await adapter.remove(e.id); // no throw
      await adapter.remove("never-existed"); // no throw
    });
  });
}
