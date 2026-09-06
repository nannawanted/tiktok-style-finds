import { createFileRoute, redirect, notFound } from "@tanstack/react-router";
import { getRequest } from "@tanstack/react-start/server";

// Route de redirection tracée pour l'affiliation maison.
// Un lien du type wantedfashion.com/go/{productId} :
//  1. retrouve le produit (et son lien marchand d'origine)
//  2. enregistre le clic (post, produit, créateur)
//  3. pose un cookie de tracking sur le domaine wantedfashion.com
//  4. redirige vers le site de la marque
// Le cookie posé ici est ce qui permettra plus tard à un pixel de conversion
// installé sur la page de confirmation de commande de la marque de retrouver
// le créateur à créditer pour la vente.

const COOKIE_NAME = "wf_aff";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 jours

export const Route = createFileRoute("/go/$productId")({
  beforeLoad: async ({ params }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: product } = await supabaseAdmin
      .from("products")
      .select("id, affiliate_link, post_id, brand_id")
      .eq("id", params.productId)
      .maybeSingle();

    if (!product) throw notFound();

    const { data: post } = await supabaseAdmin
      .from("posts")
      .select("creator_username")
      .eq("id", product.post_id)
      .maybeSingle();

    const request = getRequest();
    const cookieHeader = request?.headers.get("cookie") ?? "";
    const existingCookie = cookieHeader
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith(`${COOKIE_NAME}=`))
      ?.split("=")[1];
    const cookieId = existingCookie || crypto.randomUUID();

    await supabaseAdmin.from("clicks").insert({
      post_id: product.post_id,
      product_id: product.id,
      creator_username: post?.creator_username ?? "inconnu",
      cookie_id: cookieId,
      ip_address: request?.headers.get("x-forwarded-for") ?? null,
      user_agent: request?.headers.get("user-agent") ?? null,
    });

    throw redirect({
      href: product.affiliate_link,
      statusCode: 302,
      headers: {
        "Set-Cookie": `${COOKIE_NAME}=${cookieId}; Max-Age=${COOKIE_MAX_AGE_SECONDS}; Path=/; SameSite=Lax; Secure`,
      },
    });
  },
  component: () => null,
});
