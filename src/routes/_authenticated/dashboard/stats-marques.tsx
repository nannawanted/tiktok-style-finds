import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownRight, ArrowLeft, ArrowUpRight, Copy, MousePointerClick, Shirt, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/i18n";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/dashboard/stats-marques")({
  head: () => ({ meta: [{ title: "Stats marques — Wanted Fashion" }, { name: "robots", content: "noindex" }] }),
  component: BrandStats,
});

type Row = { brand: string; domain: string | null; clicks: number; visitors: number; looks: number; creators: number; prev_clicks: number };

const PERIODS = [7, 30, 90] as const;

/**
 * Admin : combien de clics WantedFashion envoie à chaque marque. Sert à
 * démarcher les marques (« on vous a envoyé X visiteurs ce mois-ci »).
 */
function BrandStats() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [days, setDays] = useState<(typeof PERIODS)[number]>(30);

  const { data: isAdmin } = useQuery({
    queryKey: ["is-admin", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("creators").select("is_admin").eq("id", user!.id).maybeSingle();
      return !!(data as { is_admin?: boolean } | null)?.is_admin;
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["brand-click-stats", days],
    enabled: !!isAdmin,
    queryFn: async () => {
      const { data: rows, error } = await supabase.rpc("brand_click_stats" as never, { p_days: days } as never);
      if (error) throw error;
      return ((rows ?? []) as Row[]).map((r) => ({ ...r, clicks: Number(r.clicks), visitors: Number(r.visitors), looks: Number(r.looks), creators: Number(r.creators), prev_clicks: Number(r.prev_clicks) }));
    },
  });

  const rows = (data ?? []).filter((r) => r.clicks > 0);
  const total = rows.reduce((n, r) => n + r.clicks, 0);
  const max = Math.max(1, ...rows.map((r) => r.clicks));

  function pitch(r: Row) {
    return t("brandStats.pitch")
      .replace("{days}", String(days))
      .replace("{clicks}", String(r.clicks))
      .replace("{visitors}", String(r.visitors))
      .replace("{brand}", r.brand)
      .replace("{looks}", String(r.looks))
      .replace("{creators}", String(r.creators));
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t("brandStats.copied"));
    } catch {
      toast(text);
    }
  }

  if (isAdmin === false) {
    return <main className="mx-auto max-w-2xl px-4 py-10 text-center text-foreground/70">{t("brandStats.adminOnly")}</main>;
  }

  return (
    <main className="mx-auto max-w-3xl px-4 pb-16 pt-4 md:pt-8">
      <div className="flex items-center gap-3">
        <Link to="/dashboard" aria-label={t("studio.back")} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface">
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </Link>
        <h1 className="font-display text-3xl font-bold">{t("brandStats.title")}</h1>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-foreground/65">{t("brandStats.intro")}</p>

      <div className="mt-5 flex items-center justify-between gap-3">
        <div className="flex gap-1 rounded-full bg-surface p-1" role="tablist">
          {PERIODS.map((d) => (
            <button
              key={d}
              type="button"
              role="tab"
              aria-selected={days === d}
              onClick={() => setDays(d)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${days === d ? "bg-ink text-surface" : "text-foreground/70"}`}
            >
              {d} {t("brandStats.days")}
            </button>
          ))}
        </div>
        <p className="text-right text-sm">
          <span className="block text-2xl font-bold tabular-nums">{total}</span>
          <span className="text-foreground/60">{t("brandStats.totalClicks")}</span>
        </p>
      </div>

      {isLoading ? (
        <div className="mt-5 space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-3xl" />)}</div>
      ) : rows.length === 0 ? (
        <p className="mt-6 rounded-3xl border-[1.5px] border-dashed border-border p-8 text-center text-sm text-foreground/65">{t("brandStats.empty")}</p>
      ) : (
        <ol className="mt-5 space-y-2.5">
          {rows.map((r, i) => {
            const trend = r.prev_clicks ? Math.round(((r.clicks - r.prev_clicks) / r.prev_clicks) * 100) : null;
            return (
              <li key={r.brand} className="rounded-3xl bg-surface p-4">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 w-6 shrink-0 text-center font-display text-lg font-bold text-foreground/40 tabular-nums">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[16px] font-bold capitalize">{r.brand}</p>
                    {r.domain && <p className="truncate text-xs text-foreground/55">{r.domain}</p>}
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-card">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${(r.clicks / max) * 100}%` }} />
                    </div>
                    <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-foreground/70">
                      <span className="inline-flex items-center gap-1"><MousePointerClick className="h-3.5 w-3.5" aria-hidden="true" /> <b className="text-foreground">{r.clicks}</b> {t("brandStats.clicks")}</span>
                      <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" aria-hidden="true" /> {r.visitors} {t("brandStats.visitors")}</span>
                      <span className="inline-flex items-center gap-1"><Shirt className="h-3.5 w-3.5" aria-hidden="true" /> {r.looks} {t("brandStats.looks")} · {r.creators} {t("brandStats.creators")}</span>
                      {trend !== null && (
                        <span className={`inline-flex items-center gap-0.5 font-semibold ${trend >= 0 ? "text-emerald-700" : "text-destructive"}`}>
                          {trend >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" /> : <ArrowDownRight className="h-3.5 w-3.5" aria-hidden="true" />}
                          {trend >= 0 ? "+" : ""}{trend} %
                        </span>
                      )}
                    </p>
                  </div>
                  <button type="button" onClick={() => copy(pitch(r))} aria-label={t("brandStats.copyPitch")} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background">
                    <Copy className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      )}
      <p className="mt-6 text-xs leading-relaxed text-foreground/55">{t("brandStats.note")}</p>
    </main>
  );
}
