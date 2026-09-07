import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/i18n";
import { Loader2 } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type SaleRow = {
  id: string;
  order_amount: number;
  commission_amount: number;
  creator_share: number | null;
  currency: string;
  status: string;
  order_reference: string | null;
  detected_at: string;
  products: { name: string; brand: string | null } | null;
};

type Period = "week" | "month" | "year";

export const Route = createFileRoute("/_authenticated/dashboard/sales")({
  head: () => ({ meta: [{ title: "Ventes — Wanted Fashion" }] }),
  component: SalesPage,
});

function bucketKey(date: Date, period: Period): string {
  if (period === "year") return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  return date.toISOString().slice(0, 10); // YYYY-MM-DD pour semaine et mois
}

function bucketLabel(key: string, period: Period): string {
  if (period === "year") {
    const [y, m] = key.split("-");
    return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString(undefined, { month: "short", year: "2-digit" });
  }
  return new Date(key).toLocaleDateString(undefined, { day: "2-digit", month: "short" });
}

function periodStart(period: Period): Date {
  const now = new Date();
  if (period === "week") now.setDate(now.getDate() - 6);
  else if (period === "month") now.setDate(now.getDate() - 29);
  else now.setMonth(now.getMonth() - 11);
  now.setHours(0, 0, 0, 0);
  return now;
}

function SalesPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("month");

  const STATUS_LABEL: Record<string, string> = {
    pending: t("sales.statusPending"),
    confirmed: t("sales.statusConfirmed"),
    paid: t("sales.statusPaid"),
    refunded: t("sales.statusRefunded"),
  };

  const STATUS_CLASS: Record<string, string> = {
    pending: "bg-muted text-muted-foreground",
    confirmed: "bg-green-500/15 text-green-600",
    paid: "bg-blue-500/15 text-blue-600",
    refunded: "bg-destructive/15 text-destructive",
  };

  useEffect(() => {
    if (!user) return;
    supabase
      .from("creators")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setIsAdmin(Boolean(data?.is_admin)));
  }, [user]);

  useEffect(() => {
    if (!isAdmin) return;
    setLoading(true);
    supabase
      .from("sales")
      .select("id, order_amount, commission_amount, creator_share, currency, status, order_reference, detected_at, products(name, brand)")
      .order("detected_at", { ascending: false })
      .then(({ data }) => {
        setSales((data as unknown as SaleRow[]) ?? []);
        setLoading(false);
      });
  }, [isAdmin]);

  const salesInPeriod = useMemo(() => {
    const start = periodStart(period);
    return sales.filter((s) => new Date(s.detected_at) >= start);
  }, [sales, period]);

  const chartData = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of salesInPeriod) {
      const key = bucketKey(new Date(s.detected_at), period);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    // Génère toujours la liste complète des points de la période (même à 0),
    // pour que le graphique (grille + axes) s'affiche même sans aucune vente.
    const start = periodStart(period);
    const buckets: string[] = [];
    if (period === "year") {
      const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
      const now = new Date();
      while (cursor <= now) {
        buckets.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`);
        cursor.setMonth(cursor.getMonth() + 1);
      }
    } else {
      const cursor = new Date(start);
      const now = new Date();
      while (cursor <= now) {
        buckets.push(bucketKey(cursor, period));
        cursor.setDate(cursor.getDate() + 1);
      }
    }

    return buckets.map((key) => ({ label: bucketLabel(key, period), count: counts.get(key) ?? 0 }));
  }, [salesInPeriod, period]);

  const brandBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of salesInPeriod) {
      const brand = s.products?.brand ?? "—";
      counts.set(brand, (counts.get(brand) ?? 0) + 1);
    }
    return Array.from(counts.entries()).sort(([, a], [, b]) => b - a);
  }, [salesInPeriod]);

  const totalsByCurrency = useMemo(() => {
    return sales.reduce<Record<string, { orders: number; commission: number }>>((acc, s) => {
      const cur = s.currency || "EUR";
      if (!acc[cur]) acc[cur] = { orders: 0, commission: 0 };
      acc[cur].orders += Number(s.order_amount);
      acc[cur].commission += Number(s.commission_amount);
      return acc;
    }, {});
  }, [sales]);
  const currencies = Object.keys(totalsByCurrency);

  if (isAdmin === null) {
    return (
      <main className="mx-auto flex max-w-3xl justify-center px-4 py-10">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 text-center text-muted-foreground">
        {t("sales.adminOnly")}
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-black">{t("sales.title")}</h1>

      {currencies.length > 0 && (
        <div className="mb-8 space-y-3">
          {currencies.map((cur) => (
            <div key={cur} className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border bg-card p-4 shadow-card">
                <p className="text-xs text-muted-foreground">{t("sales.totalOrders")} ({cur})</p>
                <p className="text-2xl font-black">{totalsByCurrency[cur].orders.toFixed(2)} {cur}</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 shadow-card">
                <p className="text-xs text-muted-foreground">{t("sales.totalCommission")} ({cur})</p>
                <p className="text-2xl font-black text-brand">{totalsByCurrency[cur].commission.toFixed(2)} {cur}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sélecteur de période — contrôle à la fois le graphique et le classement des marques */}
      <div className="mb-4 flex justify-center gap-2">
        {(["week", "month", "year"] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              period === p ? "bg-brand text-white" : "bg-muted text-muted-foreground hover:bg-muted/70"
            }`}
          >
            {t(`sales.period${p === "week" ? "Week" : p === "month" ? "Month" : "Year"}` as any)}
          </button>
        ))}
      </div>

      {/* Graphique : nombre de ventes dans le temps */}
      <div className="mb-8 rounded-xl border border-border bg-card p-4 shadow-card">
        <h2 className="mb-3 font-bold">{t("sales.chartTitle")}</h2>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
              <XAxis dataKey="label" fontSize={12} />
              <YAxis allowDecimals={false} fontSize={12} width={30} domain={[0, salesInPeriod.length > 0 ? "auto" : 5]} />
              <Tooltip formatter={(value: number) => [value, t("sales.chartYAxis")]} />
              {salesInPeriod.length > 0 && (
                <Line type="monotone" dataKey="count" stroke="#c0392b" strokeWidth={3} dot={false} />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Classement par marque, sur la même période */}
      <div className="mb-8 rounded-xl border border-border bg-card p-4 shadow-card">
        <h2 className="mb-3 font-bold">{t("sales.brandBreakdownTitle")}</h2>
        {brandBreakdown.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{t("sales.noSales")}</p>
        ) : (
          <ul className="space-y-2">
            {brandBreakdown.map(([brand, count]) => (
              <li key={brand} className="flex items-center justify-between rounded-lg bg-background px-3 py-2">
                <span className="font-medium">{brand}</span>
                <span className="text-sm font-semibold text-brand">{count} {count > 1 ? t("sales.salesPlural") : t("sales.saleSingular")}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <h2 className="mb-3 font-bold">{t("sales.detailTitle")} ({sales.length})</h2>
      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : sales.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">{t("sales.noSales")}</p>
      ) : (
        <ul className="space-y-2">
          {sales.map((sale) => (
            <li
              key={sale.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background p-3"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold">{sale.products?.name ?? t("sales.productDeleted")}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {sale.products?.brand ?? "—"} · {new Date(sale.detected_at).toLocaleDateString()}
                  {sale.order_reference ? ` · ${t("sales.reference")} ${sale.order_reference}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3 text-right">
                <div>
                  <p className="text-sm font-semibold">{Number(sale.order_amount).toFixed(2)} {sale.currency}</p>
                  <p className="text-xs text-brand">+{Number(sale.commission_amount).toFixed(2)} {sale.currency}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_CLASS[sale.status] ?? "bg-muted"}`}>
                  {STATUS_LABEL[sale.status] ?? sale.status}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
