import { createServerFn } from "@tanstack/react-start";
import { checkLinkShape, isFashionText, isKnownFashionShop, type LinkProblem } from "@/lib/link-safety";

export type ProductMetadata = {
  name: string;
  image_url: string;
  price: string;
  brand: string;
};

const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const MICROLINK_PARAMS = {
  palette: "true",
  audio: "false",
  video: "false",
  iframe: "false",
} as const;

function parseHttpUrl(url: string): URL {
  const parsed = new URL(url);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("URL invalide");
  }
  return parsed;
}

function extractPrice(...texts: (string | undefined)[]): string {
  const combined = texts.filter(Boolean).join(" ");
  const patterns = [
    /(\d{1,3}(?:[.\s]\d{3})*[,.]\d{2})\s*€/,
    /€\s*(\d{1,3}(?:[.\s]\d{3})*[,.]\d{2})/,
    /(\d+[,.]\d{2})\s*(?:EUR|€)/i,
    /\$(\d+(?:\.\d{2})?)/,
    /£(\d+(?:\.\d{2})?)/,
  ];

  for (const pattern of patterns) {
    const match = combined.match(pattern);
    if (match) return match[0].trim();
  }
  return "";
}

function pickBestImage(images: string[]): string {
  const blocked = /favicon|\/flags?\/|logo|bimi|apple-touch|sprite|placeholder/i;
  return images.find((url) => !blocked.test(url)) ?? "";
}

function formatMicrolinkPrice(price: unknown, currency?: string): string {
  if (price == null || price === "") return "";
  const amount = String(price);
  return currency ? `${amount} ${currency}` : amount;
}

function getMicrolinkImage(
  image: { url?: string } | string | undefined,
): string {
  if (!image) return "";
  return typeof image === "string" ? image : (image.url ?? "");
}

function isUsefulProductMetadata(
  meta: ProductMetadata,
  sourceUrl: string,
): boolean {
  if (!meta.name && !meta.image_url) return false;

  let hostname = "";
  try {
    hostname = new URL(sourceUrl).hostname.replace(/^www\./, "");
  } catch {
    return Boolean(meta.name || meta.image_url);
  }

  const siteToken = hostname.split(".")[0]?.toLowerCase() ?? "";
  const normalizedName = meta.name.trim().toLowerCase();
  const normalizedBrand = meta.brand.trim().toLowerCase();

  if (
    normalizedName &&
    (normalizedName === siteToken ||
      normalizedName === normalizedBrand ||
      normalizedName === "support navigateur" ||
      normalizedName === "browser support")
  ) {
    return false;
  }

  if (meta.image_url && /flags|favicon|logo|bimi|\/icons?\//i.test(meta.image_url)) {
    return false;
  }

  return true;
}

function buildMicrolinkRequestUrl(
  targetUrl: string,
  options: { proxy?: boolean; withTargetHeaders?: boolean },
): string {
  const apiKey = process.env.MICROLINK_API_KEY;
  const params = new URLSearchParams({
    url: targetUrl,
    ...MICROLINK_PARAMS,
  });

  if (options.proxy) params.set("proxy", "true");

  if (options.withTargetHeaders && apiKey) {
    params.set("headers.user-agent", BROWSER_USER_AGENT);
    params.set(
      "headers.accept-language",
      "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
    );
    params.set(
      "headers.accept",
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    );
    params.set("headers.cache-control", "no-cache");
    params.set("headers.sec-fetch-dest", "document");
    params.set("headers.sec-fetch-mode", "navigate");
    params.set("headers.sec-fetch-site", "none");
    params.set("headers.upgrade-insecure-requests", "1");

    try {
      const origin = new URL(targetUrl).origin;
      params.set("headers.referer", `${origin}/`);
    } catch {
      // ignore invalid referer
    }
  }

  const base = apiKey ? "https://pro.microlink.io" : "https://api.microlink.io";
  return `${base}?${params.toString()}`;
}

type MicrolinkPayload = {
  status: string;
  statusCode?: number;
  code?: string;
  data?: {
    title?: string;
    description?: string;
    image?: { url?: string } | string;
    price?: number | string;
    currency?: string;
    publisher?: string;
    author?: string;
  };
};

