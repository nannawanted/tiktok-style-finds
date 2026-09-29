import { useEffect, useRef } from "react";

const SITE_KEY = "0x4AAAAAAFJZDolOCQcIxVzi";
const SCRIPT_ID = "cf-turnstile-script";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: { sitekey: string; callback: (token: string) => void; "expired-callback"?: () => void }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

function loadTurnstileScript(): Promise<void> {
  if (document.getElementById(SCRIPT_ID)) return Promise.resolve();
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    script.async = true;
    script.onload = () => resolve();
    document.head.appendChild(script);
  });
}

// Widget anti-bot Cloudflare Turnstile — à utiliser sur tout futur formulaire
// public sensible (inscription, connexion, etc.). Appelle onToken(token) une
// fois résolu ; le token doit être transmis à supabase.auth.signUp/
// signInWithPassword via options.captchaToken.
export function TurnstileWidget({ onToken }: { onToken: (token: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadTurnstileScript().then(() => {
      if (cancelled || !containerRef.current || !window.turnstile) return;
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: SITE_KEY,
        callback: onToken,
        "expired-callback": () => onToken(""),
      });
    });
    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) window.turnstile.remove(widgetIdRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} className="my-2" />;
}
