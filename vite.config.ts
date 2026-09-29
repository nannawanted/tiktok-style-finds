// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { sentryTanstackStart } from "@sentry/tanstackstart-react/vite";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  // N'active l'upload des source maps que si SENTRY_AUTH_TOKEN est défini
  // (variable d'environnement Vercel) — no-op sinon, donc jamais bloquant
  // pour le build tant que le secret n'a pas été ajouté.
  plugins: process.env.SENTRY_AUTH_TOKEN
    ? [
        sentryTanstackStart({
          org: "wanted-fashion",
          project: "javascript-tanstackstart-react",
          authToken: process.env.SENTRY_AUTH_TOKEN,
        }),
      ]
    : [],
});
