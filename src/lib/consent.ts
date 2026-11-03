// Choix cookies du visiteur, par type (règles de l'Autorité de protection des données belge :
// accord séparé par type de cookie, refus aussi simple qu'accepter, retrait possible à tout moment).
// Format du cookie wf_consent : « s1a0 » = statistiques oui, suivi des achats non.
// Un ancien choix (« true » / « false ») ne vaut plus : le bandeau est redemandé.

export const CONSENT_COOKIE = "wf_consent";
export type Consent = { stats: boolean; aff: boolean };

export function parseConsent(raw: string | null | undefined): Consent | null {
  const m = /^s([01])a([01])$/.exec(raw ?? "");
  return m ? { stats: m[1] === "1", aff: m[2] === "1" } : null;
}

export function formatConsent(c: Consent): string {
  return `s${c.stats ? 1 : 0}a${c.aff ? 1 : 0}`;
}

/** Choix enregistré dans ce navigateur (null = pas encore choisi). */
export function readConsent(): Consent | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.split("; ").find((c) => c.startsWith(`${CONSENT_COOKIE}=`));
  return parseConsent(match?.split("=")[1]);
}
