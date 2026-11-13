// Recherche dans les looks d'UN créateur (barre de recherche de sa page).
// Tout se passe dans le navigateur : les looks du créateur et leurs pièces sont
// chargés une fois, puis chaque lettre tapée donne les résultats instantanément
// (comme la recherche dans un profil Instagram / la recherche Pinterest).
//
// On cherche partout : marque, nom de la pièce, description, titre, hashtags,
// styles, ce que l'IA voit sur la photo (couleurs, vêtements, motifs), numéro de look.
// Accents, majuscules, pluriels, synonymes (baskets = sneakers) et fautes de frappe
// (« zaar » → Zara, « blazr » → blazer) sont tolérés.

import { supabase } from "@/integrations/supabase/client";
import {
  normalizeText,
  searchGroups,
  VISUAL_CONCEPTS,
  detectVisualConcepts,
  conceptLabel,
  displayWord,
} from "@/lib/visual-concepts";

export type LookIndexEntry = {
  id: string;
  lookNumber: number | null;
  tags: string[];
  visualTags: string[];
  products: { name: string; brand: string | null; description: string | null }[];
};

type Raw = {
  id: string;
  look_number?: number | null;
  tags?: string[] | null;
  visual_tags?: string[] | null;
  products?: { name: string | null; brand: string | null; description?: string | null }[] | null;
};

/** Les looks du créateur avec leurs pièces. Fonctionne aussi avant la mise à jour de la base (sans numéros). */
export async function fetchProfileIndex(creatorId: string): Promise<LookIndexEntry[]> {
  const attempts = [
    "id, look_number, tags, visual_tags, products(name, brand, description)",
    "id, tags, visual_tags, products(name, brand, description)",
    "id, tags, products(name, brand)",
  ];
  for (const cols of attempts) {
    const { data, error } = await supabase
      .from("posts")
      .select(cols as "id")
      .eq("creator_id", creatorId)
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) continue;
    return ((data ?? []) as unknown as Raw[]).map((r) => ({
      id: r.id,
      lookNumber: typeof r.look_number === "number" ? r.look_number : null,
      tags: r.tags ?? [],
      visualTags: r.visual_tags ?? [],
      products: (r.products ?? []).map((p) => ({
        name: p.name ?? "",
        brand: p.brand ?? null,
        description: p.description ?? null,
      })),
    }));
  }
  return [];
}

/** Le look le plus ouvert en ce moment sur ce profil (null s'il n'y a pas de vrai buzz). */
export async function fetchCreatorBuzz(creatorId: string): Promise<string | null> {
  const { data, error } = await supabase.rpc(
    "creator_buzz" as never,
    { p_creator: creatorId } as never,
  );
  if (error) return null;
  const row = ((data ?? []) as unknown as { post_id: string }[])[0];
  return row?.post_id ?? null;
}

/** Enregistre l'ouverture d'un look (sert à trouver le look « En ce moment »). Silencieux si indisponible. */
export function logLookOpen(postId: string, device: string | null) {
  void supabase.rpc("log_look_open" as never, { p_post: postId, p_device: device } as never).then(
    () => undefined,
    () => undefined,
  );
}

// ——— Moteur de recherche ———

type Field = { text: string; words: string[]; weight: number; label?: string };
type Doc = {
  id: string;
  lookNumber: number | null;
  fields: Field[];
  all: string;
  compact: string;
  recency: number;
};

export type SearchableLook = { id: string; title: string; styles: string[]; styleLabels: string[] };

const W = { brand: 6, name: 5, title: 4, tag: 4, visual: 3, style: 3, description: 1.5 };

function field(raw: string, weight: number, label?: string): Field {
  const text = normalizeText(raw);
  return { text, words: text.split(" ").filter(Boolean), weight, label };
}

function conceptWords(key: string): string {
  const c = VISUAL_CONCEPTS.find((x) => x.key === key);
  return c ? c.words.join(" ") : key.replace(/-/g, " ");
}

