// Open Diary core — public surface.
// INVARIANT: this package performs no network egress. Local disk only.

export type { Entry, EntrySummary, ListQuery, NewEntry } from "./entry.ts";
export { newEntry, slugForEntry, toSummary, applyQuery, today } from "./entry.ts";

export { Diary, openDiary } from "./diary.ts";

export type { OpenDiaryConfig, StorageConfig } from "./config/config.ts";
export {
  DEFAULT_STORAGE_KIND,
  defaultConfig,
  loadConfig,
  resolveConfigPath,
  localConfigPath,
  validateConfig,
  ConfigError,
} from "./config/config.ts";

export type { StorageAdapter, StorageKind } from "./storage/adapter.ts";
export { createAdapter } from "./storage/factory.ts";
export { MarkdownAdapter } from "./storage/markdown.ts";
export { TextAdapter } from "./storage/text.ts";
export { SqliteAdapter } from "./storage/sqlite.ts";
