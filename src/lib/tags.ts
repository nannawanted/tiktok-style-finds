// Hashtags des tenues : minuscules, sans accents, lettres/chiffres/_ (30 max),
// 10 par tenue. Doit rester identique à public.is_valid_tag_list.
export const MAX_TAGS = 10;

export function normalizeTag(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/^#+/, "")
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 30);
}

/** Découpe un texte (« #look, vintage paris ») en hashtags propres. */
export function parseTags(input: string): string[] {
  return input
    .split(/[\s,;#]+/)
    .map(normalizeTag)
    .filter(Boolean);
}

export function cleanTags(list: readonly unknown[] | null | undefined): string[] {
  const out: string[] = [];
  for (const v of list ?? []) {
    if (typeof v !== "string") continue;
    const tg = normalizeTag(v);
    if (tg && !out.includes(tg)) out.push(tg);
    if (out.length >= MAX_TAGS) break;
  }
  return out;
}
