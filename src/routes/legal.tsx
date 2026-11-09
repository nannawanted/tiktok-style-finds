import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, Cookie, FileText, Gavel, Landmark, Lock, ShieldCheck, Users } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { LEGAL_PAGES, type LegalPath } from "@/components/legal/legal-pages";
import { ContactMail } from "@/components/legal/LegalPage";
import { LEGAL_UPDATED } from "@/lib/legal";

export const Route = createFileRoute("/legal")({
  head: () => ({ meta: [{ title: "Centre juridique — Wanted Fashion" }] }),
  component: LegalHub,
});

const ICONS: Record<LegalPath, typeof FileText> = {
  "/conditions": FileText,
  "/regles": Users,
  "/confidentialite": Lock,
  "/cookies": Cookie,
  "/droits-auteur": ShieldCheck,
  "/dsa": Gavel,
  "/mentions-legales": Landmark,
};

/** Page d'accueil des pages juridiques (sur le modèle de policy.pinterest.com). */
function LegalHub() {
  const { t } = useTranslation();
  return (
    <main className="mx-auto max-w-3xl px-4 pb-16 pt-6 md:pt-10">
      <h1 className="font-display text-[38px] font-bold leading-[1.05] md:text-5xl">{t("legal.hub")}</h1>
      <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-foreground/75">{t("legal.hubIntro")}</p>
      <p className="mt-2 text-xs font-semibold text-foreground/55">
        {t("legal.version")} {LEGAL_UPDATED}
      </p>

      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {LEGAL_PAGES.filter((p) => p.visible).map((p) => {
          const Icon = ICONS[p.to];
          return (
            <li key={p.to}>
              <Link to={p.to} className="group flex h-full gap-4 rounded-3xl bg-card p-5 transition-colors hover:bg-surface">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-ink text-surface">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2 font-bold">
                    {t(p.title)}
                    <ChevronRight className="h-4 w-4 shrink-0 text-foreground/40 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </span>
                  <span className="mt-1 block text-[13.5px] leading-snug text-foreground/70">{t(p.desc)}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      <section className="mt-6 rounded-3xl bg-surface p-5">
        <h2 className="font-bold">{t("legal.contactTitle")}</h2>
        <p className="mt-1 text-[14px] text-foreground/75">
          {t("legal.contactText")} <ContactMail />
        </p>
      </section>
      <p className="mt-6 text-xs text-foreground/55">{t("legal.disclaimer")}</p>
    </main>
  );
}
