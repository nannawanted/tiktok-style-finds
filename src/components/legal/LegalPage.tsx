import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUp, ChevronRight, Printer } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { LEGAL_PAGES, type LegalPath } from "./legal-pages";

export type LegalSection = {
  id: string;
  title: string;
  /** « En bref » : une phrase simple en haut de la section. */
  short?: ReactNode;
  body: ReactNode;
};

/**
 * Mise en page commune des pages juridiques, sur le modèle des centres juridiques des grandes plateformes
 * (Pinterest : résumé, sommaire, sections numérotées) : l'essentiel en haut, un sommaire cliquable,
 * un « En bref » par section, la version affichée et une version imprimable.
 */
export function LegalPage({
  path,
  title,
  updated,
  essentials,
  sections,
  intro,
}: {
  path: LegalPath;
  title: string;
  updated: string;
  essentials?: ReactNode[];
  sections: LegalSection[];
  intro?: ReactNode;
}) {
  const { t } = useTranslation();
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 900);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-4 pb-16 pt-6 text-[15px] leading-relaxed text-foreground md:pt-10">
      <nav aria-label={t("legal.hub")} data-no-print className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-primary">
        <Link to="/legal" className="hover:underline">
          {t("legal.hub")}
        </Link>
      </nav>
      <h1 className="font-display text-[34px] font-bold leading-[1.05] md:text-5xl">{title}</h1>
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded-full bg-surface px-3 py-1.5 text-xs font-semibold">
          {t("legal.version")} {updated}
        </span>
        <button
          type="button"
          onClick={() => window.print()}
          data-no-print
          className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-xs font-semibold hover:bg-card"
        >
          <Printer className="h-3.5 w-3.5" aria-hidden="true" /> {t("legal.print")}
        </button>
      </div>
      {intro && <div className="mt-4 text-foreground/80">{intro}</div>}

      {essentials && essentials.length > 0 && (
        <section aria-labelledby="essentials" className="mt-5 break-inside-avoid rounded-3xl bg-ink p-5 text-surface print:border print:border-neutral-400 print:bg-white print:text-black">
          <h2 id="essentials" className="text-base font-bold">
            {t("legal.essentials")}
          </h2>
          <ul className="mt-2 space-y-2 text-[14px] leading-snug">
            {essentials.map((e, i) => (
              <li key={i} className="flex gap-2.5">
                <span aria-hidden="true" className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-surface/70 print:bg-black" />
                <span>{e}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <nav id="sommaire" aria-labelledby="toc-title" className="mt-4 scroll-mt-24 rounded-3xl bg-surface p-4 sm:p-5">
        <h2 id="toc-title" className="text-sm font-bold">
          {t("legal.toc")}
        </h2>
        <ol className="mt-1.5">
          {sections.map((s, i) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="flex items-center justify-between gap-3 border-b border-border/60 py-2.5 text-[14px] last:border-0 hover:text-primary">
                <span>
                  <span className="mr-2 tabular-nums text-foreground/50">{i + 1}.</span>
                  {s.title}
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-foreground/40" aria-hidden="true" />
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="mt-4 space-y-3">
        {sections.map((s, i) => (
          <section key={s.id} id={s.id} aria-labelledby={`${s.id}-t`} className="scroll-mt-24 rounded-3xl bg-card p-5 sm:p-6 print:break-inside-auto print:border print:border-neutral-300">
            <h2 id={`${s.id}-t`} className="flex items-start gap-3 text-lg font-bold leading-snug">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-xs text-surface tabular-nums">{i + 1}</span>
              {s.title}
            </h2>
            {s.short && (
              <p className="mt-3 rounded-2xl border-l-4 border-primary bg-surface px-4 py-3 text-[14px] leading-snug">
                <strong>{t("legal.inShort")}</strong> {s.short}
              </p>
            )}
            <div className="legal-body mt-3 text-[14.5px] text-foreground/85">{s.body}</div>
          </section>
        ))}
      </div>

      <section data-no-print className="mt-8">
        <h2 className="text-sm font-bold">{t("legal.otherPages")}</h2>
        <ul className="mt-2 grid gap-2 sm:grid-cols-2">
          {LEGAL_PAGES.filter((p) => p.to !== path && p.visible).map((p) => (
            <li key={p.to}>
              <Link to={p.to} className="flex items-center justify-between rounded-2xl bg-surface px-4 py-3 text-[14px] font-semibold hover:bg-card">
                {t(p.title)}
                <ChevronRight className="h-4 w-4 text-foreground/40" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-6 text-xs text-foreground/55">{t("legal.disclaimer")}</p>

      {showTop && (
        <a
          href="#sommaire"
          data-no-print
          className="fixed bottom-5 right-4 z-40 inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2.5 text-[13px] font-bold text-surface shadow-lg"
        >
          <ArrowUp className="h-4 w-4" aria-hidden="true" /> {t("legal.toc")}
        </a>
      )}
    </main>
  );
}

/** Petit lien e-mail de contact, réutilisé dans les textes. */
export function ContactMail() {
  return (
    <a href="mailto:nannawanted@gmail.com" className="font-semibold text-primary underline">
      nannawanted@gmail.com
    </a>
  );
}
