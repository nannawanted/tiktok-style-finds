import { createServerFn } from "@tanstack/react-start";
import { getRequest, getCookie, setCookie } from "@tanstack/react-start/server";

// Toute la logique sensible (client Supabase avec clé secrète) reste dans le
// handler de cette server function : le bundler la retire automatiquement du
// bundle client, seul un appel RPC est exposé côté navigateur.

const COOKIE_NAME = "wf_aff";
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

    const { data: post } = await supabaseAdmin
      .from("posts")
      .select("creator_username")
      .eq("id", product.post_id)
      .maybeSingle();

    const existingCookie = getCookie(COOKIE_NAME);
    const cookieId = existingCookie || crypto.randomUUID();
    const request = getRequest();

    await supabaseAdmin.from("clicks").insert({
      post_id: product.post_id,
      product_id: product.id,
      creator_username: post?.creator_username ?? "inconnu",
      cookie_id: cookieId,
      ip_address: request?.headers.get("x-forwarded-for") ?? null,
      user_agent: request?.headers.get("user-agent") ?? null,
    });

    setCookie(COOKIE_NAME, cookieId, {
      maxAge: COOKIE_MAX_AGE_SECONDS,
      path: "/",
      sameSite: "none",
      secure: true,
    });

    return { found: true, targetUrl: product.affiliate_link };
  });
