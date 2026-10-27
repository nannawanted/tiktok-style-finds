import type { TKey } from "./i18n";

// Liste fermée des styles. Doit rester identique à la fonction SQL
// public.is_valid_style_list (sinon la base refuse l'enregistrement).
export const STYLE_KEYS = [
  "streetwear",
  "clean-girl",
  "old-money",
  "y2k",
  "minimal",
  "soiree",
  "casual",
  "sport",
  "vintage",
  "chic",
  "preppy",
  "boheme",
  "grunge",
  "gorpcore",
  "techwear",
  "coquette",
  "skate",
  "workwear",
  "rock",
  "ceremonie",
] as const;

export type StyleKey = (typeof STYLE_KEYS)[number];

export const MAX_STYLES = 5;

export function isStyleKey(v: unknown): v is StyleKey {
  return typeof v === "string" && (STYLE_KEYS as readonly string[]).includes(v);
}

export function styleLabelKey(s: StyleKey): TKey {
  return `styles.${s}` as TKey;
}

/** Garde uniquement les styles connus, sans doublon, 5 maximum. */
export function cleanStyles(list: readonly unknown[] | null | undefined): StyleKey[] {
  const out: StyleKey[] = [];
  for (const v of list ?? []) {
    if (isStyleKey(v) && !out.includes(v)) out.push(v);
    if (out.length >= MAX_STYLES) break;
  }
  return out;
}
