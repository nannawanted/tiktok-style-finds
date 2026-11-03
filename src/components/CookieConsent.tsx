import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { applyConsent } from "@/lib/analytics";

const CONSENT_COOKIE = "wf_consent";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.split("; ").find((c) => c.startsWith(`${name}=`));
  return match ? match.split("=")[1] : null;
}

function setConsentCookie(value: "true" | "false") {
  const maxAge = 60 * 60 * 24 * 365; // 1 an
  document.cookie = `${CONSENT_COOKIE}=${value}; max-age=${maxAge}; path=/; SameSite=Lax`;
}

/** Rouvre le bandeau (lien « Gérer les cookies » du pied de page et du menu). */
export function openCookieSettings() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("wf:cookies"));
}

// Bandeau de consentement (règles CNIL) : refuser aussi simple qu'accepter (deux boutons identiques),
// rien n'est déposé avant le choix, et le choix peut être changé à tout moment depuis toutes les pages.
// wf_aff (voir src/lib/affiliate-redirect.ts) et PostHog ne gardent rien sans consentement « true ».
export function CookieConsent() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (readCookie(CONSENT_COOKIE) === null) setVisible(true);
    const open = () => setVisible(true);
    window.addEventListener("wf:cookies", open);
    return () => window.removeEventListener("wf:cookies", open);
  }, []);

  function respond(accepted: boolean) {
    setConsentCookie(accepted ? "true" : "false");
    // Retrait : on efface aussi le cookie de suivi déjà posé
    if (!accepted) document.cookie = "wf_aff=; max-age=0; path=/; secure; samesite=none";
    applyConsent(accepted);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div data-no-print className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card p-4 shadow-lg">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {t("cookies.message")}{" "}
          <Link to="/confidentialite" className="underline hover:text-foreground">
            {t("cookies.learnMore")}
          </Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <Button size="sm" className="min-w-24 bg-ink text-surface hover:bg-ink/90" onClick={() => respond(false)}>
            {t("cookies.decline")}
          </Button>
          <Button size="sm" className="min-w-24 bg-ink text-surface hover:bg-ink/90" onClick={() => respond(true)}>
            {t("cookies.accept")}
          </Button>
        </div>
      </div>
    </div>
  );
}
