import { createServerFn } from "@tanstack/react-start";
import { readStock } from "@/lib/url-metadata";

/**
 * Remet à jour l'état du stock des pièces d'un look (au plus une fois par 24 h et par pièce),
 * comme les épingles produit de Pinterest qui affichent « Rupture de stock » d'après la boutique.
 * Lancé en arrière-plan quand quelqu'un ouvre le look. Une pièce marquée à la main par le
 * créateur n'est jamais modifiée automatiquement.
 */
export const refreshPostStock = createServerFn({ method: "POST" })
  .inputValidator((data: { postId: string }) => {
    if (typeof data?.postId !== "string" || !/^[0-9a-f-]{36}$/i.test(data.postId)) throw new Error("bad_input");
    return data;
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin.rpc("claim_stock_checks" as never, { p_post: data.postId } as never);
    const list = (rows ?? []) as unknown as { id: string; affiliate_link: string }[];
    if (!list.length) return { changed: [] as { id: string; stock: string | null }[] };
    const results = await Promise.all(
      list.map(async (p) => {
        const stock = await readStock(p.affiliate_link).catch(() => null);
        // Page illisible : on garde l'état précédent plutôt que de l'effacer
        if (stock) await supabaseAdmin.from("products").update({ stock_status: stock } as never).eq("id", p.id).eq("stock_manual", false);
        return { id: p.id, stock };
      }),
    );
    return { changed: results.filter((r) => r.stock) };
  });
