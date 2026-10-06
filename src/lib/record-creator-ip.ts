import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

// Appelée quand un créateur charge son dashboard : on retient sa dernière IP
// connue, pour pouvoir comparer plus tard avec les IP des clics sur ses
// propres posts (détection de clic sur son propre lien — auto-fraude).
//
// Le client envoie son propre access token (jamais un creatorId brut) : sans
// ça, n'importe qui connaissant l'identifiant d'un créateur (public) pourrait
// écraser son IP enregistrée et fausser la détection d'auto-clic.
export const recordCreatorIp = createServerFn({ method: "POST" })
  .inputValidator((data: { accessToken: string }) => data)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: userData, error } = await supabaseAdmin.auth.getUser(data.accessToken);
    if (error || !userData?.user) return { ok: false };

    const request = getRequest();
    const ip = request?.headers.get("x-forwarded-for") ?? null;
    if (!ip) return { ok: false };

    await supabaseAdmin.from("creators").update({ last_known_ip: ip }).eq("id", userData.user.id);
    return { ok: true };
  });
