import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";

type RecordConversionInput = {
  brand_id: string;
  secret: string;
  amount: number;
  order_reference?: string;
  // Fourni uniquement lors d'un appel serveur-à-serveur (le serveur de la
  // marque nous renvoie directement l'identifiant de clic qu'il a capturé
  // depuis l'URL de redirection, sans passer par le navigateur du client).
  click_ref?: string;
};

type RecordConversionResult =
  | { ok: true }
  | { ok: false; reason: "invalid_brand" | "no_click" | "invalid_amount" | "duplicate_order" };

const COOKIE_NAME = "wf_aff";

export const recordConversion = createServerFn({ method: "POST" })
  .inputValidator((data: RecordConversionInput) => data)
  .handler(async ({ data }): Promise<RecordConversionResult> => {
    if (!data.amount || data.amount <= 0) return { ok: false, reason: "invalid_amount" };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: brand } = await supabaseAdmin
      .from("brands")
      .select("id, commission_rate, webhook_secret, status, currency, max_order_amount")
      .eq("id", data.brand_id)
      .maybeSingle();

    if (!brand || brand.webhook_secret !== data.secret || brand.status !== "active") {
      return { ok: false, reason: "invalid_brand" };
    }

    // Appel serveur-à-serveur : le click_ref est fourni directement par le
    // serveur de la marque. Appel pixel classique : on lit le cookie posé
    // dans le navigateur du client au moment du clic.
    const cookieId = data.click_ref || getCookie(COOKIE_NAME);
    if (!cookieId) return { ok: false, reason: "no_click" };

    // Dernier clic de ce visiteur sur un produit de cette marque
    const { data: click } = await supabaseAdmin
      .from("clicks")
      .select("id, product_id, products!inner(brand_id, posts!inner(creator_id))")
      .eq("cookie_id", cookieId)
      .eq("products.brand_id", brand.id)
      .order("clicked_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!click) return { ok: false, reason: "no_click" };

    const creatorId = (click.products as any)?.posts?.creator_id as string | undefined;

    const commissionAmount = Math.round(data.amount * (brand.commission_rate / 100) * 100) / 100;
    // Split 50/50 entre WantedFashion et le créateur, sur la commission
    // (pas sur le montant total de la commande).
    const creatorShare = Math.round(commissionAmount * 0.5 * 100) / 100;

    // Le pixel est visible dans le code source de la page de confirmation de la
    // marque : quelqu'un pourrait en théorie rejouer/forger un appel avec ce
    // brand_id + secret. Confirmation automatique par défaut (pas de
    // vérification manuelle systématique), sauf dans 3 cas précis inspirés des
    // pratiques standards du secteur (Awin, AffiliateWP) :
    let status: "confirmed" | "pending" = "confirmed";
    let flagReason: string | null = null;

    // 1) Plafond de sécurité optionnel par commande, défini par la marque.
    if (brand.max_order_amount != null && data.amount > Number(brand.max_order_amount)) {
      status = "pending";
      flagReason = "amount_over_cap";
    }

    // 2) Première vente jamais déclarée pour ce duo créateur × marque —
    //    pratique standard ("les premiers paiements sont toujours vérifiés").
    if (status === "confirmed" && creatorId) {
      const { count: priorSalesCount } = await supabaseAdmin
        .from("sales")
        .select("id, products!inner(post_id, posts!inner(creator_id))", { count: "exact", head: true })
        .eq("brand_id", brand.id)
        .eq("products.posts.creator_id", creatorId);
      if (!priorSalesCount || priorSalesCount === 0) {
        status = "pending";
        flagReason = "first_sale_for_pair";
      }
    }

    // 3) Taux de conversion anormalement élevé pour ce créateur sur cette
    //    marque (clics → ventes). Seuil absolu (pas relatif) car le volume
    //    est encore faible au démarrage : un taux de conversion e-commerce
    //    normal tourne autour de 1-5% ; au-delà de 40%, c'est suspect.
    if (status === "confirmed" && creatorId) {
      const { count: clickCount } = await supabaseAdmin
        .from("clicks")
        .select("id, products!inner(brand_id, posts!inner(creator_id))", { count: "exact", head: true })
        .eq("products.brand_id", brand.id)
        .eq("products.posts.creator_id", creatorId);
      const { count: saleCount } = await supabaseAdmin
        .from("sales")
        .select("id, products!inner(post_id, posts!inner(creator_id))", { count: "exact", head: true })
        .eq("brand_id", brand.id)
        .eq("products.posts.creator_id", creatorId);
      const clicks = clickCount ?? 0;
      const priorSales = saleCount ?? 0;
      if (clicks >= 5 && (priorSales + 1) / clicks > 0.4) {
        status = "pending";
        flagReason = "high_conversion_rate";
      }
    }

    const { error: insertError } = await supabaseAdmin.from("sales").insert({
      click_id: click.id,
      product_id: click.product_id,
      brand_id: brand.id,
      order_amount: data.amount,
      commission_amount: commissionAmount,
      creator_share: creatorShare,
      currency: brand.currency,
      order_reference: data.order_reference || null,
      status,
      flag_reason: flagReason,
    });

    if (insertError) {
      if (insertError.code === "23505") return { ok: false, reason: "duplicate_order" };
      return { ok: false, reason: "invalid_amount" };
    }

    return { ok: true };
  });
