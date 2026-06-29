// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
// @cloudflare/vite-plugin builds from this — wrangler.jsonc main alone is insufficient.
export default defineConfig({
  vite: {
    define: {
      "process.env.SUPABASE_URL": JSON.stringify(
        process.env.SUPABASE_URL ?? "https://dofmsxihjlohiouvxjsy.supabase.co",
      ),
      "process.env.SUPABASE_PUBLISHABLE_KEY": JSON.stringify(
        process.env.SUPABASE_PUBLISHABLE_KEY ??
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvZm1zeGloamxvaGlvdXZ4anN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNjA0MjMsImV4cCI6MjA5NDczNjQyM30.szW2LSreyqCf6p-EdoFkr04nIAJfoV86Kv8tUIg4YlQ",
      ),
    },
  },
  tanstackStart: {
    server: { entry: "server" },
  },
});
