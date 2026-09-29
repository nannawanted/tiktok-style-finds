import { createFileRoute } from "@tanstack/react-router";

// Route de test temporaire pour vérifier que Sentry capture bien les erreurs
// côté serveur. À supprimer une fois la vérification faite.
export const Route = createFileRoute("/api/sentry-example")({
  server: {
    handlers: {
      GET: () => {
        throw new Error("Sentry Example Route Error");
      },
    },
  },
});
