import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/i18n";
import { TERMS_EFFECTIVE_DATE, TERMS_REACCEPT_REQUIRED, TERMS_VERSION } from "@/lib/legal";

const LATER_KEY = "wf_terms_later";

/**
 * Nouvelles conditions à accepter (changement important, ex. retour de l'affiliation).
 * Modèle : engagements de WhatsApp devant les autorités européennes de protection des consommateurs (2023) :
 * résumé des changements, « Accepter » et « Refuser » aussi visibles, conséquences du refus expliquées,
 * possibilité de choisir plus tard jusqu'à la date d'entrée en vigueur.
 * Inactif tant que TERMS_REACCEPT_REQUIRED vaut false.
 */
export function TermsGate() {
  const { t, lang } = useTranslation();
  const { user } = useAuth();
  const qc = useQueryClient();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [busy, setBusy] = useState(false);
  const [refusing, setRefusing] = useState(false);
  const [later, setLater] = useState(() => {
    try {
      return typeof sessionStorage !== "undefined" && sessionStorage.getItem(LATER_KEY) === TERMS_VERSION;
    } catch {
      return false;
    }
  });

  const { data: accepted } = useQuery({
    queryKey: ["my-terms-version", user?.id],
    enabled: TERMS_REACCEPT_REQUIRED && !!user,
    queryFn: async () => {
      const { data } = await supabase.rpc("my_terms_version" as never);
      return (data as unknown as string | null) ?? null;
    },
  });

  if (!TERMS_REACCEPT_REQUIRED || !user || accepted === undefined || accepted === TERMS_VERSION) return null;
  // Les pages à lire pour décider restent accessibles
  if (["/conditions", "/confidentialite", "/dashboard/settings"].includes(path)) return null;
  const canWait = new Date().toISOString().slice(0, 10) < TERMS_EFFECTIVE_DATE;
  if (later && canWait) return null;

  const date = new Date(`${TERMS_EFFECTIVE_DATE}T12:00:00`).toLocaleDateString(lang === "en" ? "en-GB" : "fr-BE", { day: "numeric", month: "long", year: "numeric" });

  async function accept() {
    setBusy(true);
    const { error } = await supabase.rpc("accept_terms" as never, { p_version: TERMS_VERSION } as never);
    setBusy(false);
    if (error) return toast.error(error.message);
    qc.setQueryData(["my-terms-version", user?.id], TERMS_VERSION);
    toast.success(t("termsGate.thanks"));
  }

  function postpone() {
    try {
      sessionStorage.setItem(LATER_KEY, TERMS_VERSION);
    } catch {
      /* stockage indisponible */
    }
    setLater(true);
  }

  const btn = "h-12 flex-1 rounded-full bg-ink px-4 text-sm font-bold text-surface disabled:opacity-50";
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-3 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="terms-gate-title">
      <div className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-[28px] bg-card p-5 shadow-xl">
        <h2 id="terms-gate-title" className="font-display text-2xl font-bold">
          {t("termsGate.title")}
        </h2>
        <p className="mt-1 text-sm text-foreground/70">{t("termsGate.when").replace("{date}", date)}</p>
        <ul className="mt-3 space-y-2 rounded-2xl bg-surface p-4 text-[14px] leading-snug">
          <li>• {t("termsGate.point1")}</li>
          <li>• {t("termsGate.point2")}</li>
          <li>• {t("termsGate.point3")}</li>
        </ul>
        <p className="mt-3 text-sm">
          <Link to="/conditions" className="font-semibold text-primary underline">
            {t("moderation.termsRead")}
          </Link>{" "}
          ·{" "}
          <Link to="/confidentialite" className="font-semibold text-primary underline">
            {t("moderation.privacyRead")}
          </Link>
        </p>

        {refusing ? (
          <div className="mt-4 rounded-2xl bg-destructive/10 p-4 text-sm leading-snug">
            <p className="font-semibold">{t("termsGate.refuseTitle")}</p>
            <p className="mt-1 text-foreground/75">{t("termsGate.refuseText")}</p>
            <div className="mt-3 flex flex-col gap-2">
              <Link to="/dashboard/settings" className="flex h-11 items-center justify-center rounded-full bg-ink text-sm font-bold text-surface">
                {t("termsGate.goSettings")}
              </Link>
              <button type="button" onClick={() => void supabase.auth.signOut()} className="h-11 rounded-full border-[1.5px] border-border text-sm font-semibold">
                {t("termsGate.signOut")}
              </button>
              <button type="button" onClick={() => setRefusing(false)} className="h-11 rounded-full text-sm font-semibold text-foreground/70 underline underline-offset-4">
                {t("termsGate.back")}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-4 flex gap-2">
              <button type="button" className={btn} onClick={() => setRefusing(true)}>
                {t("termsGate.refuse")}
              </button>
              <button type="button" className={btn} disabled={busy} onClick={accept}>
                {busy ? <Loader2 className="mx-auto h-4 w-4 animate-spin" aria-hidden="true" /> : t("termsGate.accept")}
              </button>
            </div>
            {canWait && (
              <button type="button" onClick={postpone} className="mt-2 h-11 w-full rounded-full text-sm font-semibold text-foreground/70 underline underline-offset-4">
                {t("termsGate.later")}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
