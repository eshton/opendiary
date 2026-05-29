#!/usr/bin/env bun
// Open Diary CLI entry point.
// Thin shell over @opendiary/core — no diary logic lives here.
// Spec: docs/features/0002-cli-write-read.md

import { run } from "./cli.ts";

process.exit(await run(process.argv.slice(2)));
