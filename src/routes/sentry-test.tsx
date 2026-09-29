import { createFileRoute } from "@tanstack/react-router";
import * as Sentry from "@sentry/tanstackstart-react";

// Page de test temporaire pour vérifier que Sentry capture bien les erreurs
// front + back en production. Non liée dans la navigation. À supprimer une
// fois la vérification faite (avec api.sentry-example.tsx).
export const Route = createFileRoute("/sentry-test")({
  head: () => ({ meta: [{ title: "Test Sentry" }] }),
  component: SentryTestPage,
});

function SentryTestPage() {
  return (
    <main className="mx-auto max-w-md px-4 py-10 text-sm">
      <h1 className="mb-4 text-xl font-bold">Test Sentry</h1>
      <p className="mb-6 text-muted-foreground">
        Page temporaire. Chaque bouton déclenche une vraie erreur — vérifie ensuite dans Sentry (onglet Issues)
        qu'elle apparaît, puis dis-le-moi pour qu'on supprime cette page.
      </p>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          className="rounded bg-destructive px-4 py-2 font-medium text-destructive-foreground"
          onClick={() => {
            throw new Error("Sentry Test Error (front)");
          }}
        >
          Casser le front
        </button>

        <button
          type="button"
          className="rounded bg-destructive px-4 py-2 font-medium text-destructive-foreground"
          onClick={async () => {
            await Sentry.startSpan({ name: "Sentry test route", op: "test" }, async () => {
              const res = await fetch("/api/sentry-example");
              if (!res.ok) {
                throw new Error("Sentry Test Error (back, via fetch)");
              }
            });
          }}
        >
          Casser le back (/api/sentry-example)
        </button>
      </div>
    </main>
  );
}
