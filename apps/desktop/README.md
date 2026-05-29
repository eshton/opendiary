# @opendiary/desktop

Tauri desktop shell for Open Diary. **Placeholder** — not yet scaffolded.

The desktop app wraps the `@opendiary/web` frontend in a [Tauri](https://tauri.app) window. Rust shell, tiny binary, strong privacy fit: no browser, no remote anything. The diary logic stays in `@opendiary/core`; the Rust side only handles windowing, the local file system, and OS integration.

When desktop work starts, the implementer adds `src-tauri/` (Rust project + `tauri.conf.json`) per [`docs/features/0009-desktop-tauri.md`](../../docs/features/0009-desktop-tauri.md). Until then this package only reserves the name and workspace slot.

## Why Tauri (not Electron)

- Native webview → MBs not hundreds of MBs.
- Rust backend with an explicit allow-list for filesystem/IPC — matches the "stays on your machine" guarantee.
- No bundled Chromium / Node runtime to ship or update.
