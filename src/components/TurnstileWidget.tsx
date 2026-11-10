import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/lib/i18n";

const SITE_KEY = "0x4AAAAAAFJZDolOCQcIxVzi";
const SCRIPT_ID = "cf-turnstile-script";

type TurnstileOptions = {
  sitekey: string;
  callback: (token: string) => void;
  "expired-callback"?: () => void;
  "error-callback"?: (code: string) => boolean | void;
  appearance?: "always" | "execute" | "interaction-only";
  theme?: "light" | "dark" | "auto";
  language?: string;
  "refresh-expired"?: "auto" | "manual" | "never";
};

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: TurnstileOptions) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

function loadTurnstileScript(): Promise<void> {
  const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
  if (existing && window.turnstile) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = existing ?? document.createElement("script");
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", () => reject(new Error("turnstile_script")), { once: true });
    if (!existing) {
      script.id = SCRIPT_ID;
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      document.head.appendChild(script);
    }
  });
}

/**
 * Vérification anti-robot Cloudflare Turnstile (inscription, connexion).
 * Réglée comme le recommande Cloudflare : invisible pour la plupart des gens (« interaction-only »),
 * une case n'apparaît que si Cloudflare a un doute. Un jeton ne sert qu'une seule fois : après chaque
 * essai, le parent change `resetKey` pour en demander un nouveau.
 */
export function TurnstileWidget({
  onToken,
  onError,
  resetKey = 0,
}: {
  onToken: (token: string) => void;
  /** Appelé si Cloudflare ne répond pas : le formulaire ne reste pas bloqué, Supabase tranchera. */
  onError?: (failed: boolean) => void;
  resetKey?: number;
}) {
  const { t, lang } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setFailed(null);
    onError?.(false);
    onToken("");
    let got = false;
    // Cloudflare injoignable (bloqueur, réseau) : au bout de 12 s, on ne bloque plus le bouton
    const slow = setTimeout(() => !got && !cancelled && onError?.(true), 12_000);
    loadTurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return;
        if (widgetIdRef.current) window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: SITE_KEY,
          appearance: "interaction-only",
          theme: "light",
          language: lang === "en" ? "en" : "fr",
          "refresh-expired": "auto",
          callback: (token) => {
            got = true;
            setFailed(null);
            onError?.(false);
            onToken(token);
          },
          "expired-callback": () => onToken(""),
          "error-callback": (code) => {
            console.warn("[turnstile] erreur", code);
            setFailed(code || "error");
            onError?.(true);
            onToken("");
            return true;
          },
        });
      })
      .catch(() => {
        if (cancelled) return;
        setFailed("script");
        onError?.(true);
      });
    return () => {
      cancelled = true;
      clearTimeout(slow);
      if (widgetIdRef.current && window.turnstile) window.turnstile.remove(widgetIdRef.current);
      widgetIdRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  return (
    <div>
      <div ref={containerRef} className="flex justify-center empty:hidden" />
      {failed && (
        <p role="alert" className="mt-2 rounded-xl bg-destructive/10 px-3 py-2 text-[13px] text-destructive">
          {t("auth.captchaFailed")} <span className="opacity-60">({failed})</span>
        </p>
      )}
    </div>
  );
}

/** L'erreur renvoyée par Supabase vient-elle de la vérification anti-robot ? */
export const isCaptchaError = (message: string | undefined) => /captcha/i.test(message ?? "");
