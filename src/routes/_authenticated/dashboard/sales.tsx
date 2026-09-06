import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Loader2 } from "lucide-react";

type SaleRow = {
  id: string;
  order_amount: number;
  commission_amount: number;
  creator_share: number | null;
  status: string;
  order_reference: string | null;
  detected_at: string;
  products: { name: string; brand: string | null } | null;
};

const STATUS_LABEL: Record<string, string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  paid: "Payée",
  refunded: "Remboursée",
};

const STATUS_CLASS: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  confirmed: "bg-green-500/15 text-green-600",
  paid: "bg-blue-500/15 text-blue-600",
  refunded: "bg-destructive/15 text-destructive",
};

export const Route = createFileRoute("/_authenticated/dashboard/sales")({
  head: () => ({ meta: [{ title: "Ventes — Wanted Fashion" }] }),
  component: SalesPage,
});

function SalesPage() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [loading, setLoading] = useState(true);

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
      .select("id, order_amount, commission_amount, creator_share, status, order_reference, detected_at, products(name, brand)")
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
        Accès réservé à l'administrateur.
      </main>
    );
  }

  const totalOrderAmount = sales.reduce((sum, s) => sum + Number(s.order_amount), 0);
  const totalCommission = sales.reduce((sum, s) => sum + Number(s.commission_amount), 0);

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-black">Ventes</h1>

      <div className="mb-8 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-card p-4 shadow-card">
          <p className="text-xs text-muted-foreground">Total des commandes</p>
          <p className="text-2xl font-black">{totalOrderAmount.toFixed(2)} €</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-card">
          <p className="text-xs text-muted-foreground">Ta commission</p>
          <p className="text-2xl font-black text-brand">{totalCommission.toFixed(2)} €</p>
        </div>
      </div>

      <h2 className="mb-3 font-bold">Détail ({sales.length})</h2>
      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : sales.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Aucune vente détectée pour l'instant. Dès qu'une marque avec le pixel installé enregistre une commande, elle apparaîtra ici.
        </p>
      ) : (
        <ul className="space-y-2">
          {sales.map((sale) => (
            <li
              key={sale.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background p-3"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold">{sale.products?.name ?? "Produit supprimé"}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {sale.products?.brand ?? "—"} · {new Date(sale.detected_at).toLocaleDateString("fr-FR")}
                  {sale.order_reference ? ` · Réf. ${sale.order_reference}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3 text-right">
                <div>
                  <p className="text-sm font-semibold">{Number(sale.order_amount).toFixed(2)} €</p>
                  <p className="text-xs text-brand">+{Number(sale.commission_amount).toFixed(2)} €</p>
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
