import { createServerFn } from "@tanstack/react-start";
import { getRequest, getCookie, setCookie } from "@tanstack/react-start/server";

// Toute la logique sensible (client Supabase avec clé secrète) reste dans le
// handler de cette server function : le bundler la retire automatiquement du
// bundle client, seul un appel RPC est exposé côté navigateur.

const COOKIE_NAME = "wf_aff";
// Robots, aperçus de liens et scripts : leurs clics ne comptent pas
const BOT_UA = /bot|crawl|spider|slurp|headless|lighthouse|preview|facebookexternalhit|whatsapp|telegram|discord|curl|wget|python|httpclient|axios|node-fetch|go-http|java\//i;
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 jours

type AffiliateRedirectResult =
  | { found: true; targetUrl: string }
  | { found: false };

function isSafeRedirectTarget(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export const resolveAffiliateRedirect = createServerFn({ method: "GET" })
  .inputValidator((data: { productId: string }) => data)
  .handler(async ({ data }): Promise<AffiliateRedirectResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: product } = await supabaseAdmin
      .from("products")
      .select("id, affiliate_link, post_id, brand_id")
      .eq("id", data.productId)
      .maybeSingle();

    if (!product || !isSafeRedirectTarget(product.affiliate_link)) return { found: false };
    // Site bloqué par l'admin depuis la publication : on n'envoie plus personne dessus
    const { data: blocked } = await supabaseAdmin.rpc("is_domain_blocked" as never, { p_url: product.affiliate_link } as never);
    if (blocked) return { found: false };

    const { data: post } = await supabaseAdmin
      .from("posts")
      .select("creator_username, creator_id")
      .eq("id", product.post_id)
      .maybeSingle();

    const existingCookie = getCookie(COOKIE_NAME);
    const cookieId = existingCookie || crypto.randomUUID();
    const request = getRequest();
    // Première adresse de la chaîne (celle du visiteur), sans caractères spéciaux
    const clickIp = (request?.headers.get("x-forwarded-for") ?? "").split(",")[0].trim().replace(/[^0-9a-fA-F:.]/g, "") || null;

    // Détection d'auto-clic : le créateur qui clique sur son propre lien
    // depuis la même IP que celle vue récemment sur son dashboard.
    let isSelfClick = false;
    if (post?.creator_id && clickIp) {
      const { data: creator } = await supabaseAdmin
        .from("creators")
        .select("last_known_ip")
        .eq("id", post.creator_id)
        .maybeSingle();
      isSelfClick = !!creator?.last_known_ip && creator.last_known_ip.split(",")[0].trim() === clickIp;
    }

    // Clics fiables (preuve pour les marques), comme les grands réseaux d'affiliation :
    // chaque clic est gardé pour pouvoir vérifier, mais ne « compte » que s'il est authentique.
    const userAgent = request?.headers.get("user-agent") ?? "";
    let notCounted: "bot" | "duplicate" | "rate_limit" | "self" | null = null;
    if (!userAgent || BOT_UA.test(userAgent)) notCounted = "bot";
    else if (isSelfClick) notCounted = "self";
    else {
      const since30 = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      const since60 = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      // Même personne (ou même connexion) sur la même pièce en moins de 30 min : 1 seul clic
      const safeCookie = cookieId.replace(/[^A-Za-z0-9-]/g, "");
      const sameViewer = clickIp ? `cookie_id.eq."${safeCookie}",ip_address.eq."${clickIp}"` : `cookie_id.eq."${safeCookie}"`;
      const { count: dup } = await supabaseAdmin
        .from("clicks")
        .select("id", { count: "exact", head: true })
        .eq("product_id", product.id)
        .eq("counted" as never, true as never)
        .gte("clicked_at", since30)
        .or(sameViewer);
      if ((dup ?? 0) > 0) notCounted = "duplicate";
      else if (clickIp) {
        // Plus de 60 clics par heure depuis une même connexion : pas un humain
        const { count: burst } = await supabaseAdmin.from("clicks").select("id", { count: "exact", head: true }).eq("ip_address", clickIp).gte("clicked_at", since60);
        if ((burst ?? 0) >= 60) notCounted = "rate_limit";
      }
    }

    await supabaseAdmin.from("clicks").insert({
      post_id: product.post_id,
      product_id: product.id,
      creator_username: post?.creator_username ?? "inconnu",
      cookie_id: cookieId,
      ip_address: clickIp,
      user_agent: userAgent || null,
      is_self_click: isSelfClick,
      counted: notCounted === null,
      not_counted_reason: notCounted,
    } as never);

    // Le cookie de suivi wf_aff n'est posé que si le visiteur a donné son
    // consentement via le bandeau cookies (RGPD/ePrivacy) — enregistré dans
    // le cookie wf_consent (celui-là est strictement nécessaire, pas de
    // consentement requis pour l'enregistrer). Le clic reste enregistré et le
    // paramètre wf_click ajouté à l'URL dans tous les cas : la redirection
    // fonctionne normalement, seule la persistance du cookie change.
    const hasConsent = getCookie("wf_consent") === "true";
    if (hasConsent) {
      setCookie(COOKIE_NAME, cookieId, {
        maxAge: COOKIE_MAX_AGE_SECONDS,
        path: "/",
        sameSite: "none",
        secure: true,
      });
    }

    // Ajoute l'identifiant de clic dans l'URL de destination, en plus du
    // cookie : ça permet à une marque techniquement équipée de le capturer
    // côté serveur (au lieu du pixel navigateur) et de nous le renvoyer
    // elle-même lors de la déclaration de vente — plus fiable et plus sûr
    // (le serveur de la marque n'expose jamais ça au client final).
    const targetUrl = new URL(product.affiliate_link);
    targetUrl.searchParams.set("wf_click", cookieId);
    // Étiquette UTM : la marque voit elle-même, dans son propre outil de statistiques (Google Analytics,
    // Shopify…), les visites venues de WantedFashion et de quel créateur. Jamais d'écrasement d'une
    // étiquette déjà présente dans le lien (lien d'affiliation fourni par la marque).
    if (!targetUrl.searchParams.has("utm_source")) {
      targetUrl.searchParams.set("utm_source", "wantedfashion");
      targetUrl.searchParams.set("utm_medium", "referral");
      targetUrl.searchParams.set("utm_campaign", post?.creator_username ?? "wantedfashion");
      targetUrl.searchParams.set("utm_content", product.post_id);
    }

    return { found: true, targetUrl: targetUrl.toString() };
  });
