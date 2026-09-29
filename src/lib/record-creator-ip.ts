import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

// Appelée quand un créateur charge son dashboard : on retient sa dernière IP
// connue, pour pouvoir comparer plus tard avec les IP des clics sur ses
// propres posts (détection de clic sur son propre lien — auto-fraude).
export const recordCreatorIp = createServerFn({ method: "POST" })
  .inputValidator((data: { creatorId: string }) => data)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const request = getRequest();
    const ip = request?.headers.get("x-forwarded-for") ?? null;
    if (!ip) return { ok: false };

    await supabaseAdmin.from("creators").update({ last_known_ip: ip }).eq("id", data.creatorId);
    return { ok: true };
  });
