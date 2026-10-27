import { supabase } from "@/integrations/supabase/client";
import { STYLE_KEYS, cleanStyles, type StyleKey } from "./styles";
import { cleanTags, normalizeTag } from "./tags";

// Lectures publiques (aucune donnée privée). Ces fonctions tournent aussi bien
// sur le serveur (pages fabriquées côté serveur, pour Google et les aperçus de
// liens) que dans le navigateur.

export type OutfitCard = {
  id: string;
  title: string;
  cover_image: string | null;
  creator_username: string;
  creator_id?: string;
  creator_avatar: string | null;
  tiktok_url: string | null;
  styles: StyleKey[];
  pieceCount: number;
  likes: number;
};

export type CreatorCard = {
  id: string;
  username: string;
  bio: string | null;
  profile_image: string | null;
  banner_image: string | null;
  styles: StyleKey[];
  tiktok_url: string | null;
  instagram_url: string | null;
};

const OUTFIT_COLUMNS = "id, title, cover_image, creator_username, creator_id, tiktok_url, styles, views, created_at, products(id)";

type RawOutfit = {
  id: string;
  creator_id?: string;
  title: string;
  cover_image: string | null;
  creator_username: string;
  tiktok_url: string | null;
  styles: string[] | null;
  products: { id: string }[] | null;
};

/** Nettoie une recherche tapée par un visiteur (caractères spéciaux de l'API retirés). */
export function cleanQuery(q: unknown): string {
  if (typeof q !== "string") return "";
  return q.replace(/[,()%*\\:"'`]/g, " ").replace(/\s+/g, " ").trim().slice(0, 60);
}

function toCreatorCard(row: {
  id: string | null;
  username: string | null;
  bio: string | null;
  profile_image: string | null;
  banner_image: string | null;
  styles: string[] | null;
  tiktok_url: string | null;
  instagram_url: string | null;
}): CreatorCard | null {
  if (!row.id || !row.username) return null;
  return {
    id: row.id,
    username: row.username,
    bio: row.bio,
    profile_image: row.profile_image,
    banner_image: row.banner_image,
    styles: cleanStyles(row.styles),
    tiktok_url: row.tiktok_url,
    instagram_url: row.instagram_url,
  };
}

async function withAvatars(rows: RawOutfit[]): Promise<OutfitCard[]> {
  const names = [...new Set(rows.map((r) => r.creator_username))];
  const avatars = new Map<string, string | null>();
  const likes = new Map<string, number>();
  await Promise.all([
    names.length
      ? supabase
          .from("creators_public")
          .select("username, profile_image")
          .in("username", names)
          .then(({ data }) => {
            for (const c of data ?? []) if (c.username) avatars.set(c.username, c.profile_image);
          })
      : null,
    rows.length
      ? supabase.rpc("post_like_counts", { p_ids: rows.map((r) => r.id) }).then(({ data }) => {
          for (const l of data ?? []) likes.set(l.post_id, Number(l.likes));
        })
      : null,
  ]);
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    cover_image: r.cover_image,
    creator_username: r.creator_username,
    creator_id: r.creator_id,
    creator_avatar: avatars.get(r.creator_username) ?? null,
    tiktok_url: r.tiktok_url,
    styles: cleanStyles(r.styles),
    pieceCount: r.products?.length ?? 0,
    likes: likes.get(r.id) ?? 0,
  }));
}

/**
 * « Tenues du moment » : classées selon les cœurs reçus sur les 7 derniers
 * jours. S'il n'y en a pas assez, on complète avec les plus récentes.
 */
async function fetchTrendingOutfits(opts: { style?: StyleKey | null; limit: number; creatorIds?: string[]; excludeId?: string }) {
  const { data: ranked } = await supabase.rpc("trending_posts", { p_days: 7, p_limit: 100 });
  const order = (ranked ?? []).map((r) => r.post_id).filter((id) => id !== opts.excludeId);
  let top: OutfitCard[] = [];
  if (order.length) {
    let query = supabase.from("posts").select(OUTFIT_COLUMNS).in("id", order);
    if (opts.style) query = query.contains("styles", [opts.style]);
    if (opts.creatorIds) query = query.in("creator_id", opts.creatorIds);
    const { data } = await query;
    const pos = new Map(order.map((id, i) => [id, i]));
    top = (await withAvatars((data ?? []) as RawOutfit[])).sort((a, b) => (pos.get(a.id) ?? 0) - (pos.get(b.id) ?? 0)).slice(0, opts.limit);
  }
  if (top.length < opts.limit) {
    const recent = await fetchOutfits({ ...opts, sort: "latest", limit: opts.limit + top.length });
    for (const o of recent) if (top.length < opts.limit && !top.some((t) => t.id === o.id)) top.push(o);
  }
  return top;
}

