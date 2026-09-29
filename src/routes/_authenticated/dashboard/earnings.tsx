import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/i18n";
import { Loader2 } from "lucide-react";

type EarningRow = {
  id: string;
  creator_share: number | null;
  currency: string;
  status: string;
  detected_at: string;
  products: { name: string; brand: string | null } | null;
};

export const Route = createFileRoute("/_authenticated/dashboard/earnings")({
  head: () => ({ meta: [{ title: "Mes gains — Wanted Fashion" }] }),
  component: EarningsPage,
});

function EarningsPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [earnings, setEarnings] = useState<EarningRow[]>([]);
  const [loading, setLoading] = useState(true);

  const STATUS_LABEL: Record<string, string> = {
    pending: t("earnings.statusPending"),
    confirmed: t("earnings.statusConfirmed"),
    paid: t("earnings.statusPaid"),
    refunded: t("earnings.statusRefunded"),
  };

  const STATUS_CLASS: Record<string, string> = {
    pending: "bg-muted text-muted-foreground",
    confirmed: "bg-green-500/15 text-green-600",
    paid: "bg-blue-500/15 text-blue-600",
    refunded: "bg-destructive/15 text-destructive",
  };

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    // RLS restreint déjà côté base aux ventes de ses propres posts.
    supabase
      .from("sales")
      .select("id, creator_share, currency, status, detected_at, products(name, brand)")
      .order("detected_at", { ascending: false })
      .then(({ data }) => {
        setEarnings((data as unknown as EarningRow[]) ?? []);
        setLoading(false);
      });
  }, [user]);

  const totalsByCurrency = earnings.reduce<Record<string, { paid: number; pending: number }>>((acc, e) => {
    const cur = e.currency || "EUR";
    if (!acc[cur]) acc[cur] = { paid: 0, pending: 0 };
    const share = Number(e.creator_share ?? 0);
    if (e.status === "paid") acc[cur].paid += share;
    else if (e.status === "confirmed" || e.status === "pending") acc[cur].pending += share;
    return acc;
  }, {});
  const currencies = Object.keys(totalsByCurrency);

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-black">{t("earnings.title")}</h1>

      {currencies.length > 0 && (
        <div className="mb-8 space-y-3">
          {currencies.map((cur) => (
            <div key={cur} className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border bg-card p-4 shadow-card">
                <p className="text-xs text-muted-foreground">{t("earnings.totalPaid")} ({cur})</p>
                <p className="text-2xl font-black text-brand">{totalsByCurrency[cur].paid.toFixed(2)} {cur}</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 shadow-card">
                <p className="text-xs text-muted-foreground">{t("earnings.totalPending")} ({cur})</p>
                <p className="text-2xl font-black">{totalsByCurrency[cur].pending.toFixed(2)} {cur}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 className="mb-3 font-bold">{t("earnings.detailTitle")} ({earnings.length})</h2>
      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : earnings.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">{t("earnings.noEarnings")}</p>
      ) : (
        <ul className="space-y-2">
          {earnings.map((e) => (
            <li
              key={e.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background p-3"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold">{e.products?.name ?? t("earnings.productDeleted")}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {e.products?.brand ?? "—"} · {new Date(e.detected_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3 text-right">
                <p className="text-sm font-semibold text-brand">+{Number(e.creator_share ?? 0).toFixed(2)} {e.currency}</p>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_CLASS[e.status] ?? "bg-muted"}`}>
                  {STATUS_LABEL[e.status] ?? e.status}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
