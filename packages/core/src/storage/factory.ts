// Open Diary — adapter factory. Resolves config → a concrete StorageAdapter.
// Spec: docs/features/0001-storage-adapters.md, docs/features/0004-config-and-init.md

import type { OpenDiaryConfig } from "../config/config.ts";
import type { StorageAdapter } from "./adapter.ts";
import { MarkdownAdapter } from "./markdown.ts";
import { TextAdapter } from "./text.ts";
import { SqliteAdapter } from "./sqlite.ts";

/**
 * Construct the storage backend named by the config.
 * Adding a backend: add a case here + a new adapter file. No app changes needed.
 */
export function createAdapter(config: OpenDiaryConfig): StorageAdapter {
  const { storage } = config;
  switch (storage.kind) {
    case "markdown":
      return new MarkdownAdapter({ dir: storage.dir });
    case "text":
      return new TextAdapter({ dir: storage.dir });
    case "sqlite":
      return new SqliteAdapter({ path: storage.path });
    default: {
      // Exhaustiveness guard — compile error if a StorageKind is unhandled.
      const _never: never = storage;
      throw new Error(`Unknown storage kind: ${JSON.stringify(_never)}`);
    }
  }
}
