import { createFileRoute, redirect } from "@tanstack/react-router";

// Ancienne adresse des profils : on redirige vers la nouvelle adresse courte
// /@pseudo, pour que les liens déjà partagés continuent de marcher.
export const Route = createFileRoute("/creator/$username")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/@{$username}", params: { username: params.username }, statusCode: 301 });
  },
});