export async function fetchOutfits(opts: {
  style?: StyleKey | null;
  sort?: "trending" | "latest";
  limit?: number;
  creatorIds?: string[];
  excludeId?: string;
}): Promise<OutfitCard[]> {
  let query = supabase.from("posts").select(OUTFIT_COLUMNS);
  if (opts.style) query = query.contains("styles", [opts.style]);
  if (opts.creatorIds) {
    if (opts.creatorIds.length === 0) return [];
    query = query.in("creator_id", opts.creatorIds);
  }
  if (opts.sort === "trending") {
    return fetchTrendingOutfits({ style: opts.style, limit: opts.limit ?? 30, creatorIds: opts.creatorIds, excludeId: opts.excludeId });
  }
  if (opts.excludeId) query = query.neq("id", opts.excludeId);
  query = query.order("created_at", { ascending: false });
  const { data, error } = await query.limit(opts.limit ?? 30);
  if (error) throw error;
  return withAvatars((data ?? []) as RawOutfit[]);
}

/** Tenues proches : mêmes styles d'abord, puis les plus récentes pour compléter. */
export async function fetchSimilarOutfits(id: string, styles: StyleKey[], limit = 6): Promise<OutfitCard[]> {
  let found: OutfitCard[] = [];
  if (styles.length) {
    const { data } = await supabase
      .from("posts")
      .select(OUTFIT_COLUMNS)
      .overlaps("styles", styles)
      .neq("id", id)
      .order("views", { ascending: false })
      .limit(limit);
    found = await withAvatars((data ?? []) as RawOutfit[]);
  }
  if (found.length < limit) {
    const more = await fetchOutfits({ sort: "latest", limit: limit + found.length + 1, excludeId: id });
    for (const o of more) if (found.length < limit && !found.some((f) => f.id === o.id)) found.push(o);
  }
  return found;
}

export async function fetchCreators(opts: { style?: StyleKey | null; q?: string; limit?: number }): Promise<CreatorCard[]> {
  let query = supabase
    .from("creators_public")
    .select("id, username, bio, profile_image, banner_image, styles, tiktok_url, instagram_url");
  if (opts.style) query = query.contains("styles", [opts.style]);
  const q = cleanQuery(opts.q);
  if (q) query = query.or(`username.ilike.%${q}%,bio.ilike.%${q}%`);
  const { data, error } = await query.order("created_at", { ascending: false }).limit(opts.limit ?? 48);
  if (error) throw error;
  return (data ?? []).map(toCreatorCard).filter((c): c is CreatorCard => c !== null);
}