/** Prépare les looks pour la recherche (à faire une fois). `looks` est dans l'ordre d'affichage (récent d'abord). */
export function buildIndex(looks: SearchableLook[], index: LookIndexEntry[]): Doc[] {
  const byId = new Map(index.map((e) => [e.id, e]));
  return looks.map((look, i) => {
    const e = byId.get(look.id);
    const fields: Field[] = [field(look.title, W.title)];
    for (const p of e?.products ?? []) {
      const label = [p.name, p.brand].filter(Boolean).join(" · ");
      if (p.brand) {
        fields.push(field(p.brand, W.brand, label));
        // « Pull&Bear » se tape aussi « pull and bear » / « pullandbear »
        if (p.brand.includes("&"))
          fields.push(field(p.brand.replace(/&/g, " and "), W.brand, label));
      }
      if (p.name) fields.push(field(p.name, W.name, label));
      if (p.description) fields.push(field(p.description, W.description, label));
    }
    for (const tag of e?.tags ?? []) fields.push(field(tag.replace(/_/g, " "), W.tag));
    for (const s of [...look.styles, ...look.styleLabels])
      fields.push(field(s.replace(/-/g, " "), W.style));
    for (const v of e?.visualTags ?? []) fields.push(field(conceptWords(v), W.visual));
    const all = fields.map((f) => f.text).join(" ");
    return {
      id: look.id,
      lookNumber: e?.lookNumber ?? null,
      fields,
      all,
      compact: all.replace(/ /g, ""),
      recency: looks.length - i,
    };
  });
}

/** Distance de frappe (lettres en trop, en moins, remplacées ou inversées). */
function typoDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const prev2 = new Array(b.length + 1).fill(0);
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1])
        v = Math.min(v, prev2[j - 2] + 1);
      cur.push(v);
      rowMin = Math.min(rowMin, v);
    }
    if (rowMin > max) return max + 1;
    for (let j = 0; j <= b.length; j++) prev2[j] = prev[j];
    prev = cur;
  }
  return prev[b.length];
}

/** Qualité de la correspondance entre un mot cherché et un mot du look (0 = rien). */
function wordMatch(q: string, w: string, isLast: boolean): number {
  if (w === q) return 1;
  if (w.length > q.length && w.startsWith(q)) return q.length >= 3 || isLast ? 0.85 : 0; // en cours de frappe, pluriels
  if (q.length > w.length && q.startsWith(w) && w.length >= 4 && q.length - w.length <= 2)
    return 0.8; // « vestes » → veste
  if (q.length >= 4 && w.length >= 3) {
    const max = q.length >= 8 ? 2 : 1;
    if (typoDistance(q, w, max) <= max) return 0.6;
  }
  return 0;
}

function groupScore(doc: Doc, alts: string[], isLast: boolean): { score: number; label?: string } {
  let best = 0;
  let label: string | undefined;
  for (const alt of alts) {
    if (alt.includes(" ")) {
      // expression (« veste en cuir », « pull and bear »)
      for (const f of doc.fields) {
        if (f.text.includes(alt) && f.weight > best) {
          best = f.weight;
          label = f.label;
        }
      }
      continue;
    }
    for (const f of doc.fields) {
      for (const w of f.words) {
        const m = wordMatch(alt, w, isLast);
        if (m && m * f.weight > best) {
          best = m * f.weight;
          label = f.label;
        }
      }
      // marque collée (« pullandbear », « newbalance », « hm »)
      const glued = f.weight === W.brand ? f.text.replace(/ /g, "") : "";
      if (
        glued &&
        (glued === alt || (alt.length >= 5 && glued.startsWith(alt))) &&
        f.weight * 0.9 > best
      ) {
        best = f.weight * 0.9;
        label = f.label;
      }
    }
  }
  return { score: best, label };
}

export type SearchResult = { id: string; score: number; note?: string };

const LOOK_NUMBER = /^(?:look|tenue|n|no|num|numero)?\s*#?\s*(\d{1,4})$/;

/**
 * Cherche dans les looks. Renvoie d'abord les looks qui contiennent TOUS les mots,
 * puis (`partial: true`) ceux qui s'en rapprochent le plus s'il n'y en a aucun.
 */
