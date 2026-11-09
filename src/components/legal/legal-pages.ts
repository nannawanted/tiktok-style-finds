import type { TKey } from "@/lib/i18n";
import { PUBLISHER_NAME } from "@/lib/legal";

export type LegalPath = "/conditions" | "/confidentialite" | "/cookies" | "/regles" | "/droits-auteur" | "/dsa" | "/mentions-legales";

/** Toutes les pages du centre juridique (organisation inspirée de policy.pinterest.com). */
export const LEGAL_PAGES: { to: LegalPath; title: TKey; desc: TKey; visible: boolean }[] = [
  { to: "/conditions", title: "legal.pTerms", desc: "legal.dTerms", visible: true },
  { to: "/regles", title: "legal.pRules", desc: "legal.dRules", visible: true },
  { to: "/confidentialite", title: "legal.pPrivacy", desc: "legal.dPrivacy", visible: true },
  { to: "/cookies", title: "legal.pCookies", desc: "legal.dCookies", visible: true },
  { to: "/droits-auteur", title: "legal.pIp", desc: "legal.dIp", visible: true },
  { to: "/dsa", title: "legal.pDsa", desc: "legal.dDsa", visible: true },
  // Mentions légales : affichées dès que le nom du responsable est renseigné (src/lib/legal.ts)
  { to: "/mentions-legales", title: "legal.pImprint", desc: "legal.dImprint", visible: !!PUBLISHER_NAME },
];
