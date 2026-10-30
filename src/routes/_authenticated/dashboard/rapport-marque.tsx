import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link2, Loader2, Printer } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/lib/i18n";
import { absoluteUrl } from "@/lib/site";
import { Skeleton } from "@/components/ui/skeleton";
import { BrandReportView, type BrandReport } from "@/components/stats/BrandReportView";
import { Empty, PeriodTabs, StatsHeader, type Period } from "@/components/stats/StatsUI";

type Search = { brand: string; days?: number };

export const Route = createFileRoute("/_authenticated/dashboard/rapport-marque")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    brand: typeof s.brand === "string" ? s.brand.slice(0, 120) : "",
    days: [7, 30, 90].includes(Number(s.days)) ? Number(s.days) : undefined,
  }),
  head: () => ({ meta: [{ title: "Rapport marque — Wanted Fashion" }, { name: "robots", content: "noindex" }] }),
  component: BrandReportAdmin,
});

/** Admin : aperçu du rapport d'une marque, à envoyer en lien (photo figée des chiffres) ou en PDF. */
function BrandReportAdmin() {
  const { t } = useTranslation();
  const { brand, days: d } = Route.useSearch();
  const [days, setDays] = useState<Period>((d as Period) ?? 30);
  const [sharing, setSharing] = useState(false);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["brand-report", brand, days],
    enabled: !!brand,
    queryFn: async () => {
      const { data: r, error } = await supabase.rpc("brand_report" as never, { p_brand: brand, p_days: days } as never);
      if (error) throw error;
      return r as unknown as BrandReport;
    },
  });

  async function share() {
    setSharing(true);
    const { data: token, error } = await supabase.rpc("create_brand_report_link" as never, { p_brand: brand, p_days: days } as never);
    setSharing(false);
    if (error || !token) {
      toast.error(t("brandReport.shareError"));
      return;
    }
    const url = absoluteUrl(`/rapport/${token as unknown as string}`);
    try {
      if (navigator.share) await navigator.share({ title: `${data?.brand ?? brand} × WantedFashion`, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success(t("brandReport.linkCopied"));
      }
    } catch {
      /* partage annulé */
    }
  }

  return (
    <main className="mx-auto flex max-w-[900px] flex-col gap-4 px-4 pb-12 pt-4 md:pt-8">
      <div data-no-print className="flex flex-col gap-4">
        <StatsHeader title={t("brandReport.adminTitle")} back="/dashboard/stats-marques" />
        <PeriodTabs value={days} onChange={setDays} />
        <div className="flex gap-2">
          <button type="button" onClick={share} disabled={sharing || !data} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-ink font-bold text-surface disabled:opacity-50">
            {sharing ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Link2 className="h-4 w-4" aria-hidden="true" />}
            {t("brandReport.shareLink")}
          </button>
          <button type="button" onClick={() => window.print()} disabled={!data} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full border-[1.5px] border-border bg-surface font-bold disabled:opacity-50">
            <Printer className="h-4 w-4" aria-hidden="true" /> {t("brandReport.pdf")}
          </button>
        </div>
        <p className="text-xs text-foreground/60">{t("brandReport.snapshotNote")}</p>
      </div>
      {isError ? <Empty text={t("stats.forbidden")} /> : isLoading || !data ? <Skeleton className="h-96 rounded-[28px]" /> : <BrandReportView r={data} />}
    </main>
  );
}
