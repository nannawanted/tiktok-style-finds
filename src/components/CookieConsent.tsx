import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

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

// Bandeau de consentement pour le cookie de suivi d'affiliation (wf_aff),
// qui n'est posé (voir src/lib/affiliate-redirect.ts) que si ce consentement
// vaut "true". Le choix est lu côté serveur via ce même cookie wf_consent.
export function CookieConsent() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (readCookie(CONSENT_COOKIE) === null) setVisible(true);
  }, []);

  function respond(accepted: boolean) {
    setConsentCookie(accepted ? "true" : "false");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card p-4 shadow-lg">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {t("cookies.message")}{" "}
          <Link to="/confidentialite" className="underline hover:text-foreground">
            {t("cookies.learnMore")}
          </Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" onClick={() => respond(false)}>
            {t("cookies.decline")}
          </Button>
          <Button size="sm" className="bg-brand text-brand-foreground hover:bg-brand/90" onClick={() => respond(true)}>
            {t("cookies.accept")}
          </Button>
        </div>
      </div>
    </div>
  );
}
