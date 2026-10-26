import { supabase } from "@/integrations/supabase/client";
import { cleanStyles, type StyleKey } from "./styles";

// Lectures publiques (aucune donnée privée). Ces fonctions tournent aussi bien
// sur le serveur (pages fabriquées côté serveur, pour Google et les aperçus de
// liens) que dans le navigateur.

export type OutfitCard = {
  id: string;
  title: string;
  cover_image: string | null;
  creator_username: string;
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
  const [byTitle, byPiece] = await Promise.all([
    supabase.from("posts").select("id").ilike("title", `%${q}%`).limit(limit),
    supabase.from("products").select("post_id").or(`name.ilike.%${q}%,brand.ilike.%${q}%`).limit(limit * 2),
  ]);
  const ids = [...new Set([...(byTitle.data ?? []).map((r) => r.id), ...(byPiece.data ?? []).map((r) => r.post_id)])];
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
    .select("id, title, cover_image, tiktok_url, creator_id, creator_username, styles, created_at")
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
    post: { ...post, styles: cleanStyles(post.styles) },
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
