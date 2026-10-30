import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation, type TKey } from "@/lib/i18n";
import { Skeleton } from "@/components/ui/skeleton";
import { BarRow, Card, Empty, fmt, PeriodTabs, SOURCE_KEYS, StatsHeader, type Period } from "@/components/stats/StatsUI";

export const Route = createFileRoute("/_authenticated/dashboard/stats/look/$id")({
  head: () => ({ meta: [{ title: "Statistiques du look — Wanted Fashion" }, { name: "robots", content: "noindex" }] }),
  component: LookStats,
});

type Look = {
  title: string;
  cover: string | null;
  created_at: string;
  views_total: number;
  people_total: number;
  views: number;
  people: number;
  clicks: number;
  clickers: number;
  likes: number;
  saved: number;
  sources: Record<string, number>;
  pieces: { id: string; name: string; brand: string | null; image_url: string | null; clicks: number }[];
  avg_views_mine: number | null;
};

/** Statistiques d'un look (comme « Voir les statistiques » sur un post Instagram). */
function LookStats() {
  const { t } = useTranslation();
  const { id } = Route.useParams();
  const [days, setDays] = useState<Period>(30);
  const { data: s, isLoading, isError } = useQuery({
    queryKey: ["look-stats", id, days],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("look_stats" as never, { p_post: id, p_days: days } as never);
      if (error) throw error;
      return data as unknown as Look | null;
    },
  });

  const times = s && s.avg_views_mine ? s.views_total / Number(s.avg_views_mine) : 0;
  const totalSources = s ? Object.values(s.sources).reduce((a, b) => a + Number(b), 0) : 0;
  const maxSource = s ? Math.max(1, ...Object.values(s.sources).map(Number)) : 1;
  const conv = s && s.people ? Math.round((s.clickers / s.people) * 1000) / 10 : 0;

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 px-4 pb-10 pt-4 md:pt-8">
      <StatsHeader title={t("stats.lookTitle")} back="/dashboard/stats" />
      {isError ? (
        <Empty text={t("stats.forbidden")} />
      ) : isLoading || !s ? (
        <Skeleton className="h-40 rounded-3xl" />
      ) : (
        <>
          <div className="flex items-center gap-3.5">
            <span className="h-[108px] w-[84px] shrink-0 overflow-hidden rounded-[18px] bg-card">
              {s.cover && <img src={s.cover} alt="" className="h-full w-full object-cover" />}
            </span>
            <div className="flex min-w-0 flex-col gap-1.5">
              <span className="font-display text-2xl font-bold leading-tight">{s.title}</span>
              <span className="text-[13px] text-foreground/60">
                {t("stats.publishedOn")} {new Date(s.created_at).toLocaleDateString("fr-BE", { day: "numeric", month: "short", year: "numeric" })} · {s.pieces.length}{" "}
                {s.pieces.length > 1 ? t("card.pieces") : t("card.piece")}
              </span>
              {times >= 1.5 && (
                <span className="self-start rounded-full bg-emerald-700 px-2.5 py-1 text-xs font-bold text-white">
                  {t("stats.timesMore").replace("{x}", String(Math.round(times * 10) / 10).replace(".", ","))}
                </span>
              )}
            </div>
          </div>

          <PeriodTabs value={days} onChange={setDays} />

          <div className="grid grid-cols-3 gap-2">
            {[
              { v: s.views, l: t("stats.views") },
              { v: s.people, l: t("stats.people") },
              { v: s.clicks, l: t("brandStats.clicks") },
              { v: s.likes, l: t("stats.likes") },
              { v: s.saved, l: t("stats.saved") },
              { v: s.views_total, l: t("stats.viewsTotal") },
            ].map((k) => (
              <div key={k.l} className="flex flex-col items-center rounded-[18px] bg-surface px-2 py-3 text-center">
                <span className="font-display text-[22px] font-bold tabular-nums">{fmt(k.v)}</span>
                <span className="text-[11px] font-semibold text-foreground/60">{k.l}</span>
              </div>
            ))}
          </div>

          <Card title={t("stats.funnel")}>
            <BarRow label={t("stats.funnelSaw")} value={fmt(s.people)} ratio={1} />
            <BarRow label={t("stats.funnelClicked")} value={fmt(s.clickers)} ratio={s.people ? s.clickers / s.people : 0} />
            <p className="text-[13px] text-foreground/60">{t("stats.conversion").replace("{pct}", String(conv).replace(".", ","))}</p>
          </Card>

          <Card title={t("stats.sourcesTitle")}>
            {totalSources === 0 ? (
              <Empty text={t("stats.noViewsYet")} />
            ) : (
              SOURCE_KEYS.filter((k) => Number(s.sources[k] ?? 0) > 0).map((k) => (
                <BarRow
                  key={k}
                  label={t(`stats.source_${k}` as TKey)}
                  value={`${Math.round((Number(s.sources[k]) / totalSources) * 100)} %`}
                  ratio={Number(s.sources[k]) / maxSource}
                />
              ))
            )}
          </Card>

          <Card title={t("stats.clicksPerPiece")}>
            {s.pieces.map((p) => (
              <div key={p.id} className="flex items-center gap-3 py-1">
                <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-card">
                  {p.image_url && <img src={p.image_url} alt="" className="h-full w-full object-cover" />}
                </span>
                <span className="min-w-0 flex-1">
                  {p.brand && <span className="block text-[11px] font-bold uppercase tracking-wider text-foreground/60">{p.brand}</span>}
                  <span className="block truncate text-sm font-semibold">{p.name}</span>
                </span>
                <span className="text-sm font-bold tabular-nums">{fmt(p.clicks)}</span>
              </div>
            ))}
          </Card>
        </>
      )}
    </main>
  );
}
