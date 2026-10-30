import { useTranslation } from "@/lib/i18n";
import { isStyleKey, styleLabelKey } from "@/lib/styles";
import { fmt, trend } from "./StatsUI";

export type BrandReport = {
  brand: string;
  domain: string | null;
  days: number;
  period_start: string;
  period_end: string;
  clicks: number;
  clicks_prev: number;
  visitors: number;
  looks: number;
  creators: number;
  look_views: number;
  weeks: { start: string; clicks: number }[];
  products: { name: string; clicks: number }[];
  styles: { style: string; n: number }[];
  top_looks: { id: string; title: string; cover: string | null; creator: string; clicks: number }[];
  shared_at?: string;
};

const d = (iso: string) => new Date(iso).toLocaleDateString("fr-BE", { day: "numeric", month: "long", year: "numeric" });

/**
 * Rapport de performance pour une marque (comme ceux d'Awin / LTK) : uniquement des
 * chiffres agrégés, aucune donnée sur les visiteurs. Prévu pour l'écran ET l'impression (PDF).
 */
export function BrandReportView({ r }: { r: BrandReport }) {
  const { t } = useTranslation();
  const change = trend(Number(r.clicks), Number(r.clicks_prev));
  const maxWeek = Math.max(1, ...r.weeks.map((w) => Number(w.clicks)));
  const totalStyles = r.styles.reduce((n, s) => n + Number(s.n), 0);
  const kpis = [
    { label: t("brandReport.kVisitors"), value: fmt(r.clicks), sub: t("brandReport.kVisitorsSub").replace("{domain}", r.domain ?? r.brand), dark: true },
    { label: t("brandReport.kPeople"), value: fmt(r.visitors), sub: t("brandReport.kPeopleSub") },
    { label: t("brandReport.kLooks"), value: fmt(r.looks), sub: t("brandReport.kLooksSub").replace("{n}", fmt(r.look_views)) },
    { label: t("brandReport.kCreators"), value: fmt(r.creators), sub: t("brandReport.kCreatorsSub").replace("{brand}", r.brand) },
  ];

  return (
    <article className="mx-auto flex w-full max-w-[860px] flex-col gap-6 rounded-[28px] bg-[#f6efe4] p-5 text-ink sm:p-10 print:rounded-none print:p-0">
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-bold uppercase tracking-[0.14em] text-primary">{t("brandReport.eyebrow")}</span>
        <h1 className="font-display text-3xl font-bold leading-tight sm:text-[44px]">{t("brandReport.title").replace("{brand}", r.brand)}</h1>
        <span className="text-[15px] text-foreground/65">
          {d(r.period_start)} – {d(r.period_end)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className={`flex flex-col gap-1 rounded-[22px] p-4 ${k.dark ? "bg-ink text-surface" : "border border-[#e6d5bb] bg-[#fffaf2]"}`}>
            <span className="text-xs font-semibold opacity-80">{k.label}</span>
            <span className="font-display text-[32px] font-bold leading-tight tabular-nums">{k.value}</span>
            <span className="text-xs font-semibold opacity-80">{k.sub}</span>
          </div>
        ))}
      </div>

      <section className="flex break-inside-avoid flex-col gap-3 rounded-3xl border border-[#e6d5bb] bg-[#fffaf2] p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-bold">{t("brandReport.perWeek").replace("{domain}", r.domain ?? r.brand)}</h2>
          {change !== null && (
            <span className="text-[13px] text-foreground/65">
              {change >= 0 ? "↑" : "↓"} {Math.abs(change)} % {t("brandReport.vsBefore")}
            </span>
          )}
        </div>
        <div className="flex h-[170px] items-end gap-3 sm:gap-5" aria-hidden="true">
          {r.weeks.map((w, i) => (
            <div key={w.start} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
              <span className="text-[13px] font-bold tabular-nums">{fmt(w.clicks)}</span>
              <div
                className={`w-full rounded-t-[10px] rounded-b-[4px] ${i === r.weeks.length - 1 ? "bg-primary" : "bg-[#c9ad8b]"}`}
                style={{ height: `${Math.max(3, Math.round((Number(w.clicks) / maxWeek) * 110))}px` }}
              />
              <span className="text-xs text-foreground/60">{new Date(w.start).toLocaleDateString("fr-BE", { day: "numeric", month: "short" })}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="flex break-inside-avoid flex-col gap-3 rounded-3xl border border-[#e6d5bb] bg-[#fffaf2] p-5">
          <h2 className="text-[17px] font-bold">{t("brandReport.topProducts")}</h2>
          {r.products.length === 0 ? (
            <p className="text-sm text-foreground/60">—</p>
          ) : (
            r.products.map((p) => (
              <div key={p.name} className="flex justify-between gap-3 border-b border-[#efe3d1] pb-2 text-sm">
                <span className="min-w-0 truncate font-semibold">{p.name}</span>
                <span className="shrink-0 text-foreground/65">
                  {fmt(p.clicks)} {t("brandStats.clicks")}
                </span>
              </div>
            ))
          )}
        </section>
        <section className="flex break-inside-avoid flex-col gap-3 rounded-3xl border border-[#e6d5bb] bg-[#fffaf2] p-5">
          <h2 className="text-[17px] font-bold">{t("brandReport.styles").replace("{brand}", r.brand)}</h2>
          {r.styles.map((s) => (
            <div key={s.style} className="flex items-center gap-2.5">
              <span className="w-28 shrink-0 text-sm font-semibold">{isStyleKey(s.style) ? t(styleLabelKey(s.style)) : s.style}</span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#efe3d1]">
                <div className="h-full rounded-full bg-primary" style={{ width: `${Math.round((Number(s.n) / Math.max(1, totalStyles)) * 100)}%` }} />
              </div>
              <span className="w-10 text-right text-[13px] text-foreground/65">{Math.round((Number(s.n) / Math.max(1, totalStyles)) * 100)} %</span>
            </div>
          ))}
        </section>
      </div>

      {r.top_looks.length > 0 && (
        <section className="flex break-inside-avoid flex-col gap-3">
          <h2 className="text-[17px] font-bold">{t("brandReport.topLooks")}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {r.top_looks.map((l) => (
              <div key={l.id} className="flex flex-col gap-1.5">
                <div className="aspect-[3/4] overflow-hidden rounded-2xl bg-card">{l.cover && <img src={l.cover} alt="" className="h-full w-full object-cover" />}</div>
                <span className="line-clamp-2 text-[13px] font-semibold">{l.title}</span>
                <span className="text-xs text-foreground/60">
                  @{l.creator} · {fmt(l.clicks)} {t("brandStats.clicks")}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <footer className="flex break-inside-avoid flex-col gap-4 border-t border-[#e6d5bb] pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-[480px] text-xs leading-relaxed text-foreground/65">{t("brandReport.method").replace("{domain}", r.domain ?? r.brand)}</p>
        <a href="mailto:nannawanted@gmail.com" className="shrink-0 rounded-full bg-ink px-5 py-3.5 text-center text-sm font-bold text-surface">
          {t("brandReport.partner")} · nannawanted@gmail.com
        </a>
      </footer>
    </article>
  );
}
