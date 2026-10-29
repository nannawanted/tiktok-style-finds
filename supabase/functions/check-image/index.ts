// Vérification « pas de nudité » d'une photo, sur le serveur, avec Sightengine.
// Appelée par le site juste après l'envoi d'une photo (couverture, profil, bannière).
//
// Réponses :
//  - ok          : photo vérifiée, acceptée
//  - explicit    : nudité → la photo est effacée du stockage, le site la refuse
//  - unverified  : pas pu vérifier (quota gratuit épuisé, panne, trop lent) → la photo
//                  passe quand même et l'admin la voit dans « Photos non vérifiées »
//  - disabled    : pas encore de clés Sightengine → le site fonctionne comme avant
//
// Clés à mettre dans Supabase → Edge Functions → Secrets (jamais dans le code) :
//   SIGHTENGINE_API_USER, SIGHTENGINE_API_SECRET
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const BUCKETS = new Set(["covers", "avatars", "banners"]);
const PER_USER_PER_DAY = 40; // protège le quota contre les abus
const TIMEOUT_MS = 8000;
// Au-dessus de ce score, c'est de la nudité. Maillots de bain, lingerie, décolletés : acceptés (c'est de la mode).
const EXPLICIT_SCORE = 0.5;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { bucket, path } = await req.json().catch(() => ({}));
    if (typeof bucket !== "string" || !BUCKETS.has(bucket) || typeof path !== "string" || !/^[A-Za-z0-9._-]{1,120}$/.test(path)) {
      return json({ verdict: "unverified", error: "bad_input" }, 400);
    }

    const url = Deno.env.get("SUPABASE_URL")!;
    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
    const { data: auth } = await admin.auth.getUser(token);
    const userId = auth?.user?.id;
    if (!userId) return json({ verdict: "unverified", error: "not_logged_in" }, 401);

    const apiUser = Deno.env.get("SIGHTENGINE_API_USER");
    const apiSecret = Deno.env.get("SIGHTENGINE_API_SECRET");
    if (!apiUser || !apiSecret) return json({ verdict: "disabled" });

    const publicUrl = `${url}/storage/v1/object/public/${bucket}/${path}`;
    const record = (verdict: string, detail: string | null, counted: boolean) =>
      admin.from("image_checks").insert({ user_id: userId, bucket, path, url: publicUrl, verdict, detail, counted });

    // Limite par personne et par jour
    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const { count } = await admin.from("image_checks").select("id", { count: "exact", head: true }).eq("user_id", userId).gte("created_at", since);
    if ((count ?? 0) >= PER_USER_PER_DAY) {
      await record("unverified", "user_daily_limit", false);
      return json({ verdict: "unverified" });
    }

    const params = new URLSearchParams({ models: "nudity-2.1", url: publicUrl, api_user: apiUser, api_secret: apiSecret });
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch(`https://api.sightengine.com/1.0/check.json?${params}`, { signal: ctrl.signal });
    } catch {
      await record("unverified", "timeout_or_network", false);
      return json({ verdict: "unverified" });
    } finally {
      clearTimeout(timer);
    }
    const body = await res.json().catch(() => null);
    if (!res.ok || body?.status !== "success" || !body?.nudity) {
      // Quota épuisé, clé invalide, panne… : la photo passe, l'admin pourra la regarder
      const why = body?.error ? `${body.error.type ?? ""}:${body.error.code ?? res.status}` : `http_${res.status}`;
      await record("unverified", String(why).slice(0, 120), false);
      return json({ verdict: "unverified" });
    }

    const n = body.nudity;
    const score = Math.max(Number(n.sexual_activity) || 0, Number(n.sexual_display) || 0, Number(n.erotica) || 0, Number(n.suggestive_classes?.sextoy) || 0);
    if (score >= EXPLICIT_SCORE) {
      await admin.storage.from(bucket).remove([path]);
      await record("explicit", `score=${score.toFixed(2)}`, true);
      return json({ verdict: "explicit" });
    }
    await record("ok", `score=${score.toFixed(2)}`, true);
    return json({ verdict: "ok" });
  } catch (e) {
    console.error("[check-image]", e);
    return json({ verdict: "unverified", error: "server_error" });
  }
});
