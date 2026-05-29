// CLI integration tests — exercise commands against a scratch cwd.
// Spec: docs/features/0002-cli-write-read.md

import { afterAll, afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { run } from "./cli.ts";

const dirs: string[] = [];
let cwd: string;
const origCwd = process.cwd();

beforeEach(async () => {
  cwd = await mkdtemp(join(tmpdir(), "opendiary-cli-"));
  dirs.push(cwd);
  process.chdir(cwd);
});
afterEach(() => process.chdir(origCwd));
afterAll(async () => {
  await Promise.all(dirs.map((d) => rm(d, { recursive: true, force: true })));
});

describe("CLI", () => {
  test("help returns 0", async () => {
    expect(await run(["help"])).toBe(0);
  });

  test("init creates config + storage", async () => {
    expect(await run(["init", "--storage", "markdown"])).toBe(0);
    expect(existsSync(join(cwd, ".opendiary", "config.json"))).toBe(true);
  });

  test("write then list round-trips after init", async () => {
    await run(["init"]);
    expect(await run(["write", "-m", "hello diary", "--title", "T", "--tag", "x"])).toBe(0);
    const files = await readdir(join(cwd, "entries"));
    expect(files.filter((f) => f.endsWith(".md"))).toHaveLength(1);
    expect(await run(["list", "--json"])).toBe(0);
  });

  test("write rejects empty body", async () => {
    await run(["init"]);
    expect(await run(["write", "-m", "   "])).toBe(1);
  });

  test("read missing id returns 1", async () => {
    await run(["init"]);
    expect(await run(["read", "does-not-exist"])).toBe(1);
  });

  test("delete without --yes refuses (exit 1)", async () => {
    await run(["init"]);
    expect(await run(["delete", "whatever"])).toBe(1);
  });

  test("unknown command returns 1", async () => {
    expect(await run(["frobnicate"])).toBe(1);
  });
});