/** Recherche des tenues par titre, ou par nom/marque d'une de leurs pièces. */
export async function searchOutfits(rawQ: string, style?: StyleKey | null, limit = 40): Promise<OutfitCard[]> {
  const q = cleanQuery(rawQ);
  if (!q) return fetchOutfits({ style, sort: "trending", limit });
  // « #vintage » ne cherche que dans les hashtags ; sinon titre, pièces, hashtags et styles
  const tagOnly = q.startsWith("#");
  const words = q.replace(/#/g, " ").trim();
  const tag = normalizeTag(words.replace(/\s+/g, ""));
  const styleMatch = STYLE_KEYS.filter((k) => normalizeTag(k) === tag || normalizeTag(k.replace(/-/g, "")) === tag);
  const [byTitle, byPiece, byTag, byStyle] = await Promise.all([
    tagOnly || !words ? null : supabase.from("posts").select("id").ilike("title", `%${words}%`).limit(limit),
    tagOnly || !words ? null : supabase.from("products").select("post_id").or(`name.ilike.%${words}%,brand.ilike.%${words}%`).limit(limit * 2),
    tag ? supabase.rpc("posts_by_tag" as never, { p_q: tag, p_limit: limit } as never) : null,
    !tagOnly && styleMatch.length ? supabase.from("posts").select("id").overlaps("styles", styleMatch).limit(limit) : null,
  ]);
  const ids = [
    ...new Set([
      ...((byTag?.data ?? []) as { id: string }[]).map((r) => r.id),
      ...(byTitle?.data ?? []).map((r) => r.id),
      ...(byPiece?.data ?? []).map((r) => r.post_id),
      ...(byStyle?.data ?? []).map((r) => r.id),
    ]),
  ];
  if (!ids.length) return [];
  let query = supabase.from("posts").select(OUTFIT_COLUMNS).in("id", ids.slice(0, 100));
  if (style) query = query.contains("styles", [style]);
  const { data, error } = await query.order("views", { ascending: false }).limit(limit);
  if (error) throw error;
  return withAvatars((data ?? []) as RawOutfit[]);
}

export type OutfitDetail = {
  post: {
    id: string;
    title: string;
    cover_image: string | null;
    tiktok_url: string | null;
    creator_id: string;
    creator_username: string;
    styles: StyleKey[];
    tags: string[];
    created_at: string | null;
  };
  products: {
    id: string;
    name: string;
    brand: string | null;
    price: string | null;
    image_url: string | null;
    affiliate_link: string;
  }[];
  creator: CreatorCard | null;
};

export async function fetchOutfit(id: string): Promise<OutfitDetail | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data: post, error } = await supabase
    .from("posts")
    .select("id, title, cover_image, tiktok_url, creator_id, creator_username, styles, tags, created_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!post) return null;
  const [{ data: products, error: e2 }, { data: creator }] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, brand, price, image_url, affiliate_link")
      .eq("post_id", id)
      .order("position", { ascending: true }),
    supabase
      .from("creators_public")
      .select("id, username, bio, profile_image, banner_image, styles, tiktok_url, instagram_url")
      .eq("id", post.creator_id)
      .maybeSingle(),
  ]);
  if (e2) throw e2;
  return {
    post: { ...post, styles: cleanStyles(post.styles), tags: cleanTags(post.tags) },
    products: products ?? [],
    creator: creator ? toCreatorCard(creator) : null,
  };
}

export async function fetchCreatorProfile(username: string): Promise<{ creator: CreatorCard; outfits: OutfitCard[] } | null> {
  const clean = username.toLowerCase();
  if (!/^[a-z0-9_.]{3,30}$/.test(clean)) return null;
  const { data: row, error } = await supabase
    .from("creators_public")
    .select("id, username, bio, profile_image, banner_image, styles, tiktok_url, instagram_url")
    .eq("username", clean)
    .maybeSingle();
  if (error) throw error;
  const creator = row ? toCreatorCard(row) : null;
  if (!creator) return null;
  const outfits = await fetchOutfits({ creatorIds: [creator.id], sort: "latest", limit: 60 });
  return { creator, outfits };
}

export async function fetchOutfitsByIds(ids: string[]): Promise<OutfitCard[]> {
  if (!ids.length) return [];
  const { data, error } = await supabase.from("posts").select(OUTFIT_COLUMNS).in("id", ids.slice(0, 200));
  if (error) throw error;
  const cards = await withAvatars((data ?? []) as RawOutfit[]);
  const order = new Map(ids.map((id, i) => [id, i]));
  return cards.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
}


// ——— Abonnements (publics, comme un compte Instagram public) ———

export async function fetchFollowCounts(creatorId: string) {
  const [followers, following] = await Promise.all([
    supabase.from("follows").select("creator_id", { count: "exact", head: true }).eq("creator_id", creatorId),
    supabase.from("follows").select("follower_id", { count: "exact", head: true }).eq("follower_id", creatorId),
  ]);
  return { followers: followers.count ?? 0, following: following.count ?? 0 };
}

