// Open Diary — storage subpath public surface.
export type { StorageAdapter, StorageKind } from "./adapter.ts";
export { MarkdownAdapter } from "./markdown.ts";
export { TextAdapter } from "./text.ts";
export { SqliteAdapter } from "./sqlite.ts";
export { createAdapter } from "./factory.ts";
