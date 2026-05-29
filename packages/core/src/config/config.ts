// Open Diary — configuration schema + resolution.
// Spec: docs/features/0004-config-and-init.md
//
// Config picks the storage backend and where data lives. Default = markdown.
// Search order (first hit wins):
//   1. $OPENDIARY_CONFIG (explicit file path)
//   2. <cwd>/.opendiary/config.json        (project-local vault)
//   3. $XDG_CONFIG_HOME/opendiary/config.json  (or ~/.config/opendiary/config.json)

import { join } from "node:path";
import { homedir } from "node:os";
import { existsSync } from "node:fs";
import type { StorageKind } from "../storage/adapter.ts";

/** Storage config is a discriminated union keyed by `kind`. */
export type StorageConfig =
  | { kind: "markdown"; dir: string }
  | { kind: "text"; dir: string }
  | { kind: "sqlite"; path: string };

export interface OpenDiaryConfig {
  /** Config schema version, for forward migration. */
  version: 1;
  storage: StorageConfig;
  /** Local web server settings. Host is fixed to loopback by the web app. */
  web?: {
    port?: number; // default 4747
  };
}

export const DEFAULT_STORAGE_KIND: StorageKind = "markdown";
export const CONFIG_DIRNAME = ".opendiary";
export const CONFIG_FILENAME = "config.json";

/** Default config: markdown backend with entries under `<baseDir>/entries`. */
export function defaultConfig(baseDir: string): OpenDiaryConfig {
  return {
    version: 1,
    storage: { kind: "markdown", dir: join(baseDir, "entries") },
  };
}

/** Global config path under XDG / ~/.config. */
function globalConfigPath(): string {
  const base = process.env.XDG_CONFIG_HOME || join(homedir(), ".config");
  return join(base, "opendiary", CONFIG_FILENAME);
}

/**
 * Locate an existing config file using the documented search order.
 * Returns the path of the first one that exists, else null.
 */
export function resolveConfigPath(cwd: string): string | null {
  const candidates = [
    process.env.OPENDIARY_CONFIG,
    join(cwd, CONFIG_DIRNAME, CONFIG_FILENAME),
    globalConfigPath(),
  ].filter((p): p is string => Boolean(p));

  for (const path of candidates) {
    if (existsSync(path)) return path;
  }
  return null;
}

/** Where `init` writes a new project-local config. */
export function localConfigPath(cwd: string): string {
  return join(cwd, CONFIG_DIRNAME, CONFIG_FILENAME);
}

/**
 * Load + validate config from disk. Falls back to defaults rooted at `cwd`
 * when no config file exists.
 */
export async function loadConfig(cwd: string): Promise<OpenDiaryConfig> {
  const path = resolveConfigPath(cwd);
  if (!path) return defaultConfig(cwd);
  const raw = JSON.parse(await Bun.file(path).text());
  return validateConfig(raw);
}

/** Runtime-validate untrusted JSON into an OpenDiaryConfig. Throws on bad input. */
export function validateConfig(raw: unknown): OpenDiaryConfig {
  if (typeof raw !== "object" || raw === null) {
    throw new ConfigError("config must be an object");
  }
  const obj = raw as Record<string, unknown>;
  if (obj.version !== 1) {
    throw new ConfigError(`unsupported config version: ${String(obj.version)} (expected 1)`);
  }
  const storage = obj.storage;
  if (typeof storage !== "object" || storage === null) {
    throw new ConfigError("config.storage is required");
  }
  const s = storage as Record<string, unknown>;
  switch (s.kind) {
    case "markdown":
    case "text":
      if (typeof s.dir !== "string" || s.dir.length === 0) {
        throw new ConfigError(`storage.dir is required for kind "${s.kind}"`);
      }
      break;
    case "sqlite":
      if (typeof s.path !== "string" || s.path.length === 0) {
        throw new ConfigError('storage.path is required for kind "sqlite"');
      }
      break;
    default:
      throw new ConfigError(`unknown storage.kind: ${JSON.stringify(s.kind)}`);
  }

  const web = obj.web;
  if (web !== undefined) {
    if (typeof web !== "object" || web === null) {
      throw new ConfigError("config.web must be an object");
    }
    const port = (web as Record<string, unknown>).port;
    if (port !== undefined && (typeof port !== "number" || !Number.isInteger(port))) {
      throw new ConfigError("config.web.port must be an integer");
    }
  }

  return raw as OpenDiaryConfig;
}

/** Thrown for invalid configuration. */
export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}
