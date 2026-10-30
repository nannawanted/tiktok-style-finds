// Vues des looks. Le comptage et les protections anti-fausses vues se font sur le serveur
// (fonction record_post_view) : 1 vue max toutes les 30 min par personne et par look,
// plafonds par heure, robots ignorés, le créateur ne compte pas ses propres vues.

/** Identifiant anonyme de ce navigateur (aucune donnée personnelle). */
export function deviceId(): string {
  try {
    let id = localStorage.getItem("wf_device");
    if (!id || !/^[A-Za-z0-9-]{16,64}$/.test(id)) {
      id = crypto.randomUUID();
      localStorage.setItem("wf_device", id);
    }
    return id;
  } catch {
    return crypto.randomUUID(); // navigation privée : la limite par connexion protège quand même
  }
}

/** 1 234 → « 1,2 k », comme sur TikTok / Instagram. */
export function compactCount(n: number, locale = "fr"): string {
  return new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

// Page d'où vient le visiteur (pour « D'où viennent les vues »), sans rien enregistrer d'autre.
let previousHref: string | null = null;
let currentHref: string | null = null;

/** Appelé à chaque changement de page. */
export function rememberPage(href: string) {
  if (href === currentHref) return;
  previousHref = currentHref;
  currentHref = href;
}

/** feed | search | profile | external | other */
export function viewSource(): "feed" | "search" | "profile" | "external" | "other" {
  // La page d'avant = la dernière page mémorisée qui n'est pas la page actuelle
  const here = window.location.pathname + window.location.search;
  const before = currentHref && currentHref !== here ? currentHref : previousHref;
  if (!before) {
    // Arrivée directe sur le look : lien partagé, lien dans une bio TikTok/Insta…
    try {
      if (document.referrer && new URL(document.referrer).host !== window.location.host) return "external";
    } catch {
      /* ignore */
    }
    return "external";
  }
  const u = new URL(before, "https://x");
  if (u.pathname.startsWith("/@")) return "profile";
  if (u.pathname === "/explorer" && u.searchParams.get("q")) return "search";
  if (u.pathname === "/" || u.pathname === "/explorer" || u.pathname === "/enregistres") return "feed";
  return "other";
}
