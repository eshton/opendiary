# 0009 — Desktop (Tauri)

> **Status:** planned · **Phase:** roadmap (Phase 4)

## Goal

Ship a native desktop app that wraps the `@opendiary/web` frontend in a Tauri window — offline-first, tiny binary, no browser, diary logic still in `@opendiary/core`.

## User stories

- As a user, I can install Open Diary as a desktop app.
- As a user, I get the web UI without running a browser or a visible server.
- As a user, my data stays in local files the Rust shell is explicitly allowed to touch.

## Approach (sketch)

- Add `apps/desktop/src-tauri/` (Rust project + `tauri.conf.json`).
- Frontend = the built `@opendiary/web` UI assets (reuse, don't fork).
- Core access: either (a) run the bun web server bound to `127.0.0.1` as a sidecar and point the webview at it, or (b) expose core operations through Tauri IPC commands. Decide based on packaging simplicity.
- Lock down Tauri allow-list: only the vault directory + needed APIs. No remote URLs.

## Acceptance criteria (draft)

- [ ] App launches to the diary UI with no external browser.
- [ ] Reads/writes the same vault as CLI/web.
- [ ] No outbound network by default; CSP blocks remote origins.
- [ ] Binary is small (native webview, no bundled Chromium).

## Out of scope

- Mobile. Auto-update infra (later). App-store distribution specifics.

## Dependencies

- Depends on: `0003` (web UI), `0001`/`0004` (core + config).

## Open questions

- Sidecar bun server vs Tauri IPC for core access.
- How the desktop app locates/creates the default vault on first run.
- Code-signing / notarization per OS.
