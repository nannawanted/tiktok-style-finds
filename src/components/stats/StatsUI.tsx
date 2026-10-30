import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

// Petites briques communes aux pages de statistiques (créateur, look, audience, marques).

export const PERIODS = [7, 30, 90] as const;
export type Period = (typeof PERIODS)[number];

export function fmt(n: number | null | undefined) {
  return new Intl.NumberFormat("fr-BE", { notation: "compact", maximumFractionDigits: 1 }).format(Number(n ?? 0));
}

/** Évolution en % par rapport à la période d'avant (null si pas de point de comparaison). */
export function trend(cur: number, prev: number): number | null {
  if (!prev) return null;
  return Math.round(((cur - prev) / prev) * 100);
}

export function StatsHeader({ title, back = "/dashboard", right }: { title: string; back?: string; right?: React.ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-3">
      <Link to={back} aria-label={t("studio.back")} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface">
        <ArrowLeft className="h-5 w-5" aria-hidden="true" />
      </Link>
      <h1 className="font-display min-w-0 flex-1 truncate text-3xl font-bold">{title}</h1>
      {right}
    </div>
  );
}

export function PeriodTabs({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  const { t } = useTranslation();
  return (
    <div role="tablist" aria-label={t("stats.period")} className="flex gap-1 rounded-full bg-surface p-1">
      {PERIODS.map((d) => (
        <button
          key={d}
          type="button"
          role="tab"
          aria-selected={value === d}
          onClick={() => onChange(d)}
          className={`h-10 flex-1 rounded-full text-sm font-semibold transition-colors ${value === d ? "bg-ink text-surface" : "text-foreground/70"}`}
        >
          {d} {t("brandStats.days")}
        </button>
      ))}
    </div>
  );
}

export function Kpi({ label, value, change, dark = false }: { label: string; value: string; change?: number | null; dark?: boolean }) {
  const { t } = useTranslation();
  return (
    <div className={`flex flex-col gap-1 rounded-[22px] p-3.5 ${dark ? "bg-ink text-surface" : "bg-surface"}`}>
      <span className={`text-xs font-semibold ${dark ? "text-surface/75" : "text-foreground/65"}`}>{label}</span>
      <span className="font-display text-[28px] font-bold leading-tight tabular-nums">{value}</span>
      {change !== undefined && (
        <span className={`text-xs font-bold ${change === null ? (dark ? "text-surface/60" : "text-foreground/45") : change >= 0 ? "text-emerald-700" : "text-destructive"}`}>
          {change === null ? t("stats.noCompare") : `${change >= 0 ? "↑" : "↓"} ${Math.abs(change)} %`}
        </span>
      )}
    </div>
  );
}

export function Card({ title, aside, children }: { title: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-3xl bg-surface p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-base font-bold">{title}</h2>
        {aside && <span className="shrink-0 text-xs text-foreground/60">{aside}</span>}
      </div>
      {children}
    </section>
  );
}

/** Barres verticales (vues par jour, heures, semaines). La dernière / la meilleure est mise en couleur. */
export function Bars({ values, highlight, height = 120, labels }: { values: number[]; highlight?: (i: number) => boolean; height?: number; labels?: string[] }) {
  const max = Math.max(1, ...values);
  return (
    <div>
      <div className="flex items-end gap-[3px]" style={{ height }} aria-hidden="true">
        {values.map((v, i) => (
          <div
            key={i}
            className={`flex-1 rounded-t-[4px] rounded-b-[2px] ${highlight?.(i) ? "bg-primary" : "bg-[#c9ad8b]"}`}
            style={{ height: `${Math.max(v ? 4 : 2, Math.round((v / max) * 100))}%` }}
          />
        ))}
      </div>
      {labels && (
        <div className="mt-1.5 flex justify-between text-[11px] text-foreground/60">
          {labels.map((l, i) => (
            <span key={i}>{l}</span>
          ))}
        </div>
      )}
    </div>
  );
}

/** Ligne « libellé ……… valeur » avec une barre horizontale. */
export function BarRow({ label, value, ratio }: { label: string; value: string; ratio: number }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between gap-3 text-sm">
        <span className="min-w-0 truncate font-semibold">{label}</span>
        <span className="shrink-0 text-foreground/65">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-background">
        <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(2, Math.round(ratio * 100))}%` }} />
      </div>
    </div>
  );
}

export function Empty({ text }: { text: string }) {
  return <p className="rounded-2xl border-[1.5px] border-dashed border-border p-5 text-center text-sm text-foreground/60">{text}</p>;
}

export const SOURCE_KEYS = ["feed", "search", "profile", "external", "other"] as const;
