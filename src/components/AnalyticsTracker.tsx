import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { trackPageview } from "@/lib/analytics";
import { rememberPage } from "@/lib/views";

/** Compte une page vue dans PostHog à chaque changement de page. */
export function AnalyticsTracker() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const href = useRouterState({ select: (s) => s.location.href });
  useEffect(() => {
    trackPageview(path);
  }, [path]);
  // Mémorise la page précédente (pour savoir d'où viennent les vues d'un look)
  useEffect(() => {
    rememberPage(href);
  }, [href]);
  return null;
}
