import * as Sentry from "@sentry/react";

// Surveillance des erreurs en production (visiteurs, créateurs) — jusqu'ici,
// une erreur ne remontait que si quelqu'un la signalait. Reste totalement
// silencieux (aucun appel réseau) tant que VITE_SENTRY_DSN n'est pas
// configuré, donc pas d'impact en développement local.
let initialized = false;

export function initSentry() {
  if (initialized || typeof window === "undefined") return;
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
  });
  initialized = true;
}

export function captureError(error: unknown, context: Record<string, unknown> = {}) {
  if (!initialized) return;
  Sentry.captureException(error, { extra: context });
}
