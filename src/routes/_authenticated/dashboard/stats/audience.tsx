import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useTranslation, type TKey } from "@/lib/i18n";
import { isStyleKey, styleLabelKey } from "@/lib/styles";
import { Skeleton } from "@/components/ui/skeleton";
import { BarRow, Bars, Card, Empty, fmt, SOURCE_KEYS, StatsHeader } from "@/components/stats/StatsUI";

export const Route = createFileRoute("/_authenticated/dashboard/stats/audience")({
  head: () => ({ meta: [{ title: "Ton audience — Wanted Fashion" }, { name: "robots", content: "noindex" }] }),
  component: Audience,
});

type AudienceData = {
  followers: number;
  followers_new: number;
  friends: number;
  hours: number[];
  styles: { style: string; n: number }[];
  viewers: number;
  loyal: number;
  sources: Record<string, number>;
};

/** Audience du créateur : abonnés, heures d'activité, styles aimés, fidélité, provenance. */
function Audience() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: a, isLoading } = useQuery({
    queryKey: ["creator-audience", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("creator_audience" as never, { p_days: 30 } as never);
      if (error) throw error;
      return data as unknown as AudienceData;
    },
  });

  const hours = (a?.hours ?? []).map(Number);
  const best = hours.length ? hours.indexOf(Math.max(...hours)) : -1;
  const totalStyles = (a?.styles ?? []).reduce((n, s) => n + Number(s.n), 0);
  const loyalPct = a && a.viewers ? Math.round((a.loyal / a.viewers) * 100) : 0;
  const totalSources = a ? Object.values(a.sources).reduce((x, y) => x + Number(y), 0) : 0;
  const maxSource = a ? Math.max(1, ...Object.values(a.sources).map(Number)) : 1;

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 px-4 pb-10 pt-4 md:pt-8">
      <StatsHeader title={t("stats.audienceTitle")} back="/dashboard/stats" />
      {isLoading || !a ? (
        <Skeleton className="h-40 rounded-3xl" />
      ) : (
        <>
          <div className="flex flex-col gap-1 rounded-3xl bg-ink p-[18px] text-surface">
            <span className="text-[13px] font-semibold text-surface/75">{t("social.followersTitle")}</span>
            <span className="font-display text-[40px] font-bold leading-none tabular-nums">{fmt(a.followers)}</span>
            <span className="text-[13px] font-bold text-[#9fd3a8]">
              +{fmt(a.followers_new)} {t("stats.thisMonth")} · {fmt(a.friends)} {t("stats.friends")}
            </span>
          </div>

          <Card title={t("stats.whenActive")} aside={t("stats.perHour")}>
            {hours.every((h) => h === 0) ? (
              <Empty text={t("stats.noViewsYet")} />
            ) : (
              <>
                <Bars values={hours} height={90} highlight={(i) => Math.abs(i - best) <= 1} labels={["0 h", "6 h", "12 h", "18 h", "23 h"]} />
                <p className="text-sm font-semibold">{t("stats.bestTime").replace("{from}", String(best)).replace("{to}", String((best + 2) % 24))}</p>
              </>
            )}
          </Card>

          <Card title={t("stats.stylesLoved")}>
            {totalStyles === 0 ? (
              <Empty text={t("stats.noFollowersYet")} />
            ) : (
              <div className="flex flex-wrap gap-2">
                {a.styles.map((s, i) => (
                  <span key={s.style} className={`rounded-full px-3.5 py-2 text-sm font-semibold ${i === 0 ? "bg-ink text-surface" : "bg-background"}`}>
                    {isStyleKey(s.style) ? t(styleLabelKey(s.style)) : s.style} · {Math.round((Number(s.n) / totalStyles) * 100)} %
                  </span>
                ))}
              </div>
            )}
          </Card>

          <Card title={t("stats.loyalTitle")}>
            {a.viewers === 0 ? (
              <Empty text={t("stats.noViewsYet")} />
            ) : (
              <>
                <div className="flex h-4 overflow-hidden rounded-full">
                  <div className="bg-primary" style={{ width: `${100 - loyalPct}%` }} />
                  <div className="flex-1 bg-[#8e6f55]" />
                </div>
                <div className="flex justify-between text-[13px]">
                  <span>
                    <b>{100 - loyalPct} %</b> {t("stats.discover")}
                  </span>
                  <span>
                    <b>{loyalPct} %</b> {t("stats.comeBack")}
                  </span>
                </div>
              </>
            )}
          </Card>

          <Card title={t("stats.howFound")} aside={t("stats.lastDays").replace("{n}", "30")}>
            {totalSources === 0 ? (
              <Empty text={t("stats.noViewsYet")} />
            ) : (
              SOURCE_KEYS.filter((k) => Number(a.sources[k] ?? 0) > 0).map((k) => (
                <BarRow key={k} label={t(`stats.source_${k}` as TKey)} value={`${Math.round((Number(a.sources[k]) / totalSources) * 100)} %`} ratio={Number(a.sources[k]) / maxSource} />
              ))
            )}
          </Card>
        </>
      )}
    </main>
  );
}
