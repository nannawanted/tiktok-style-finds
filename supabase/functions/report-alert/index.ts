// Alerte e-mail à l'admin quand un look atteint 3 signalements.
// Appelée par le site juste après un signalement (compte connecté requis).
// L'e-mail part seulement si la clé RESEND_API_KEY est configurée dans
// Supabase (Edge Functions → Secrets). Sans clé : rien n'est envoyé, l'alerte
// reste visible dans la cloche du site.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const THRESHOLD = 3;
const SITE = "https://wantedfashion.vercel.app";
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { post_id } = await req.json().catch(() => ({}));
    if (typeof post_id !== "string" || !/^[0-9a-f-]{36}$/i.test(post_id)) return json({ ok: false, error: "bad_input" }, 400);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: post } = await admin.from("posts").select("id, title, creator_username, report_alert_sent_at").eq("id", post_id).maybeSingle();
    if (!post) return json({ ok: false, error: "not_found" }, 404);
    if (post.report_alert_sent_at) return json({ ok: true, sent: false, reason: "already_sent" });

    const { count } = await admin.from("reports").select("id", { count: "exact", head: true }).eq("post_id", post_id).eq("status", "open");
    if ((count ?? 0) < THRESHOLD) return json({ ok: true, sent: false, reason: "below_threshold" });

    const key = Deno.env.get("RESEND_API_KEY");
    if (!key) return json({ ok: true, sent: false, reason: "no_email_service" });

    // Adresse(s) des admins
    const { data: admins } = await admin.from("creators").select("id").eq("is_admin", true);
    const emails: string[] = [];
    for (const a of admins ?? []) {
      const { data } = await admin.auth.admin.getUserById(a.id);
      if (data?.user?.email) emails.push(data.user.email);
    }
    if (!emails.length) return json({ ok: true, sent: false, reason: "no_admin_email" });

    const from = Deno.env.get("ALERT_FROM_EMAIL") ?? "WantedFashion <onboarding@resend.dev>";
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: emails,
        subject: `Look signalé ${count} fois : « ${post.title} »`,
        text: `Le look « ${post.title} » de @${post.creator_username} a été signalé ${count} fois.\n\nVoir la modération : ${SITE}/dashboard/moderation\nVoir le look : ${SITE}/post/${post.id}`,
      }),
    });
    if (!res.ok) return json({ ok: false, error: "email_failed", status: res.status }, 502);

    await admin.from("posts").update({ report_alert_sent_at: new Date().toISOString() }).eq("id", post_id);
    return json({ ok: true, sent: true });
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
});
