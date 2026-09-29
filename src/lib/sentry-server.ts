import * as Sentry from "@sentry/tanstackstart-react";

// Surveillance des erreurs côté serveur (SSR, fonctions serveur). Reste
// silencieux (aucun appel réseau) tant qu'aucun DSN n'est configuré, donc pas
// d'impact en développement local. Réutilise VITE_SENTRY_DSN si SENTRY_DSN
// n'est pas défini séparément côté Vercel — un seul secret à gérer.
let initialized = false;

export function initServerSentry() {
  if (initialized) return;
  const dsn = process.env.SENTRY_DSN ?? process.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
  });
  initialized = true;
}

export function captureServerError(error: unknown, context: Record<string, unknown> = {}) {
  if (!initialized) return;
  Sentry.captureException(error, { extra: context });
}