async function creatorsByIds(ids: string[]): Promise<CreatorCard[]> {
  if (!ids.length) return [];
  const { data } = await supabase
    .from("creators_public")
    .select("id, username, bio, profile_image, banner_image, styles, tiktok_url, instagram_url")
    .in("id", ids.slice(0, 500));
  const pos = new Map(ids.map((id, i) => [id, i]));
  return (data ?? [])
    .map(toCreatorCard)
    .filter((c): c is CreatorCard => c !== null)
    .sort((a, b) => (pos.get(a.id) ?? 0) - (pos.get(b.id) ?? 0));
}

export async function fetchFollowers(creatorId: string): Promise<CreatorCard[]> {
  const { data } = await supabase.from("follows").select("follower_id").eq("creator_id", creatorId).order("created_at", { ascending: false }).limit(500);
  return creatorsByIds((data ?? []).map((r) => r.follower_id));
}

export async function fetchFollowing(userId: string): Promise<CreatorCard[]> {
  const { data } = await supabase.from("follows").select("creator_id").eq("follower_id", userId).order("created_at", { ascending: false }).limit(500);
  return creatorsByIds((data ?? []).map((r) => r.creator_id));
}

/** Suggestions « à suivre » : créateurs aux styles proches, puis les plus récents. */
export async function fetchSuggestions(opts: { styles: StyleKey[]; exclude: string[]; limit?: number }): Promise<CreatorCard[]> {
  const limit = opts.limit ?? 8;
  const exclude = new Set(opts.exclude);
  const pool: CreatorCard[] = [];
  const cols = "id, username, bio, profile_image, banner_image, styles, tiktok_url, instagram_url";
  if (opts.styles.length) {
    const { data } = await supabase.from("creators_public").select(cols).overlaps("styles", opts.styles).limit(60);
    for (const c of (data ?? []).map(toCreatorCard)) if (c && !exclude.has(c.id)) pool.push(c);
  }
  if (pool.length < limit) {
    const { data } = await supabase.from("creators_public").select(cols).order("created_at", { ascending: false }).limit(60);
    for (const c of (data ?? []).map(toCreatorCard)) if (c && !exclude.has(c.id) && !pool.some((p) => p.id === c.id)) pool.push(c);
  }
  return pool.slice(0, limit);
}

// ——— Fils infinis (pages successives) ———

export type FeedKind = "trending" | "latest" | "foryou" | "following";
export const FEED_PAGE = 24;

const memo = new Map<string, { at: number; value: unknown }>();
async function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const hit = memo.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return hit.value as T;
  const value = await fn();
  memo.set(key, { at: Date.now(), value });
  return value;
}

/** Tenues les plus récentes, en excluant éventuellement certaines (déjà affichées). */
async function fetchLatestRange(opts: { style?: StyleKey | null; creatorIds?: string[]; excludeIds?: string[]; from: number; count: number }) {
  if (opts.count <= 0) return [];
  let query = supabase.from("posts").select(OUTFIT_COLUMNS);
  if (opts.style) query = query.contains("styles", [opts.style]);
  if (opts.creatorIds) {
    if (!opts.creatorIds.length) return [];
    query = query.in("creator_id", opts.creatorIds);
  }
  if (opts.excludeIds?.length) query = query.not("id", "in", `(${opts.excludeIds.join(",")})`);
  const { data, error } = await query.order("created_at", { ascending: false }).range(opts.from, opts.from + opts.count - 1);
  if (error) throw error;
  return withAvatars((data ?? []) as RawOutfit[]);
}

/** Classement « Tendances » complet (cœurs des 7 derniers jours), gardé 1 minute en mémoire. */
async function trendingRanked(style?: StyleKey | null): Promise<OutfitCard[]> {
  return cached(`trending:${style ?? "all"}`, 60_000, async () => {
    const { data: ranked } = await supabase.rpc("trending_posts", { p_days: 7, p_limit: 100 });
    const order = (ranked ?? []).map((r) => r.post_id);
    if (!order.length) return [];
    let query = supabase.from("posts").select(OUTFIT_COLUMNS).in("id", order);
    if (style) query = query.contains("styles", [style]);
    const { data } = await query;
    const pos = new Map(order.map((id, i) => [id, i]));
    return (await withAvatars((data ?? []) as RawOutfit[])).sort((a, b) => (pos.get(a.id) ?? 0) - (pos.get(b.id) ?? 0));
  });
}

