import { createServerFn } from "@tanstack/react-start";

type BrandSignalStat = {
  brand_id: string;
  total_clicks: number;
  total_sales: number;
  last_sale_at: string | null;
};

type Result = { ok: true; stats: BrandSignalStat[] } | { ok: false };

// Réservé aux admins : le client envoie son propre access token (jamais un
// userId brut), on vérifie is_admin côté serveur avant de renvoyer des
// données commercialement sensibles (ventes par marque).
export const getBrandSignalStats = createServerFn({ method: "GET" })
  .inputValidator((data: { accessToken: string }) => data)
  .handler(async ({ data }): Promise<Result> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: userData, error } = await supabaseAdmin.auth.getUser(data.accessToken);
    if (error || !userData?.user) return { ok: false };

    const { data: creator } = await supabaseAdmin
      .from("creators")
      .select("is_admin")
      .eq("id", userData.user.id)
      .maybeSingle();

    if (!creator?.is_admin) return { ok: false };

    const { data: stats } = await supabaseAdmin.from("brand_signal_stats").select("*");
    return { ok: true, stats: (stats as BrandSignalStat[]) ?? [] };
  });
