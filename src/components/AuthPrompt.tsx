import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { useTranslation, type TKey } from "@/lib/i18n";
import { Logo } from "./Logo";

const EVENT = "wf:ask-login";

/**
 * Demande de se connecter sans quitter la page, comme Instagram ou Pinterest : quand un visiteur
 * non connecté veut aimer, enregistrer, suivre ou signaler, une fenêtre s'ouvre en bas de l'écran
 * (« Créer un compte », « Se connecter », « Pas maintenant ») au lieu de l'envoyer de force sur la connexion.
 */
export function askLogin(reason: TKey) {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(EVENT, { detail: reason }));
}

/** Chemin interne sûr vers lequel revenir après la connexion. */
export function safeRedirect(raw: unknown): string | undefined {
  return typeof raw === "string" && raw.startsWith("/") && !raw.startsWith("//") && raw.length < 500 ? raw : undefined;
}

export function AuthPromptHost() {
  const { t } = useTranslation();
  const [reason, setReason] = useState<TKey | null>(null);
  const href = useRouterState({ select: (s) => s.location.href });

  useEffect(() => {
    const on = (e: Event) => setReason((e as CustomEvent<TKey>).detail);
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
  }, []);

  const close = () => setReason(null);
  return (
    <Drawer open={!!reason} onOpenChange={(o) => !o && close()} shouldScaleBackground={false}>
      <DrawerContent className="border-border bg-background">
        <div className="mx-auto flex w-full max-w-sm flex-col items-center px-5 pb-[calc(20px+env(safe-area-inset-bottom,0px))] pt-3 text-center">
          <Logo className="h-14" />
          <DrawerTitle className="mt-3 font-display text-2xl font-bold leading-tight">{reason ? t(reason) : ""}</DrawerTitle>
          <DrawerDescription className="mt-1.5 text-[14px] text-foreground/70">{t("authPrompt.text")}</DrawerDescription>
          <Link
            to="/signup"
            search={{ redirect: href }}
            onClick={close}
            className="mt-5 flex h-12 w-full items-center justify-center rounded-full bg-primary font-bold text-primary-foreground"
          >
            {t("authPrompt.signup")}
          </Link>
          <Link
            to="/login"
            search={{ redirect: href }}
            onClick={close}
            className="mt-2 flex h-12 w-full items-center justify-center rounded-full border border-border bg-surface font-bold"
          >
            {t("authPrompt.login")}
          </Link>
          <button type="button" onClick={close} className="mt-2 h-11 w-full text-[15px] font-semibold text-foreground/65">
            {t("authPrompt.later")}
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
