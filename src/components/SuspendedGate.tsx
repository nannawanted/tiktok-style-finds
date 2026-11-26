import { useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { toast } from "sonner";
import { Download, LogOut, Mail, ShieldAlert } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useModerationNotices, useMyAccountStatus } from "@/lib/social";
import { useTranslation } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { downloadMyData } from "@/lib/export-data";
import { Logo } from "./Logo";

// Pages lisibles même avec un compte suspendu (règles et recours)
const ALLOWED = /^\/(legal|conditions|regles|confidentialite|cookies|dsa|droits-auteur|mentions-legales)(\/|$)/;

/**
 * Compte suspendu : comme un compte désactivé sur Instagram, la personne ne voit plus qu'un écran
 * « Ton compte est suspendu » avec la raison, comment contester (art. 17 et 20 DSA), télécharger
 * ses données (RGPD) et se déconnecter. Les pages juridiques restent lisibles.
 */
export function SuspendedGate() {
  const { t, lang } = useTranslation();
  const { user } = useAuth();
  const { data: status } = useMyAccountStatus();
  const { data: notices } = useModerationNotices();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  if (!user || !status?.blocked || ALLOWED.test(pathname)) return null;

  const notice = notices?.find((n) => n.kind === "account_blocked");
  const reason = notice?.data?.reason === "copyright" ? t("suspended.reasonCopyright") : t("suspended.reasonRules");
  const since = status.blocked_at
    ? new Date(status.blocked_at).toLocaleDateString(lang === "en" ? "en-GB" : "fr-BE", { day: "numeric", month: "long", year: "numeric" })
    : "";

  async function exportData() {
    setBusy(true);
    const ok = await downloadMyData();
    setBusy(false);
    if (ok) toast.success(t("settings.exportDone"));
    else toast.error(t("settings.exportError"));
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  return (
    <div role="alertdialog" aria-modal="true" aria-labelledby="suspended-title" className="fixed inset-0 z-[95] overflow-y-auto bg-background">
      <div className="mx-auto flex min-h-full max-w-md flex-col items-center px-5 py-10 text-center">
        <Logo className="h-14" />
        <span className="mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ShieldAlert className="h-7 w-7" aria-hidden="true" />
        </span>
        <h1 id="suspended-title" className="font-display mt-4 text-3xl font-bold leading-tight">
          {t("suspended.title")}
        </h1>
        {since && <p className="mt-1 text-sm text-foreground/60">{t("suspended.since").replace("{date}", since)}</p>}
        <div className="mt-5 space-y-3 rounded-3xl bg-surface p-5 text-left text-[14.5px] leading-relaxed">
          <p>{reason}</p>
          <p className="text-foreground/75">{t("suspended.effects")}</p>
          <p className="text-foreground/75">{t("suspended.human")}</p>
        </div>

        <a
          href={`mailto:nannawanted@gmail.com?subject=${encodeURIComponent(t("suspended.appealSubject"))}`}
          className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ink font-bold text-surface"
        >
          <Mail className="h-4 w-4" aria-hidden="true" /> {t("suspended.appeal")}
        </a>
        <p className="mt-2 text-xs text-foreground/60">{t("suspended.appealHint")}</p>

        <button
          type="button"
          onClick={exportData}
          disabled={busy}
          className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-full border border-border bg-surface font-bold disabled:opacity-50"
        >
          <Download className="h-4 w-4" aria-hidden="true" /> {t("suspended.download")}
        </button>
        <button type="button" onClick={signOut} className="mt-2 flex h-12 w-full items-center justify-center gap-2 font-semibold text-foreground/70">
          <LogOut className="h-4 w-4" aria-hidden="true" /> {t("suspended.logout")}
        </button>

        <p className="mt-6 text-xs text-foreground/55">
          <Link to="/regles" className="underline">
            {t("legal.pRules")}
          </Link>{" "}
          ·{" "}
          <Link to="/dsa" className="underline">
            {t("legal.pDsa")}
          </Link>{" "}
          ·{" "}
          <Link to="/conditions" className="underline">
            {t("legal.pTerms")}
          </Link>
        </p>
      </div>
    </div>
  );
}