export function searchLooks(
  docs: Doc[],
  rawQuery: string,
): { results: SearchResult[]; partial: boolean; lookNumber: number | null } {
  const q = normalizeText(rawQuery);
  if (!q) return { results: [], partial: false, lookNumber: null };

  const num = q.match(LOOK_NUMBER);
  if (num) {
    const n = Number(num[1]);
    const hit = docs.find((d) => d.lookNumber === n);
    if (hit) return { results: [{ id: hit.id, score: 100 }], partial: false, lookNumber: n };
  }

  const groups = searchGroups(rawQuery).map((g) => g.split("|").filter(Boolean));
  if (!groups.length) groups.push([q]);
  const lastIdx = groups.length - 1;

  const scored = docs.map((d) => {
    let total = 0;
    let matched = 0;
    const notes: string[] = [];
    groups.forEach((alts, gi) => {
      const { score, label } = groupScore(d, alts, gi === lastIdx);
      if (score > 0) {
        matched++;
        total += score;
        if (label && !notes.includes(label)) notes.push(label);
      }
    });
    // bonus : toute la recherche apparaît telle quelle
    if (q.length >= 3 && (d.all.includes(q) || d.compact.includes(q.replace(/ /g, "")))) total += 2;
    return { id: d.id, matched, score: total + d.recency / 10000, note: notes[0] };
  });

  const full = scored.filter((s) => s.matched === groups.length).sort((a, b) => b.score - a.score);
  if (full.length || groups.length === 1) {
    return {
      results: full.map(({ id, score, note }) => ({ id, score, note })),
      partial: false,
      lookNumber: null,
    };
  }
  const near = scored
    .filter((s) => s.matched > 0)
    .sort((a, b) => b.matched - a.matched || b.score - a.score)
    .slice(0, 30);
  return {
    results: near.map(({ id, score, note }) => ({ id, score, note })),
    partial: near.length > 0,
    lookNumber: null,
  };
}

/** Marques présentes dans les looks du créateur, les plus fréquentes d'abord (puces sous la barre). */
export function topBrands(index: LookIndexEntry[], limit = 8): { label: string; count: number }[] {
  const counts = new Map<string, { label: string; looks: Set<string> }>();
  for (const e of index) {
    for (const p of e.products) {
      const b = p.brand?.trim();
      if (!b) continue;
      const key = normalizeText(b);
      if (!key) continue;
      const cur = counts.get(key) ?? { label: b, looks: new Set<string>() };
      cur.looks.add(e.id);
      counts.set(key, cur);
    }
  }
  return [...counts.values()]
    .map((c) => ({ label: c.label, count: c.looks.size }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, limit);
}

/** Types de pièces présents (veste, jean, baskets…), d'après les noms des pièces. */
export function topItems(index: LookIndexEntry[], limit = 8): { label: string; count: number }[] {
  const counts = new Map<string, Set<string>>();
  for (const e of index) {
    for (const p of e.products) {
      for (const key of detectVisualConcepts(p.name)) {
        const c = VISUAL_CONCEPTS.find((x) => x.key === key);
        if (!c || c.category !== "item") continue;
        const set = counts.get(key) ?? new Set<string>();
        set.add(e.id);
        counts.set(key, set);
      }
    }
  }
  return [...counts.entries()]
    .map(([key, looks]) => ({ label: conceptLabel(key), count: looks.size }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/** Propositions pendant la frappe, prises dans le vocabulaire du créateur (« za » → Zara). */
export function completions(index: LookIndexEntry[], rawQuery: string, limit = 6): string[] {
  const q = normalizeText(rawQuery);
  if (q.length < 2) return [];
  const seen = new Set<string>();
  const out: { label: string; prio: number }[] = [];
  const add = (label: string, prio: number) => {
    const n = normalizeText(label);
    if (!n || n === q || seen.has(n)) return;
    if (!(n.startsWith(q) || n.split(" ").some((w) => w.startsWith(q)))) return;
    seen.add(n);
    out.push({ label, prio: prio + (n.startsWith(q) ? 0 : 1) });
  };
  for (const b of topBrands(index, 50)) add(b.label, 0);
  for (const it of topItems(index, 50)) add(it.label, 1);
  for (const e of index)
    for (const p of e.products)
      for (const w of normalizeText(p.name).split(" ")) if (w.length >= 3) add(displayWord(w), 2);
  return out
    .sort((a, b) => a.prio - b.prio || a.label.length - b.label.length)
    .map((o) => o.label)
    .slice(0, limit);
}