/** Tranche [from, from+count) du fil « Tendances » : classement de la semaine, puis les plus récentes. */
async function trendingRange(style: StyleKey | null | undefined, from: number, count: number): Promise<OutfitCard[]> {
  const ranked = await trendingRanked(style);
  const head = ranked.slice(from, from + count);
  if (head.length === count) return head;
  const rest = await fetchLatestRange({
    style,
    excludeIds: ranked.map((o) => o.id),
    from: Math.max(0, from - ranked.length),
    count: count - head.length,
  });
  return [...head, ...rest];
}

export type ForYouSignals = {
  interests: StyleKey[];
  followedIds: string[];
  likedStyles: Partial<Record<StyleKey, number>>;
};

const FOR_YOU_POOL = 120;

/** Score « Pour toi » : styles choisis, créateurs suivis, styles déjà likés, popularité, fraîcheur. */
function forYouScore(o: OutfitCard & { created_at?: string | null }, s: ForYouSignals, createdAt: Map<string, number>) {
  const interestHits = o.styles.filter((x) => s.interests.includes(x)).length;
  const likedHits = o.styles.reduce((sum, x) => sum + Math.min(s.likedStyles[x] ?? 0, 5), 0);
  const followed = s.followedIds.includes(o.creator_id ?? "") ? 1 : 0;
  const ageDays = (Date.now() - (createdAt.get(o.id) ?? Date.now())) / 86_400_000;
  return interestHits * 3 + likedHits * 0.6 + followed * 4 + Math.log2(1 + o.likes) - ageDays * 0.12;
}

export async function fetchFeedPage(opts: {
  kind: FeedKind;
  style?: StyleKey | null;
  page: number;
  creatorIds?: string[];
  signals?: ForYouSignals;
}): Promise<OutfitCard[]> {
  const from = opts.page * FEED_PAGE;
  if (opts.kind === "latest") return fetchLatestRange({ style: opts.style, from, count: FEED_PAGE });
  if (opts.kind === "following") return fetchLatestRange({ style: opts.style, creatorIds: opts.creatorIds ?? [], from, count: FEED_PAGE });

  if (opts.kind === "trending") return trendingRange(opts.style, from, FEED_PAGE);

  // « Pour toi » : on note les 120 tenues les plus récentes, puis on continue avec le reste
  const signals = opts.signals ?? { interests: [], followedIds: [], likedStyles: {} };
  const pool = await cached(`foryou-pool:${opts.style ?? "all"}`, 60_000, async () => {
    let query = supabase.from("posts").select(OUTFIT_COLUMNS);
    if (opts.style) query = query.contains("styles", [opts.style]);
    const { data } = await query.order("created_at", { ascending: false }).limit(FOR_YOU_POOL);
    const rows = (data ?? []) as (RawOutfit & { created_at: string | null })[];
    const cards = await withAvatars(rows);
    return { cards, createdAt: new Map(rows.map((r) => [r.id, r.created_at ? Date.parse(r.created_at) : Date.now()])) };
  });
  const sorted = [...pool.cards].sort((a, b) => forYouScore(b, signals, pool.createdAt) - forYouScore(a, signals, pool.createdAt));
  const head = sorted.slice(from, from + FEED_PAGE);
  if (head.length === FEED_PAGE || pool.cards.length < FOR_YOU_POOL) return head;
  return [...head, ...(await fetchLatestRange({ style: opts.style, from: FOR_YOU_POOL + Math.max(0, from - pool.cards.length), count: FEED_PAGE - head.length }))];
}

/** « Plus comme ça » : tenues partageant au moins un style, page par page. */
export async function fetchSimilarPage(id: string, styles: StyleKey[], page: number): Promise<OutfitCard[]> {
  if (!styles.length) return [];
  const from = page * FEED_PAGE;
  const { data, error } = await supabase
    .from("posts")
    .select(OUTFIT_COLUMNS)
    .overlaps("styles", styles)
    .neq("id", id)
    .order("created_at", { ascending: false })
    .range(from, from + FEED_PAGE - 1);
  if (error) throw error;
  return withAvatars((data ?? []) as RawOutfit[]);
}

