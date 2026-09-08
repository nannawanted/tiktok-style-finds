import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";

type RecordConversionInput = {
  brand_id: string;
  secret: string;
  amount: number;
  order_reference?: string;
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
      .select("id, commission_rate, webhook_secret, status, currency")
      .eq("id", data.brand_id)
      .maybeSingle();

    if (!brand || brand.webhook_secret !== data.secret || brand.status !== "active") {
      return { ok: false, reason: "invalid_brand" };
    }

    const cookieId = getCookie(COOKIE_NAME);
    if (!cookieId) return { ok: false, reason: "no_click" };

    // Dernier clic de ce visiteur sur un produit de cette marque
    const { data: click } = await supabaseAdmin
      .from("clicks")
      .select("id, product_id, products!inner(brand_id)")
      .eq("cookie_id", cookieId)
      .eq("products.brand_id", brand.id)
      .order("clicked_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!click) return { ok: false, reason: "no_click" };

    const commissionAmount = Math.round(data.amount * (brand.commission_rate / 100) * 100) / 100;

    // Le pixel est visible dans le code source de la page de confirmation de la
    // marque : quelqu'un pourrait en théorie rejouer/forger un appel avec ce
    // brand_id + secret. Deux garde-fous :
    //  1. Une vente n'est JAMAIS auto-confirmée : statut "pending" par défaut,
    //     validation manuelle requise avant que ça compte comme dû.
    //  2. Une même référence de commande ne peut pas être déclarée deux fois
    //     pour cette marque (contrainte unique en base).
    const { error: insertError } = await supabaseAdmin.from("sales").insert({
      click_id: click.id,
      product_id: click.product_id,
      brand_id: brand.id,
      order_amount: data.amount,
      commission_amount: commissionAmount,
      currency: brand.currency,
      order_reference: data.order_reference || null,
      status: "pending",
    });

    if (insertError) {
      if (insertError.code === "23505") return { ok: false, reason: "duplicate_order" };
      return { ok: false, reason: "invalid_amount" };
    }

    return { ok: true };
  });