function parseMicrolinkPayload(
  json: MicrolinkPayload,
  sourceUrl: string,
): ProductMetadata | null {
  if (json.status !== "success" || !json.data) return null;
  if (json.statusCode != null && json.statusCode >= 400) return null;

  const meta = json.data;
  const image = getMicrolinkImage(meta.image);
  const price =
    formatMicrolinkPrice(meta.price, meta.currency) ||
    extractPrice(meta.title, meta.description);

  const result: ProductMetadata = {
    name: meta.title?.trim() ?? "",
    image_url: pickBestImage(image ? [image] : []),
    price,
    brand: (meta.publisher ?? meta.author ?? "").trim(),
  };

  return isUsefulProductMetadata(result, sourceUrl) ? result : null;
}

async function fetchFromMicrolink(
  targetUrl: string,
): Promise<ProductMetadata | null> {
  const apiKey = process.env.MICROLINK_API_KEY;
  const requestHeaders: Record<string, string> = {
    Accept: "application/json",
    "User-Agent": BROWSER_USER_AGENT,
  };
  if (apiKey) requestHeaders["x-api-key"] = apiKey;

  const attempts: Array<{ proxy?: boolean; withTargetHeaders?: boolean }> = [
    { withTargetHeaders: Boolean(apiKey) },
    { proxy: true, withTargetHeaders: Boolean(apiKey) },
    { proxy: true, withTargetHeaders: false },
    { withTargetHeaders: false },
  ];

  const seen = new Set<string>();

  for (const attempt of attempts) {
    const requestUrl = buildMicrolinkRequestUrl(targetUrl, attempt);
    if (seen.has(requestUrl)) continue;
    seen.add(requestUrl);

    const res = await fetch(requestUrl, { headers: requestHeaders });
    if (!res.ok) continue;

    const json = (await res.json()) as MicrolinkPayload;
    if (json.code === "EPROXYNEEDED" && !attempt.proxy && apiKey) continue;

    const parsed = parseMicrolinkPayload(json, targetUrl);
    if (parsed) return parsed;
  }

  return null;
}

type JsonLinkPayload = {
  title?: string;
  description?: string;
  images?: string[];
  sitename?: string;
  domain?: string;
  error?: string;
  success?: boolean;
};

function parseJsonLinkPayload(
  json: JsonLinkPayload,
  sourceUrl: string,
): ProductMetadata | null {
  if (json.error || json.success === false) return null;

  const images = Array.isArray(json.images) ? json.images : [];
  const price = extractPrice(json.title, json.description);
  const brand = (json.sitename ?? json.domain ?? "").trim();

  const result: ProductMetadata = {
    name: json.title?.trim() ?? "",
    image_url: pickBestImage(images),
    price,
    brand,
  };

  return isUsefulProductMetadata(result, sourceUrl) ? result : null;
}

async function fetchFromJsonLink(
  targetUrl: string,
): Promise<ProductMetadata | null> {
  const params = new URLSearchParams({ url: targetUrl });
  const apiKey = process.env.JSONLINK_API_KEY;
  if (apiKey) params.set("api_key", apiKey);

  const res = await fetch(`https://jsonlink.io/api/extract?${params.toString()}`, {
    headers: {
      Accept: "application/json",
      "User-Agent": BROWSER_USER_AGENT,
    },
  });

  if (!res.ok) return null;

  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return null;

  const json = (await res.json()) as JsonLinkPayload;
  return parseJsonLinkPayload(json, targetUrl);
}