/** Tenues qui partagent un style, puis la suite du fil « Tendances », à partir de la position `from`. */
async function styleBasedRange(id: string, styles: StyleKey[], from: number, count: number): Promise<OutfitCard[]> {
  const total = styles.length
    ? await cached(`similar-count:${id}`, 60_000, async () => {
        const { count: c } = await supabase.from("posts").select("id", { count: "exact", head: true }).overlaps("styles", styles).neq("id", id);
        return c ?? 0;
      })
    : 0;
  const out: OutfitCard[] = [];
  if (from < total) {
    const { data, error } = await supabase
      .from("posts")
      .select(OUTFIT_COLUMNS)
      .overlaps("styles", styles)
      .neq("id", id)
      .order("created_at", { ascending: false })
      .range(from, Math.min(from + count, total) - 1);
    if (error) throw error;
    out.push(...(await withAvatars((data ?? []) as RawOutfit[])));
  }
  if (out.length < count) out.push(...(await trendingRange(null, Math.max(0, from - total), count - out.length)));
  return out;
}

/**
 * Classement « Plus comme ça » calculé par la base (fonction more_like_this) :
 * ressemblance de la photo + styles en commun + popularité récente + fraîcheur.
 */
async function rankedSimilar(id: string): Promise<string[]> {
  return cached(`more-like-this:${id}`, 5 * 60_000, async () => {
    const { data, error } = await supabase.rpc("more_like_this" as never, { p_post: id, p_limit: 200 } as never);
    if (error) return [];
    return ((data ?? []) as { post_id: string }[]).map((r) => r.post_id);
  });
}

/**
 * « Plus comme ça » sans fin, comme Pinterest : d'abord les tenues les plus
 * proches (photo + styles), puis la suite du fil « Tendances ».
 * Si le classement est indisponible, on se rabat sur les styles en commun.
 */
export async function fetchMoreLikeThis(id: string, styles: StyleKey[], page: number): Promise<OutfitCard[]> {
  const ranked = await rankedSimilar(id);
  const from = page * FEED_PAGE;
  if (!ranked.length) return styleBasedRange(id, styles, from, FEED_PAGE);
  const out: OutfitCard[] = [];
  if (from < ranked.length) out.push(...(await fetchOutfitsByIds(ranked.slice(from, from + FEED_PAGE))));
  if (out.length < FEED_PAGE) {
    out.push(...(await trendingRange(null, Math.max(0, from - ranked.length), FEED_PAGE - out.length)));
  }
  return out;
}

// ——— Suggestions « Suivi par des personnes que tu suis » (comme Instagram) ———

export type SuggestedCreator = CreatorCard & { mutual?: { count: number; names: string[] } };

/**
 * Créateurs suivis par les personnes que je suis, classés par nombre
 * d'abonnements en commun. Exclut moi-même et ceux que je suis déjà.
 */
export async function fetchMutualSuggestions(userId: string, followedIds: string[], limit = 12): Promise<SuggestedCreator[]> {
  if (!followedIds.length) return [];
  const { data } = await supabase.from("follows").select("follower_id, creator_id").in("follower_id", followedIds.slice(0, 300)).limit(3000);
  const exclude = new Set([userId, ...followedIds]);
  const byCreator = new Map<string, string[]>();
  for (const row of data ?? []) {
    if (exclude.has(row.creator_id)) continue;
    const list = byCreator.get(row.creator_id) ?? [];
    list.push(row.follower_id);
    byCreator.set(row.creator_id, list);
  }
  const ranked = [...byCreator.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, limit);
  if (!ranked.length) return [];
  const viaIds = [...new Set(ranked.flatMap(([, via]) => via.slice(0, 2)))];
  const [cards, via] = await Promise.all([
    creatorsByIds(ranked.map(([id]) => id)),
    creatorsByIds(viaIds),
  ]);
  const viaName = new Map(via.map((c) => [c.id, c.username]));
  const mutual = new Map(ranked.map(([id, list]) => [id, list]));
  return cards.map((c) => {
    const list = mutual.get(c.id) ?? [];
    return { ...c, mutual: { count: list.length, names: list.slice(0, 2).map((id) => viaName.get(id)).filter((n): n is string => !!n) } };
  });
}
