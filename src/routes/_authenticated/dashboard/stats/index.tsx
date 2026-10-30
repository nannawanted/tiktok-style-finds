import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Lightbulb, Store } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/i18n";
import { useIsAdmin } from "@/lib/social";
import { styleLabelKey, isStyleKey } from "@/lib/styles";
import { Skeleton } from "@/components/ui/skeleton";
import { Bars, BarRow, Card, Empty, fmt, Kpi, PeriodTabs, StatsHeader, trend, type Period } from "@/components/stats/StatsUI";

export const Route = createFileRoute("/_authenticated/dashboard/stats/")({
  head: () => ({ meta: [{ title: "Statistiques — Wanted Fashion" }, { name: "robots", content: "noindex" }] }),
  component: CreatorStats,
});

type Stats = {
  days: number;
  views: number;
  views_prev: number;
  people: number;
  people_prev: number;
  clicks: number;
  clicks_prev: number;
  followers: number;
  followers_prev: number;
  likes: number;
  series: { day: string; views: number }[];
  top_looks: { id: string; title: string; cover: string | null; views: number; clicks: number }[];
  top_pieces: { id: string; name: string; brand: string | null; clicks: number }[];
  best_style: { style: string; ratio: number } | null;
  peak_hour: number | null;
};

/** Statistiques du créateur (comme Instagram Insights / TikTok Analytics). */
function CreatorStats() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: isAdmin } = useIsAdmin();
  const [days, setDays] = useState<Period>(30);
  const { data, isLoading } = useQuery({
    queryKey: ["creator-stats", user?.id, days],
    enabled: !!user,
    queryFn: async () => {
      const { data: d, error } = await supabase.rpc("creator_stats" as never, { p_days: days } as never);
      if (error) throw error;
      return d as unknown as Stats;
    },
  });

  const s = data;
  const series = s?.series ?? [];
  const label = (iso: string) => new Date(iso).toLocaleDateString("fr-BE", { day: "numeric", month: "short" });
  const tip = [
    s?.best_style && s.best_style.ratio >= 1.2 && isStyleKey(s.best_style.style)
      ? t("stats.tipStyle").replace("{style}", t(styleLabelKey(s.best_style.style))).replace("{x}", String(s.best_style.ratio).replace(".", ","))
      : null,
    s?.peak_hour != null ? t("stats.tipHour").replace("{from}", String(s.peak_hour)).replace("{to}", String((s.peak_hour + 2) % 24)) : null,
  ].filter(Boolean) as string[];
  const maxPiece = Math.max(1, ...(s?.top_pieces ?? []).map((p) => Number(p.clicks)));

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 px-4 pb-10 pt-4 md:pt-8">
      <StatsHeader
        title={t("stats.title")}
        right={
          isAdmin ? (
            <Link to="/dashboard/stats-marques" aria-label={t("brandStats.title")} className="flex h-11 w-11 items-center justify-center rounded-full bg-surface">
              <Store className="h-5 w-5" aria-hidden="true" />
            </Link>
          ) : undefined
        }
      />
      <PeriodTabs value={days} onChange={setDays} />

      {isLoading || !s ? (
        <div className="grid grid-cols-2 gap-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-[22px]" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2.5">
            <Kpi label={t("stats.views")} value={fmt(s.views)} change={trend(s.views, s.views_prev)} />
            <Kpi label={t("stats.people")} value={fmt(s.people)} change={trend(s.people, s.people_prev)} />
            <Kpi label={t("stats.clicks")} value={fmt(s.clicks)} change={trend(s.clicks, s.clicks_prev)} />
            <Kpi label={t("stats.newFollowers")} value={`+${fmt(s.followers)}`} change={trend(s.followers, s.followers_prev)} />
          </div>

          <Card title={t("stats.viewsPerDay")} aside={t("stats.lastDays").replace("{n}", String(days))}>
            {s.views === 0 ? (
              <Empty text={t("stats.noViewsYet")} />
            ) : (
              <Bars
                values={series.map((x) => Number(x.views))}
                highlight={(i) => i === series.length - 1}
                labels={series.length ? [label(series[0].day), label(series[Math.floor(series.length / 2)].day), label(series[series.length - 1].day)] : undefined}
              />
            )}
          </Card>

          {tip.length > 0 && (
            <div className="flex gap-3 rounded-3xl bg-ink p-4 text-surface">
              <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-[#f0b9a0]" aria-hidden="true" />
              <div>
                <p className="font-bold">{t("stats.whatWorks")}</p>
                <p className="mt-1 text-sm leading-relaxed text-surface/85">{tip.join(" ")}</p>
              </div>
            </div>
          )}

          <section className="flex flex-col gap-2.5">
            <h2 className="text-base font-bold">{t("stats.bestLooks")}</h2>
            {s.top_looks.length === 0 ? (
              <Empty text={t("stats.noLooksYet")} />
            ) : (
              s.top_looks.map((l) => (
                <Link key={l.id} to="/dashboard/stats/look/$id" params={{ id: l.id }} className="flex items-center gap-3 rounded-[20px] bg-surface p-2.5">
                  <span className="h-16 w-[52px] shrink-0 overflow-hidden rounded-[14px] bg-card">
                    {l.cover && <img src={l.cover} alt="" className="h-full w-full object-cover" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold">{l.title}</span>
                    <span className="block text-xs text-foreground/60">
                      {fmt(l.views)} {t("views.plural")} · {fmt(l.clicks)} {t("brandStats.clicks")}
                    </span>
                  </span>
                  <ChevronRight className="h-5 w-5 text-foreground/50" aria-hidden="true" />
                </Link>
              ))
            )}
          </section>

          <Card title={t("stats.topPieces")}>
            {s.top_pieces.length === 0 ? (
              <Empty text={t("stats.noClicksYet")} />
            ) : (
              s.top_pieces.map((p) => (
                <BarRow key={p.id} label={p.brand ? `${p.name} · ${p.brand}` : p.name} value={`${fmt(p.clicks)} ${t("brandStats.clicks")}`} ratio={Number(p.clicks) / maxPiece} />
              ))
            )}
          </Card>

          <Link to="/dashboard/stats/audience" className="flex h-[52px] items-center justify-center rounded-full bg-ink text-[15px] font-bold text-surface">
            {t("stats.seeAudience")}
          </Link>
        </>
      )}
    </main>
  );
}
