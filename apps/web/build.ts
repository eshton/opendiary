// Production build of the web UI bundle.
// Spec: docs/features/0003-local-web-server.md
//
// In dev, `bun run --hot src/server.ts` bundles the HTML route on the fly.
// This script emits a static, minified bundle to dist/ for distribution.

import tailwind from "bun-plugin-tailwind";

const result = await Bun.build({
  entrypoints: ["src/index.html"],
  outdir: "dist",
  minify: true,
  plugins: [tailwind],
  define: { "process.env.NODE_ENV": JSON.stringify("production") },
});

if (!result.success) {
  for (const log of result.logs) console.error(log);
  process.exit(1);
}

console.log(`Built ${result.outputs.length} files → dist/`);
