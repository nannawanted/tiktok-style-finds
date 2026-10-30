import { createFileRoute, Link } from "@tanstack/react-router";
import { Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/lib/i18n";
import { BrandReportView, type BrandReport } from "@/components/stats/BrandReportView";

// Lien secret envoyé à une marque : une photo figée des chiffres au moment du partage.
export const Route = createFileRoute("/rapport/$token")({
  loader: async ({ params }) => {
    const { data } = await supabase.rpc("get_brand_report" as never, { p_token: params.token } as never);
    return (data as unknown as BrandReport | null) ?? null;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.brand} × WantedFashion — Rapport de performance` : "Rapport — WantedFashion" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PublicReport,
});

function PublicReport() {
  const { t } = useTranslation();
  const r = Route.useLoaderData();
  if (!r) {
    return (
      <main className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
        <p className="text-lg text-foreground/75">{t("brandReport.notFound")}</p>
        <Link to="/" className="rounded-full bg-ink px-6 py-3 font-bold text-surface">
          WantedFashion
        </Link>
      </main>
    );
  }
  return (
    <main className="mx-auto max-w-[900px] px-4 pb-12 pt-6">
      <div className="mb-4 flex justify-end" data-no-print>
        <button type="button" onClick={() => window.print()} className="inline-flex h-11 items-center gap-2 rounded-full bg-surface px-4 text-sm font-semibold">
          <Printer className="h-4 w-4" aria-hidden="true" /> {t("brandReport.pdf")}
        </button>
      </div>
      <BrandReportView r={r} />
    </main>
  );
}
