import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { trackPageview } from "@/lib/analytics";

/** Compte une page vue dans PostHog à chaque changement de page. */
export function AnalyticsTracker() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => {
    trackPageview(path);
  }, [path]);
  return null;
}
