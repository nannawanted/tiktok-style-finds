import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/i18n";
import { Loader2 } from "lucide-react";

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

export const Route = createFileRoute("/_authenticated/dashboard/sales")({
  head: () => ({ meta: [{ title: "Ventes — Wanted Fashion" }] }),
  component: SalesPage,
});

function SalesPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Les devises ne se mélangent jamais : chaque total est calculé séparément
  // par devise (additionner des EUR et des USD donnerait un chiffre faux).
  const totalsByCurrency = sales.reduce<Record<string, { orders: number; commission: number }>>((acc, s) => {
    const cur = s.currency || "EUR";
    if (!acc[cur]) acc[cur] = { orders: 0, commission: 0 };
    acc[cur].orders += Number(s.order_amount);
    acc[cur].commission += Number(s.commission_amount);
    return acc;
  }, {});
  const currencies = Object.keys(totalsByCurrency);

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
