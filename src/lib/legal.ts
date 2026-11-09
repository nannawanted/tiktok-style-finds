import { AFFILIATE_ENABLED } from "@/lib/features";

/** Version des conditions d'utilisation en vigueur (= date de dernière mise à jour affichée sur /conditions). */
export const TERMS_VERSION = "2026-11-10";
/** Date affichée en haut des pages juridiques. */
export const LEGAL_UPDATED = "10 novembre 2026";

/**
 * Responsable du site (éditeur) — affiché dans les mentions légales, la confidentialité et les conditions.
 * null tant que le nom n'a pas été décidé : la page « Mentions légales » reste alors masquée.
 */
export const PUBLISHER_NAME: string | null = null;

/**
 * Changement important qui demande une nouvelle acceptation explicite (ex. : retour de l'affiliation).
 * Modèle : engagements de WhatsApp devant les autorités européennes (2023) — résumé clair, « Accepter » et
 * « Refuser » aussi visibles l'un que l'autre, conséquences du refus expliquées, possibilité de choisir plus tard.
 *
 * Le jour où l'affiliation revient :
 *  1. au moins 30 jours avant : e-mail + notification aux inscrits avec le résumé (règlement P2B : 15 jours minimum) ;
 *  2. mettre TERMS_VERSION et la date des conditions au jour d'entrée en vigueur, et TERMS_EFFECTIVE_DATE au même jour ;
 *  3. passer AFFILIATE_ENABLED à true (src/lib/features.ts).
 */
export const TERMS_REACCEPT_REQUIRED = AFFILIATE_ENABLED;
/** Jusqu'à cette date, l'utilisateur peut choisir « Plus tard ». */
export const TERMS_EFFECTIVE_DATE = TERMS_VERSION;
