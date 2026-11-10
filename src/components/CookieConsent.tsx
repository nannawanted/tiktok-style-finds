import { useEffect, useState } from "react";
import { AFFILIATE_ENABLED } from "@/lib/features";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "@/lib/i18n";
import { applyConsent } from "@/lib/analytics";
import { supabase } from "@/integrations/supabase/client";
import { CONSENT_COOKIE, formatConsent, readConsent, type Consent } from "@/lib/consent";

function saveConsent(c: Consent) {
  const maxAge = 60 * 60 * 24 * 365; // 1 an
  const value = formatConsent(c);
  document.cookie = `${CONSENT_COOKIE}=${value}; max-age=${maxAge}; path=/; SameSite=Lax`;
  // Preuve du choix (RGPD art. 7 §1 : pouvoir démontrer le consentement) : un identifiant au hasard,
  // le choix et la date sont ajoutés au journal des preuves — sans nom ni adresse IP.
  let id = document.cookie.split("; ").find((x) => x.startsWith("wf_consent_id="))?.split("=")[1];
  if (!id || !/^[0-9a-f-]{36}$/.test(id)) id = crypto.randomUUID();
  document.cookie = `wf_consent_id=${id}; max-age=${maxAge}; path=/; SameSite=Lax`;
  void supabase.rpc("log_cookie_choice" as never, { p_id: id, p_choice: value } as never);
}

/** Rouvre le bandeau (lien « Gérer les cookies » du pied de page et du menu). */
export function openCookieSettings() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("wf:cookies"));
}

/**
 * Bandeau cookies — règles de l'Autorité de protection des données (Belgique) :
 * identité du responsable, types de cookies avec leur but et leur durée, accord séparé par type,
 * « Tout refuser » aussi simple que « Tout accepter », droit de retirer son accord, lien vers les détails.
 * Rien n'est déposé (statistiques, suivi des achats) avant l'accord.
 */
export function CookieConsent() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [custom, setCustom] = useState(false);
  const [choice, setChoice] = useState<Consent>({ stats: false, aff: false });

  useEffect(() => {
    const current = readConsent();
    if (current === null) setVisible(true);
    const open = () => {
      setChoice(readConsent() ?? { stats: false, aff: false });
      setCustom(true);
      setVisible(true);
    };
    window.addEventListener("wf:cookies", open);
    return () => window.removeEventListener("wf:cookies", open);
  }, []);

  function respond(c: Consent) {
    saveConsent(c);
    // Retrait de l'accord : on efface ce qui avait été déposé
    if (!c.aff) document.cookie = "wf_aff=; max-age=0; path=/; secure; samesite=none";
    if (!c.stats) {
      try {
        localStorage.removeItem("wf_device");
      } catch {
        /* stockage indisponible */
      }
    }
    applyConsent(c.stats);
    setVisible(false);
    setCustom(false);
  }

  if (!visible) return null;

  const btn = "h-11 flex-1 rounded-full bg-ink px-4 text-sm font-bold text-surface hover:bg-ink/90";
  return (
    <div data-no-print role="dialog" aria-labelledby="cookie-title" className="fixed inset-x-0 bottom-0 z-50 max-h-[85dvh] overflow-y-auto border-t border-border bg-card p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-lg">
      <div className="mx-auto flex max-w-3xl flex-col gap-3">
        <p id="cookie-title" className="text-[15px] font-bold">
          {t("cookies.title")}
        </p>
        <p className="text-sm text-foreground/75">{t("cookies.intro")}</p>
        <ul className="flex flex-col gap-2">
          <Category title={t("cookies.statsTitle")} text={t("cookies.statsText")} on={choice.stats} editable={custom} onChange={(v) => setChoice((c) => ({ ...c, stats: v }))} />
          {AFFILIATE_ENABLED && (
            <Category title={t("cookies.affTitle")} text={t("cookies.affText")} on={choice.aff} editable={custom} onChange={(v) => setChoice((c) => ({ ...c, aff: v }))} />
          )}
          {custom && <Category title={t("cookies.necessaryTitle")} text={t("cookies.necessaryText")} on editable={false} locked />}
        </ul>
        <p className="text-xs text-foreground/60">
          {t("cookies.withdraw")}{" "}
          <Link to="/confidentialite" hash="cookies" className="underline">
            {t("cookies.learnMore")}
          </Link>
        </p>
        {custom ? (
          <div className="flex flex-col gap-2 sm:flex-row">
            <button type="button" className={btn} onClick={() => respond({ stats: false, aff: false })}>
              {t("cookies.decline")}
            </button>
            <button type="button" className={btn} onClick={() => respond(choice)}>
              {t("cookies.save")}
            </button>
            <button type="button" className={btn} onClick={() => respond({ stats: true, aff: AFFILIATE_ENABLED })}>
              {t("cookies.accept")}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row">
            <button type="button" className={btn} onClick={() => respond({ stats: false, aff: false })}>
              {t("cookies.decline")}
            </button>
            <button type="button" className={btn} onClick={() => respond({ stats: true, aff: AFFILIATE_ENABLED })}>
              {t("cookies.accept")}
            </button>
            <button type="button" className="h-11 flex-1 rounded-full border-[1.5px] border-border px-4 text-sm font-bold" onClick={() => setCustom(true)}>
              {t("cookies.customize")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Category({
  title,
  text,
  on,
  editable,
  locked = false,
  onChange,
}: {
  title: string;
  text: string;
  on: boolean;
  editable: boolean;
  locked?: boolean;
  onChange?: (v: boolean) => void;
}) {
  const { t } = useTranslation();
  return (
    <li className="flex items-start gap-3 rounded-2xl bg-background px-3 py-2.5">
      <span className="min-w-0 flex-1 text-[13px] leading-snug">
        <span className="block font-semibold">{title}</span>
        <span className="text-foreground/70">{text}</span>
      </span>
      {locked ? (
        // Comme les bandeaux des grandes plateformes (« Toujours actifs ») : pas d'interrupteur, ces cookies ne demandent pas d'accord
        <span className="mt-0.5 shrink-0 rounded-full bg-surface px-2.5 py-1 text-[11.5px] font-bold text-foreground/70">{t("cookies.alwaysOn")}</span>
      ) : editable && (
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label={title}
          onClick={() => onChange?.(!on)}
          className={`mt-0.5 flex h-7 w-12 shrink-0 items-center rounded-full p-0.5 transition-colors ${on ? "bg-ink" : "bg-border"}`}
        >
          <span className={`h-6 w-6 rounded-full bg-surface shadow transition-transform ${on ? "translate-x-5" : ""}`} />
        </button>
      )}
    </li>
  );
}
