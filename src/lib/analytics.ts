// Statistiques du SITE (visiteurs, pages vues, provenance, appareils) avec PostHog,
// hébergé en Europe. Ne s'active que si la clé VITE_POSTHOG_KEY est configurée sur Vercel.
//
// Vie privée :
//  - sans consentement au bandeau cookies : AUCUN cookie, rien n'est gardé dans le navigateur
//    (chaque visite est comptée sans pouvoir être reliée à la suivante) ;
//  - avec consentement : PostHog peut reconnaître un visiteur qui revient ;
//  - jamais d'enregistrement d'écran, jamais de nom/e-mail envoyé ;
//  - « Ne pas me suivre » du navigateur respecté.
// Les clics vers les marques et les stats créateurs restent dans NOTRE base (preuve pour les marques).

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
const POSTHOG_HOST = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) || "https://eu.i.posthog.com";
const POSTHOG_LIB = "https://cdn.jsdelivr.net/npm/posthog-js@1.160.0/dist/module.js";

type PostHog = {
  init: (key: string, opts: Record<string, unknown>) => void;
  capture: (event: string, props?: Record<string, unknown>) => void;
  set_config: (opts: Record<string, unknown>) => void;
};

let client: Promise<PostHog | null> | null = null;

function hasConsent() {
  return typeof document !== "undefined" && document.cookie.split("; ").includes("wf_consent=true");
}

function load(): Promise<PostHog | null> {
  if (!POSTHOG_KEY || typeof window === "undefined") return Promise.resolve(null);
  client ??= (async () => {
    try {
      const mod = (await import(/* @vite-ignore */ POSTHOG_LIB)) as { default: PostHog };
      const ph = mod.default;
      ph.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        persistence: hasConsent() ? "localStorage+cookie" : "memory",
        capture_pageview: false, // pages comptées à chaque changement de page (site à une seule page)
        capture_pageleave: true,
        disable_session_recording: true,
        person_profiles: "identified_only",
        respect_dnt: true,
      });
      return ph;
    } catch (e) {
      console.warn("[analytics] PostHog indisponible", e);
      return null;
    }
  })();
  return client;
}

/** Une page vue (appelé à chaque changement de page). */
export function trackPageview(path: string) {
  void load().then((ph) => ph?.capture("$pageview", { $current_url: window.location.origin + path }));
}

/** Un événement important (ex. : look publié, pièce cliquée). Jamais de donnée personnelle dedans. */
export function track(event: string, props?: Record<string, string | number | boolean | null>) {
  void load().then((ph) => ph?.capture(event, props));
}

/** Le visiteur vient de répondre au bandeau cookies. */
export function applyConsent(accepted: boolean) {
  void load().then((ph) => ph?.set_config({ persistence: accepted ? "localStorage+cookie" : "memory" }));
}
