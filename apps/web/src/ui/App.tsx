// App shell: two-pane diary (entry list + detail/editor).
// Spec: docs/features/0003-local-web-server.md

import { useState } from "react";
import { EntryList } from "./components/EntryList.tsx";
import { EntryView } from "./components/EntryView.tsx";
import { EntryEditor } from "./components/EntryEditor.tsx";

type Pane = { mode: "empty" } | { mode: "view"; id: string } | { mode: "edit"; id: string } | { mode: "new" };

export function App() {
  const [pane, setPane] = useState<Pane>({ mode: "empty" });
  const [search, setSearch] = useState("");

  const selectedId = pane.mode === "view" || pane.mode === "edit" ? pane.id : null;

  return (
    <div className="flex h-full">
      <aside className="flex w-80 shrink-0 flex-col border-r border-stone-200 bg-stone-50">
        <header className="flex items-center justify-between gap-2 border-b border-stone-200 px-4 py-3">
          <div>
            <h1 className="text-lg font-semibold text-stone-900">Open Diary</h1>
            <p className="text-[11px] uppercase tracking-wide text-stone-400">local only · 127.0.0.1</p>
          </div>
          <button
            onClick={() => setPane({ mode: "new" })}
            className="rounded-md bg-stone-800 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-stone-700"
          >
            New
          </button>
        </header>

        <div className="px-3 py-2">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search entries…"
            className="w-full rounded-md border border-stone-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-stone-400"
          />
        </div>

        <EntryList
          search={search}
          selectedId={selectedId}
          onSelect={(id) => setPane({ mode: "view", id })}
        />
      </aside>

      <main className="flex-1 overflow-y-auto">
        {pane.mode === "empty" && <Empty />}
        {pane.mode === "new" && (
          <EntryEditor
            key="new"
            onDone={(id) => setPane({ mode: "view", id })}
            onCancel={() => setPane({ mode: "empty" })}
          />
        )}
        {pane.mode === "edit" && (
          <EntryEditor
            key={pane.id}
            id={pane.id}
            onDone={(id) => setPane({ mode: "view", id })}
            onCancel={() => setPane({ mode: "view", id: pane.id })}
          />
        )}
        {pane.mode === "view" && (
          <EntryView
            id={pane.id}
            onEdit={() => setPane({ mode: "edit", id: pane.id })}
            onDeleted={() => setPane({ mode: "empty" })}
          />
        )}
      </main>
    </div>
  );
}

function Empty() {
  return (
    <div className="flex h-full items-center justify-center text-stone-400">
      <p>Select an entry, or write a new one.</p>
    </div>
  );
}
