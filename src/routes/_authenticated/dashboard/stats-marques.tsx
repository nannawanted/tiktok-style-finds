import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation, type TKey } from "@/lib/i18n";
import { useIsAdmin } from "@/lib/social";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, fmt, PeriodTabs, StatsHeader, trend, type Period } from "@/components/stats/StatsUI";

export const Route = createFileRoute("/_authenticated/dashboard/stats-marques")({
  head: () => ({ meta: [{ title: "Marques — Wanted Fashion" }, { name: "robots", content: "noindex" }] }),
  component: BrandsAdmin,
});

type Row = { brand: string; domain: string | null; clicks: number; visitors: number; looks: number; creators: number; prev_clicks: number };
type Filter = "all" | "prospect" | "partner";

const host = (url: string | null | undefined) => {
  try {
    return url ? new URL(url).hostname.replace(/^www\./, "").toLowerCase() : "";
  } catch {
    return "";
  }
};

/** Admin : ce que WantedFashion envoie à chaque marque — l'outil pour négocier les partenariats. */
function BrandsAdmin() {
  const { t } = useTranslation();
  const { data: isAdmin, isLoading: checking } = useIsAdmin();
  const [days, setDays] = useState<Period>(30);
  const [filter, setFilter] = useState<Filter>("all");

  const { data: rows, isLoading } = useQuery({
    queryKey: ["brand-click-stats", days],
    enabled: !!isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("brand_click_stats" as never, { p_days: days } as never);
      if (error) throw error;
      return ((data ?? []) as Row[]).map((r) => ({ ...r, clicks: Number(r.clicks), visitors: Number(r.visitors), looks: Number(r.looks), creators: Number(r.creators), prev_clicks: Number(r.prev_clicks) }));
    },
  });
  // Marques déjà partenaires (enregistrées dans la page Marques partenaires)
  const { data: partners } = useQuery({
    queryKey: ["partner-domains"],
    enabled: !!isAdmin,
    queryFn: async () => {
      const { data } = await supabase.from("brands_public").select("website_url");
      return new Set((data ?? []).map((b) => host(b.website_url)).filter(Boolean));
    },
  });

  if (!checking && !isAdmin) {
    return (
      <main className="mx-auto max-w-3xl px-4 pt-6">
        <Empty text={t("stats.forbidden")} />
      </main>
    );
  }

  const list = (rows ?? []).filter((r) => r.clicks > 0);
  const isPartner = (r: Row) => !!r.domain && !!partners?.has(r.domain.toLowerCase().replace(/^www\./, ""));
  const shown = list.filter((r) => (filter === "all" ? true : filter === "partner" ? isPartner(r) : !isPartner(r)));
  const total = list.reduce((n, r) => n + r.clicks, 0);
  const totalPrev = list.reduce((n, r) => n + r.prev_clicks, 0);
  const change = trend(total, totalPrev);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 px-4 pb-10 pt-4 md:pt-8">
      <StatsHeader title={t("brandsAdmin.title")} back="/dashboard/stats" right={<span className="rounded-full bg-primary px-2.5 py-1 text-[11px] font-bold text-primary-foreground">Admin</span>} />
      <PeriodTabs value={days} onChange={setDays} />

      <div className="flex flex-col gap-1.5 rounded-3xl bg-ink p-[18px] text-surface">
        <span className="text-[13px] text-surface/75">{t("brandsAdmin.sent").replace("{n}", String(days))}</span>
        <span className="font-display text-[40px] font-bold leading-none tabular-nums">
          {fmt(total)} {t("brandsAdmin.visitors")}
        </span>
        <span className="text-sm text-surface/85">
          {t("brandsAdmin.toBrands").replace("{n}", String(list.length))}
          {change !== null && ` · ${change >= 0 ? "↑" : "↓"} ${Math.abs(change)} %`}
        </span>
      </div>

      <div className="flex items-center gap-2 rounded-2xl bg-surface px-3 py-2.5">
        <ShieldCheck className="h-[18px] w-[18px] shrink-0 text-emerald-700" aria-hidden="true" />
        <span className="text-[13px] leading-snug">{t("brandsAdmin.reliable")}</span>
      </div>

      <div className="flex gap-1.5">
        {(["all", "prospect", "partner"] as const).map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={filter === k}
            onClick={() => setFilter(k)}
            className={`h-10 flex-1 rounded-full text-[13px] font-semibold ${filter === k ? "bg-ink text-surface" : "bg-surface"}`}
          >
            {t(`brandsAdmin.f_${k}` as TKey)}
          </button>
        ))}
      </div>

      {isLoading ? (
        Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-[22px]" />)
      ) : shown.length === 0 ? (
        <Empty text={t("brandStats.empty")} />
      ) : (
        shown.map((r) => {
          const ch = trend(r.clicks, r.prev_clicks);
          const partner = isPartner(r);
          return (
            <div key={r.brand} className="flex flex-col gap-3 rounded-[22px] bg-surface p-3.5">
              <div className="flex items-center gap-3">
                <span className="font-display flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-ink text-xl font-bold capitalize text-surface">{r.brand[0]}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base font-bold capitalize">{r.brand}</span>
                  <span className="block truncate text-xs text-foreground/60">
                    {r.looks} {t("brandStats.looks")} · {r.creators} {t("brandStats.creators")}
                    {r.domain ? ` · ${r.domain}` : ""}
                  </span>
                </span>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${partner ? "bg-emerald-700 text-white" : "bg-background text-foreground/70"}`}>
                  {partner ? t("brandsAdmin.partner") : t("brandsAdmin.prospect")}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-center">
                <span className="flex flex-col">
                  <b className="text-lg tabular-nums">{fmt(r.clicks)}</b>
                  <span className="text-[11px] text-foreground/60">{t("brandStats.clicks")}</span>
                </span>
                <span className="flex flex-col">
                  <b className="text-lg tabular-nums">{fmt(r.visitors)}</b>
                  <span className="text-[11px] text-foreground/60">{t("stats.people")}</span>
                </span>
                <span className="flex flex-col">
                  <b className={`text-lg ${ch === null ? "text-foreground/45" : ch >= 0 ? "text-emerald-700" : "text-destructive"}`}>
                    {ch === null ? "—" : `${ch >= 0 ? "↑" : "↓"} ${Math.abs(ch)} %`}
                  </b>
                  <span className="text-[11px] text-foreground/60">{t("brandsAdmin.vsBefore")}</span>
                </span>
              </div>
              <Link
                to="/dashboard/rapport-marque"
                search={{ brand: r.brand, days }}
                className="flex h-11 items-center justify-center gap-2 rounded-full bg-ink text-sm font-bold text-surface"
              >
                <FileText className="h-4 w-4" aria-hidden="true" /> {t("brandsAdmin.createReport").replace("{brand}", r.brand)}
              </Link>
            </div>
          );
        })
      )}
    </main>
  );
}
