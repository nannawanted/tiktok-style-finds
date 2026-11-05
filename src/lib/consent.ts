// Choix cookies du visiteur, par type (règles de l'Autorité de protection des données belge :
// accord séparé par type de cookie, refus aussi simple qu'accepter, retrait possible à tout moment).
// Format du cookie wf_consent : « s1a0 » = statistiques oui, suivi des achats non (v1) ; « 2s1a0 » en v2.
// Un ancien choix (« true » / « false ») ne vaut plus : le bandeau est redemandé.

import { AFFILIATE_ENABLED } from "@/lib/features";

export const CONSENT_COOKIE = "wf_consent";
/**
 * Version des choix proposés : quand un nouveau type de cookie apparaît (ex. « Suivi des achats » au retour
 * de l'affiliation), l'ancien choix ne vaut plus et le bandeau est redemandé à tout le monde.
 * v1 = statistiques seulement ; v2 = statistiques + suivi des achats.
 */
const CONSENT_VERSION = AFFILIATE_ENABLED ? 2 : 1;
export type Consent = { stats: boolean; aff: boolean };

export function parseConsent(raw: string | null | undefined): Consent | null {
  const m = /^(\d*)s([01])a([01])$/.exec(raw ?? "");
  if (!m || Number(m[1] || "1") !== CONSENT_VERSION) return null;
  return { stats: m[2] === "1", aff: m[3] === "1" };
}

export function formatConsent(c: Consent): string {
  return `${CONSENT_VERSION > 1 ? CONSENT_VERSION : ""}s${c.stats ? 1 : 0}a${c.aff ? 1 : 0}`;
}

/** Choix enregistré dans ce navigateur (null = pas encore choisi). */
export function readConsent(): Consent | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.split("; ").find((c) => c.startsWith(`${CONSENT_COOKIE}=`));
  return parseConsent(match?.split("=")[1]);
}
