// Open Diary CLI — command handlers. Thin mapping of argv → @opendiary/core.
// Spec: docs/features/0002-cli-write-read.md

import { parseArgs } from "node:util";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { existsSync } from "node:fs";
import {
  openDiary,
  loadConfig,
  defaultConfig,
  localConfigPath,
  type OpenDiaryConfig,
  type StorageConfig,
  type ListQuery,
} from "@opendiary/core";

const HELP = `Open Diary — your entries never leave your computer.

Usage: opendiary <command> [options]

Commands:
  init [--storage markdown|text|sqlite] [--dir PATH] [--force]
  write [--title T] [--tag t]... [--date YYYY-MM-DD] [-m "text"]
  list [--tag T] [--from D] [--to D] [--search Q] [--limit N] [--json]
  read <id> [--json]
  edit <id> [--title T] [--tag t]... [-m "text"]
  delete <id> [--yes]
  help`;

/** Run one CLI invocation. Returns a process exit code. */
export async function run(argv: string[]): Promise<number> {
  const [command, ...rest] = argv;
  try {
    switch (command) {
      case undefined:
      case "help":
      case "--help":
      case "-h":
        console.log(HELP);
        return 0;
      case "init":
        return await cmdInit(rest);
      case "write":
        return await cmdWrite(rest);
      case "list":
        return await cmdList(rest);
      case "read":
        return await cmdRead(rest);
      case "edit":
        return await cmdEdit(rest);
      case "delete":
        return await cmdDelete(rest);
      default:
        console.error(`Unknown command: ${command}\n`);
        console.log(HELP);
        return 1;
    }
  } catch (err) {
    console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
    return 1;
  }
}

async function cmdInit(args: string[]): Promise<number> {
  const { values } = parseArgs({
    args,
    options: {
      storage: { type: "string", default: "markdown" },
      dir: { type: "string" },
      force: { type: "boolean", default: false },
    },
  });

  const path = localConfigPath(process.cwd());
  if (existsSync(path) && !values.force) {
    console.error(`Config already exists at ${path} (use --force to overwrite)`);
    return 1;
  }

  const storage = buildStorageConfig(values.storage!, values.dir, process.cwd());
  const config: OpenDiaryConfig = { version: 1, storage };

  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(config, null, 2)}\n`);
  await openDiary(config); // creates storage location

  console.log(`Initialized Open Diary (${storage.kind}) — config: ${path}`);
  return 0;
}

async function cmdWrite(args: string[]): Promise<number> {
  const { values } = parseArgs({
    args,
    options: {
      title: { type: "string" },
      tag: { type: "string", multiple: true },
      date: { type: "string" },
      message: { type: "string", short: "m" },
    },
  });

  const body = values.message ?? (await readStdin());
  if (!body.trim()) {
    console.error("Empty entry — provide body via -m or stdin.");
    return 1;
  }

  const diary = await openDiary(await loadConfig(process.cwd()));
  const entry = await diary.write({
    body,
    title: values.title,
    tags: values.tag,
    date: values.date,
  });
  console.log(entry.id);
  return 0;
}

async function cmdList(args: string[]): Promise<number> {
  const { values } = parseArgs({
    args,
    options: {
      tag: { type: "string" },
      from: { type: "string" },
      to: { type: "string" },
      search: { type: "string" },
      limit: { type: "string" },
      json: { type: "boolean", default: false },
    },
  });

  const query: ListQuery = {
    tag: values.tag,
    from: values.from,
    to: values.to,
    search: values.search,
    limit: values.limit != null ? Number(values.limit) : undefined,
  };

  const diary = await openDiary(await loadConfig(process.cwd()));
  const entries = await diary.list(query);

  if (values.json) {
    console.log(JSON.stringify(entries, null, 2));
    return 0;
  }
  if (entries.length === 0) {
    console.log("No entries.");
    return 0;
  }
  for (const e of entries) {
    const tags = e.tags?.length ? ` [${e.tags.join(", ")}]` : "";
    console.log(`${e.date}  ${e.id}  ${e.title ?? e.excerpt ?? ""}${tags}`);
  }
  return 0;
}

async function cmdRead(args: string[]): Promise<number> {
  const { values, positionals } = parseArgs({
    args,
    allowPositionals: true,
    options: { json: { type: "boolean", default: false } },
  });
  const id = positionals[0];
  if (!id) return usage("read <id>");

  const diary = await openDiary(await loadConfig(process.cwd()));
  const entry = await diary.get(id);
  if (!entry) {
    console.error(`Not found: ${id}`);
    return 1;
  }
  if (values.json) {
    console.log(JSON.stringify(entry, null, 2));
    return 0;
  }
  if (entry.title) console.log(`# ${entry.title}`);
  console.log(`${entry.date}  ${entry.id}`);
  if (entry.tags?.length) console.log(`tags: ${entry.tags.join(", ")}`);
  console.log(`\n${entry.body}`);
  return 0;
}

async function cmdEdit(args: string[]): Promise<number> {
  const { values, positionals } = parseArgs({
    args,
    allowPositionals: true,
    options: {
      title: { type: "string" },
      tag: { type: "string", multiple: true },
      message: { type: "string", short: "m" },
    },
  });
  const id = positionals[0];
  if (!id) return usage("edit <id>");

  const patch: Record<string, unknown> = {};
  if (values.title !== undefined) patch.title = values.title;
  if (values.tag !== undefined) patch.tags = values.tag;
  if (values.message !== undefined) patch.body = values.message;
  if (Object.keys(patch).length === 0) {
    console.error("Nothing to edit — pass --title, --tag, and/or -m.");
    return 1;
  }

  const diary = await openDiary(await loadConfig(process.cwd()));
  const updated = await diary.edit(id, patch);
  console.log(`Updated ${updated.id}`);
  return 0;
}

async function cmdDelete(args: string[]): Promise<number> {
  const { values, positionals } = parseArgs({
    args,
    allowPositionals: true,
    options: { yes: { type: "boolean", default: false } },
  });
  const id = positionals[0];
  if (!id) return usage("delete <id>");

  if (!values.yes) {
    console.error(`Refusing to delete ${id} without --yes.`);
    return 1;
  }
  const diary = await openDiary(await loadConfig(process.cwd()));
  await diary.delete(id);
  console.log(`Deleted ${id}`);
  return 0;
}

// --- helpers ---

function buildStorageConfig(kind: string, dir: string | undefined, cwd: string): StorageConfig {
  switch (kind) {
    case "markdown":
      return { kind: "markdown", dir: dir ?? defaultDir(cwd) };
    case "text":
      return { kind: "text", dir: dir ?? defaultDir(cwd) };
    case "sqlite":
      return { kind: "sqlite", path: dir ?? `${cwd}/diary.db` };
    default:
      throw new Error(`unknown --storage: ${kind} (markdown|text|sqlite)`);
  }
}

function defaultDir(cwd: string): string {
  return (defaultConfig(cwd).storage as { dir: string }).dir;
}

function usage(form: string): number {
  console.error(`Usage: opendiary ${form}`);
  return 1;
}

async function readStdin(): Promise<string> {
  if (process.stdin.isTTY) return "";
  return await Bun.stdin.text();
}