function formatPrice(amount: string | number, currency?: string): string {
  const n = typeof amount === "number" ? amount : Number(String(amount).replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return "";
  const cur = (currency ?? "EUR").toUpperCase();
  try {
    return new Intl.NumberFormat("fr-BE", { style: "currency", currency: cur }).format(n);
  } catch {
    return `${n.toFixed(2).replace(".", ",")} ${cur}`;
  }
}

/** Cherche un prix dans les données structurées d'une page produit (JSON-LD schema.org). */
function findJsonLdPrice(node: unknown): string {
  if (!node || typeof node !== "object") return "";
  if (Array.isArray(node)) {
    for (const n of node) {
      const p = findJsonLdPrice(n);
      if (p) return p;
    }
    return "";
  }
  const obj = node as Record<string, unknown>;
  const offers = obj.offers as Record<string, unknown> | Record<string, unknown>[] | undefined;
  for (const offer of Array.isArray(offers) ? offers : offers ? [offers] : []) {
    const amount = offer.price ?? offer.lowPrice ?? (offer.priceSpecification as Record<string, unknown> | undefined)?.price;
    const currency = (offer.priceCurrency ?? (offer.priceSpecification as Record<string, unknown> | undefined)?.priceCurrency) as string | undefined;
    if (amount != null && amount !== "") {
      const f = formatPrice(amount as string | number, currency);
      if (f) return f;
    }
  }
  for (const key of ["@graph", "mainEntity", "itemOffered"]) {
    const p = findJsonLdPrice(obj[key]);
    if (p) return p;
  }
  return "";
}

/**
 * Récupère le prix directement sur la page du produit, via les balises que
 * la plupart des boutiques remplissent (Shopify, WooCommerce, etc.) :
 * meta product:price:amount / og:price:amount, ou JSON-LD « Product ».
 * Les grands sites qui bloquent les robots (Zara, H&M…) ne répondent pas :
 * le créateur saisit alors le prix à la main.
 */
async function fetchPriceFromPage(targetUrl: string): Promise<string> {
  // Sécurité : uniquement des sites publics en https (pas d'adresse IP, pas de réseau interne)
  try {
    const u = new URL(targetUrl);
    if (u.protocol !== "https:" || !u.hostname.includes(".") || /^[\d.]+$|^\[|localhost|\.local$|\.internal$/i.test(u.hostname)) return "";
  } catch {
    return "";
  }
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(targetUrl, {
      headers: { "User-Agent": BROWSER_USER_AGENT, Accept: "text/html,application/xhtml+xml", "Accept-Language": "fr-BE,fr;q=0.9,en;q=0.8" },
      redirect: "follow",
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok || !(res.headers.get("content-type") ?? "").includes("text/html")) return "";
    const html = (await res.text()).slice(0, 1_500_000);

    const meta = (prop: string) =>
      html.match(new RegExp(`<meta[^>]+(?:property|name|itemprop)=["']${prop}["'][^>]*content=["']([^"']+)["']`, "i"))?.[1] ??
      html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name|itemprop)=["']${prop}["']`, "i"))?.[1];
    const amount = meta("product:price:amount") ?? meta("og:price:amount") ?? meta("price");
    if (amount) {
      const f = formatPrice(amount, meta("product:price:currency") ?? meta("og:price:currency") ?? meta("priceCurrency"));
      if (f) return f;
    }
    for (const m of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
      try {
        const p = findJsonLdPrice(JSON.parse(m[1].trim()));
        if (p) return p;
      } catch {
        /* JSON-LD mal formé : on passe au suivant */
      }
    }
  } catch {
    /* page inaccessible ou trop lente */
  }
  return "";
}

async function resolveProductMetadata(
  targetUrl: string,
): Promise<ProductMetadata> {
  const microlink = await fetchFromMicrolink(targetUrl);
  const result = microlink ?? (await fetchFromJsonLink(targetUrl));
  if (result && !result.price) result.price = await fetchPriceFromPage(targetUrl);
  if (result) return result;

  // Dernier essai : au moins le prix, si la page est lisible
  const price = await fetchPriceFromPage(targetUrl);
  if (price) return { name: "", image_url: "", price, brand: "" };

  throw new Error("Impossible de récupérer les informations du produit");
}

export type CheckedProduct = ProductMetadata & { verdict: "ok" | "unverified" | LinkProblem };

/**
 * Infos d'une pièce + verdict de sécurité du lien :
 * - lien mal formé / raccourci / fichier / réseau social → refusé sans visiter la page ;
 * - site bloqué par l'admin → refusé ;
 * - page lisible mais qui ne parle pas d'un vêtement ou accessoire → refusé ;
 * - page illisible → « unverified » (le créateur remplit à la main, les signalements restent le filet de sécurité).
 */
export const fetchProductMetadata = createServerFn({ method: "POST" })
  .inputValidator((data: { url: string }) => {
    parseHttpUrl(data.url);
    return data;
  })
  .handler(async ({ data }): Promise<CheckedProduct> => {
    const empty = { name: "", image_url: "", price: "", brand: "" };
    const shape = checkLinkShape(data.url);
    if (shape) return { ...empty, verdict: shape };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: blocked } = await supabaseAdmin.rpc("is_domain_blocked" as never, { p_url: data.url } as never);
    if (blocked) return { ...empty, verdict: "blocked" };
    let meta: ProductMetadata | null = null;
    try {
      meta = await resolveProductMetadata(data.url);
    } catch {
      /* page illisible */
    }
    const known = isKnownFashionShop(data.url);
    if (!meta || (!meta.name && !meta.image_url)) return { ...(meta ?? empty), verdict: known ? "ok" : "unverified" };
    let path = "";
    try {
      path = decodeURIComponent(new URL(data.url).pathname);
    } catch {
      /* ignore */
    }
    const fashion = known || isFashionText(meta.name, meta.brand, path);
    return { ...meta, verdict: fashion ? "ok" : "not_fashion" };
  });

// Hébergeurs d'images autorisés pour la copie des miniatures (évite qu'on
// fasse télécharger n'importe quelle adresse au serveur).
const THUMBNAIL_HOSTS = [/\.tiktokcdn(-[a-z]+)?\.com$/, /\.ibyteimg\.com$/, /\.byteimg\.com$/, /\.cdninstagram\.com$/, /\.fbcdn\.net$/];
const MAX_THUMBNAIL_BYTES = 10 * 1024 * 1024;

const isTikTokHost = (h: string) => h === "tiktok.com" || h.endsWith(".tiktok.com");
const isShortTikTok = (u: URL) => /^(vm|vt)\.tiktok\.com$/.test(u.hostname) || u.pathname.startsWith("/t/");

/** Identifiant numérique de la vidéo (ou du post photo) s'il est dans le lien. */
function tiktokPostId(u: URL): { id: string; kind: "video" | "photo" } | null {
  const m = u.pathname.match(/\/(video|photo)\/(\d{8,25})/);
  if (m) return { id: m[2], kind: m[1] as "video" | "photo" };
  const v = u.pathname.match(/^\/v\/(\d{8,25})/); // m.tiktok.com/v/123.html
  if (v) return { id: v[1], kind: "video" };
  const q = u.searchParams.get("item_id") || u.searchParams.get("share_item_id");
  return q && /^\d{8,25}$/.test(q) ? { id: q, kind: "video" } : null;
}

/**
 * Les liens courts partagés depuis l'appli (vm./vt.tiktok.com, /t/…) redirigent
 * vers la vraie vidéo. On suit les redirections une par une (sans charger la
 * page finale, que TikTok bloque souvent pour les serveurs).
 */
async function resolveTikTokUrl(url: string): Promise<URL> {
  let u = new URL(url);
  for (let i = 0; i < 5 && isShortTikTok(u) && !tiktokPostId(u); i++) {
    const res = await fetch(u, { redirect: "manual", headers: { "User-Agent": BROWSER_USER_AGENT } });
    const loc = res.headers.get("location");
    if (!loc) break;
    const next = new URL(loc, u);
    if (!isTikTokHost(next.hostname)) throw new Error("bad_redirect");
    u = next;
  }
  return u;
}

async function tiktokOembedThumbnail(target: string): Promise<{ thumb: string; status: number }> {
  const res = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(target)}`, {
    headers: { Accept: "application/json", "User-Agent": BROWSER_USER_AGENT },
  });
  if (!res.ok) return { thumb: "", status: res.status };
  const json = (await res.json().catch(() => ({}))) as { thumbnail_url?: string };
  return { thumb: json.thumbnail_url ?? "", status: res.status };
}

/**
 * Copie une miniature dans le stockage du site. Les miniatures TikTok sont des
 * liens temporaires (ils expirent au bout de quelques heures ou jours) : sans
 * copie, la couverture de la tenue finit par disparaître.
 */
async function copyThumbnailToStorage(imageUrl: string): Promise<string> {
  const parsed = parseHttpUrl(imageUrl);
  if (parsed.protocol !== "https:" || !THUMBNAIL_HOSTS.some((re) => re.test(parsed.hostname))) return imageUrl;
  const res = await fetch(imageUrl, { headers: { "User-Agent": BROWSER_USER_AGENT } });
  const type = (res.headers.get("content-type") ?? "").split(";")[0].trim();
  if (!res.ok || !["image/jpeg", "image/png", "image/webp"].includes(type)) return imageUrl;
  const bytes = new Uint8Array(await res.arrayBuffer());
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_THUMBNAIL_BYTES) return imageUrl;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const ext = type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabaseAdmin.storage.from("covers").upload(path, bytes, { contentType: type });
  if (error) return imageUrl;
  return supabaseAdmin.storage.from("covers").getPublicUrl(path).data.publicUrl;
}

export type TikTokCoverResult = { thumbnail_url: string; error?: string };

export const fetchTikTokOembed = createServerFn({ method: "POST" })
  .inputValidator((data: { url: string; accessToken: string }) => {
    const parsed = parseHttpUrl(data.url);
    if (!isTikTokHost(parsed.hostname)) throw new Error("URL TikTok invalide");
    if (typeof data.accessToken !== "string" || !data.accessToken) throw new Error("not_authenticated");
    return data;
  })
  .handler(async ({ data }): Promise<TikTokCoverResult> => {
    // Réservé aux créateurs connectés (la fonction télécharge et stocke une image).
    // Vérification avec la clé publique : marche même si la clé admin manque.
    const { supabase } = await import("@/integrations/supabase/client");
    const { data: userData, error: userError } = await supabase.auth.getUser(data.accessToken);
    if (userError || !userData?.user) return { thumbnail_url: "", error: "not_authenticated" };

    let resolved: URL;
    try {
      resolved = await resolveTikTokUrl(data.url);
    } catch (e) {
      console.error("[TikTok] lien court non résolu", data.url, e);
      resolved = new URL(data.url);
    }
    const post = tiktokPostId(resolved);
    const user = resolved.pathname.match(/^\/(@[^/]+)/)?.[1];

    // Plusieurs formes d'adresse, de la plus fiable à la moins fiable
    const candidates = [
      `${resolved.origin}${resolved.pathname}`,
      post && user ? `https://www.tiktok.com/${user}/${post.kind}/${post.id}` : "",
      post ? `https://www.tiktok.com/@tiktok/${post.kind}/${post.id}` : "",
      post && post.kind === "photo" ? `https://www.tiktok.com/@tiktok/video/${post.id}` : "",
      data.url,
    ].filter((c, i, all) => c && all.indexOf(c) === i);

    let thumb = "";
    let lastStatus = 0;
    for (const c of candidates) {
      try {
        const r = await tiktokOembedThumbnail(c);
        lastStatus = r.status;
        if (r.thumb) {
          thumb = r.thumb;
          break;
        }
      } catch (e) {
        console.error("[TikTok oEmbed] échec réseau", c, e);
      }
    }

    // Dernier recours : l'image d'aperçu de la page (og:image)
    if (!thumb) {
      try {
        const meta = await resolveProductMetadata(`${resolved.origin}${resolved.pathname}`);
        if (meta.image_url) thumb = meta.image_url;
      } catch {
        /* ignore */
      }
    }

    if (!thumb) {
      console.error(`[TikTok] aucune miniature pour ${data.url} (résolu : ${resolved.href}, oEmbed ${lastStatus})`);
      return { thumbnail_url: "", error: post ? `oembed_${lastStatus || "network"}` : "no_video_id" };
    }
    const stored = await copyThumbnailToStorage(thumb).catch(() => thumb);
    return { thumbnail_url: stored };
  });

export function isTikTokUrl(url: string): boolean {
  try {
    return new URL(url).hostname.includes("tiktok.com");
  } catch {
    return false;
  }
}

export function isHttpUrl(url: string): boolean {
  try {
    parseHttpUrl(url);
    return true;
  } catch {
    return false;
  }
}
