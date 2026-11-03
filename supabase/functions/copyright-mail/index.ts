// E-mails des signalements « droits d'auteur ».
// Base légale : règlement européen sur les services numériques (DSA)
//  - art. 16 §4 : accusé de réception à la personne qui signale ;
//  - art. 16 §5 : l'informer de la décision et des recours possibles ;
//  - art. 17    : exposé des motifs au créateur dont le look est retiré.
// Les e-mails partent seulement si RESEND_API_KEY est configurée (Supabase → Edge Functions → Secrets).
// Sans clé : rien n'est envoyé, le reste (formulaire, modération, avis dans le site) marche quand même.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SITE = "https://wantedfashion.vercel.app";
const CONTACT = "nannawanted@gmail.com";
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

async function send(key: string, to: string[], subject: string, text: string) {
  const from = Deno.env.get("ALERT_FROM_EMAIL") ?? "WantedFashion <onboarding@resend.dev>";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, reply_to: CONTACT, subject, text }),
  });
  return res.ok;
}

const REDRESS =
  "Si vous n'êtes pas d'accord avec cette décision, répondez à cet e-mail (" + CONTACT + ") en expliquant pourquoi : " +
  "nous réexaminerons le dossier. Vous pouvez aussi saisir un organisme de règlement extrajudiciaire des litiges " +
  "certifié (art. 21 du règlement (UE) 2022/2065) ou les tribunaux compétents.";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const body = await req.json().catch(() => ({}));
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const key = Deno.env.get("RESEND_API_KEY");

    if (body.kind === "receipt") {
      if (typeof body.ref !== "string" || !/^[A-F0-9]{8}$/.test(body.ref)) return json({ ok: false, error: "bad_input" }, 400);
      const { data: r } = await admin.from("copyright_reports").select("*").eq("ref", body.ref).maybeSingle();
      if (!r) return json({ ok: false, error: "not_found" }, 404);
      // Un seul accusé par signalement, et seulement juste après l'envoi du formulaire
      if (r.receipt_sent_at || Date.now() - new Date(r.created_at).getTime() > 60 * 60_000) return json({ ok: true, sent: false });
      if (!key) return json({ ok: true, sent: false, reason: "no_email_service" });

      await send(
        key,
        [r.email],
        `Signalement droits d'auteur reçu — réf. ${r.ref}`,
        `Bonjour ${r.full_name},\n\nNous avons bien reçu votre signalement concernant le look « ${r.post_title ?? ""} » (${SITE}/post/${r.post_snap}).\n` +
          `Référence : ${r.ref}\n\nNous l'examinons et vous informerons de notre décision par e-mail.\n\nWantedFashion — ${CONTACT}`,
      );
      // Alerte aux admins
      const { data: admins } = await admin.from("creators").select("id").eq("is_admin", true);
      const emails: string[] = [];
      for (const a of admins ?? []) {
        const { data } = await admin.auth.admin.getUserById(a.id);
        if (data?.user?.email) emails.push(data.user.email);
      }
      if (emails.length) {
        await send(key, emails, `Nouveau signalement droits d'auteur — réf. ${r.ref}`, `Look : « ${r.post_title ?? ""} » de @${r.creator_username ?? "?"}\n\nÀ traiter : ${SITE}/dashboard/moderation`);
      }
      await admin.from("copyright_reports").update({ receipt_sent_at: new Date().toISOString() }).eq("id", r.id);
      return json({ ok: true, sent: true });
    }

    if (body.kind === "decision") {
      if (typeof body.id !== "string" || !/^[0-9a-f-]{36}$/i.test(body.id)) return json({ ok: false, error: "bad_input" }, 400);
      const { data: r } = await admin.from("copyright_reports").select("*").eq("id", body.id).maybeSingle();
      if (!r) return json({ ok: false, error: "not_found" }, 404);
      if (r.status === "open" || r.decision_sent_at) return json({ ok: true, sent: false });
      if (!key) return json({ ok: true, sent: false, reason: "no_email_service" });

      const removed = r.status === "removed";
      const note = r.decision_note ? `\n\nPrécision : ${r.decision_note}` : "";
      // À la personne qui a signalé (art. 16 §5)
      await send(
        key,
        [r.email],
        `Décision sur votre signalement — réf. ${r.ref}`,
        `Bonjour ${r.full_name},\n\nDécision concernant le look « ${r.post_title ?? ""} » : ` +
          (removed ? "le contenu a été retiré de WantedFashion." : "le contenu reste en ligne : les éléments fournis ne nous ont pas permis de conclure à une violation de vos droits.") +
          note + `\n\nCette décision a été prise par une personne, sans outil automatique.\n\n${REDRESS}\n\nWantedFashion`,
      );
      // Au créateur (art. 17) si le look est retiré
      if (removed && r.creator_id) {
        const { data } = await admin.auth.admin.getUserById(r.creator_id);
        const { data: strikes } = await admin.rpc("copyright_strikes", { p_user: r.creator_id });
        if (data?.user?.email) {
          await send(
            key,
            [data.user.email],
            `Ton look « ${r.post_title ?? ""} » a été retiré (droits d'auteur)`,
            `Bonjour,\n\nTon look « ${r.post_title ?? ""} » a été supprimé définitivement, sur tout le site WantedFashion.\n\n` +
              `Pourquoi : à la suite d'un signalement (réf. ${r.ref}), nous avons estimé que ce look utilise une œuvre protégée par le droit d'auteur sans l'autorisation de son auteur : « ${r.work_description} ». ` +
              `Cette décision a été prise par une personne, pas par un outil automatique. Base : le droit d'auteur et nos conditions d'utilisation (section « Droits d'auteur »).` +
              note +
              `\n\nAvertissements actifs sur ton compte : ${strikes ?? 1}/3. Un avertissement dure 90 jours. À 3 avertissements, le compte est suspendu.\n\n${REDRESS}\n\nWantedFashion`,
          );
        }
      }
      await admin.from("copyright_reports").update({ decision_sent_at: new Date().toISOString() }).eq("id", r.id);
      return json({ ok: true, sent: true });
    }

    return json({ ok: false, error: "bad_kind" }, 400);
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
});
