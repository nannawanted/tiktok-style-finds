import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getBrandSignalStats } from "@/lib/brand-signal-stats";
import { Loader2, Trash2, Code2, AlertTriangle, Plus } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Brand = Tables<"brands">;
type SignalStat = { total_clicks: number; total_sales: number; last_sale_at: string | null };

const CURRENCIES = ["EUR", "USD", "GBP", "MAD", "CHF", "CAD"];

export const Route = createFileRoute("/_authenticated/dashboard/brands")({
  head: () => ({ meta: [{ title: "Marques partenaires — Wanted Fashion" }] }),
  component: BrandsPage,
});

function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function BrandsPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [signalStats, setSignalStats] = useState<Record<string, SignalStat>>({});
  const [newRow, setNewRow] = useState({ name: "", website_url: "", commission_rate: "10", currency: "EUR" });
  const [addingRow, setAddingRow] = useState(false);

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
    loadBrands();
    supabase.auth.getSession().then(({ data }) => {
      const accessToken = data.session?.access_token;
      if (!accessToken) return;
      getBrandSignalStats({ data: { accessToken } }).then((result) => {
        if (!result.ok) return;
        const map: Record<string, SignalStat> = {};
        for (const s of result.stats) {
          map[s.brand_id] = { total_clicks: s.total_clicks, total_sales: s.total_sales, last_sale_at: s.last_sale_at };
        }
        setSignalStats(map);
      });
    });
  }, [isAdmin]);

  async function loadBrands() {
    setLoading(true);
    const { data, error } = await supabase.from("brands").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setBrands(data ?? []);
    setLoading(false);
  }

  // Mise à jour directe d'un champ dans le tableau, sans formulaire séparé.
  async function updateField(brand: Brand, field: keyof Brand, value: string | number) {
    if (brand[field] === value) return;
    setBrands((b) => b.map((x) => (x.id === brand.id ? { ...x, [field]: value } : x)));
    const { error } = await supabase.from("brands").update({ [field]: value }).eq("id", brand.id);
    if (error) {
      toast.error(error.message);
      loadBrands();
    }
  }

  async function addBrand() {
    if (!newRow.name.trim() || !newRow.website_url.trim()) return;
    setAddingRow(true);
    const { error } = await supabase.from("brands").insert({
      name: newRow.name.trim(),
      website_url: normalizeUrl(newRow.website_url),
      commission_rate: Number(newRow.commission_rate) || 10,
      currency: newRow.currency,
      status: "active",
    });
    setAddingRow(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t("brands.brandAdded"));
    setNewRow({ name: "", website_url: "", commission_rate: "10", currency: "EUR" });
    loadBrands();
  }

  async function removeBrand(id: string) {
    const { error } = await supabase.from("brands").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setBrands((b) => b.filter((brand) => brand.id !== id));
  }

  async function toggleStatus(brand: Brand) {
    const nextStatus = brand.status === "active" ? "paused" : "active";
    await updateField(brand, "status", nextStatus);
  }

  async function copyPixelScript(brand: Brand) {
    const origin = window.location.origin;
    const snippet = `<script>
(function () {
  // Wanted Fashion — pixel de conversion (${brand.name})
  // À coller sur la page de confirmation de commande.
  // Remplacez MONTANT_COMMANDE et REFERENCE_COMMANDE par les vraies valeurs
  // de la commande juste validée (ex: variables injectées par votre plateforme).
  // Montant dans la devise de la marque (${brand.currency}) — ne pas convertir.
  var amount = MONTANT_COMMANDE; // ex: 49.90
  var orderRef = "REFERENCE_COMMANDE"; // ex: "#1042"

  fetch("${origin}/api/conversion", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      brand_id: "${brand.id}",
      secret: "${brand.webhook_secret}",
      amount: amount,
      order_reference: orderRef,
    }),
  });
})();
</script>`;
    await navigator.clipboard.writeText(snippet);
    toast.success(t("brands.pixelCopied"));
  }

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
        {t("brands.adminOnly")}
      </main>
    );
  }

  const cellClass = "bg-transparent px-2 py-1.5 text-sm outline-none focus:bg-muted/60 rounded";

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="mb-1 text-2xl font-black">{t("brands.title")}</h1>
      <p className="mb-6 text-xs text-muted-foreground">{t("brands.editInline")}</p>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
              <th className="px-2 py-2 font-semibold">{t("brands.nameLabel")}</th>
              <th className="px-2 py-2 font-semibold">{t("brands.websiteLabel")}</th>
              <th className="px-2 py-2 font-semibold">{t("brands.commissionLabel")}</th>
              <th className="px-2 py-2 font-semibold">{t("brands.currencyLabel")}</th>
              <th className="px-2 py-2 font-semibold">{t("brands.statusLabel")}</th>
              <th className="px-2 py-2 font-semibold">{t("brands.signalLabel")}</th>
              <th className="px-2 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="py-8 text-center">
                  <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" />
                </td>
              </tr>
            ) : (
              brands.map((brand) => {
                const stat = signalStats[brand.id];
                const daysSinceLastSale = stat?.last_sale_at
                  ? Math.floor((Date.now() - new Date(stat.last_sale_at).getTime()) / 86_400_000)
                  : null;
                const suspicious = !!stat && stat.total_clicks >= 10 && (daysSinceLastSale === null || daysSinceLastSale > 14);
                return (
                  <tr key={brand.id} className="border-b border-border last:border-0">
                    <td className="px-1 py-1">
                      <input
                        defaultValue={brand.name}
                        onBlur={(e) => updateField(brand, "name", e.target.value.trim())}
                        className={cellClass}
                      />
                    </td>
                    <td className="px-1 py-1">
                      <input
                        defaultValue={brand.website_url}
                        onBlur={(e) => updateField(brand, "website_url", normalizeUrl(e.target.value))}
                        className={cellClass}
                      />
                    </td>
                    <td className="px-1 py-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        defaultValue={brand.commission_rate}
                        onBlur={(e) => updateField(brand, "commission_rate", Number(e.target.value) || 0)}
                        className={`${cellClass} w-16`}
                      />
                    </td>
                    <td className="px-1 py-1">
                      <select
                        value={brand.currency}
                        onChange={(e) => updateField(brand, "currency", e.target.value)}
                        className={cellClass}
                      >
                        {CURRENCIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-1 py-1">
                      <button
                        type="button"
                        onClick={() => toggleStatus(brand)}
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${
                          brand.status === "active" ? "bg-green-500/15 text-green-600" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {brand.status === "active" ? t("brands.active") : t("brands.paused")}
                      </button>
                    </td>
                    <td className="px-2 py-1 text-xs">
                      {stat ? (
                        <span className={`flex items-center gap-1 whitespace-nowrap ${suspicious ? "font-semibold text-destructive" : "text-muted-foreground"}`}>
                          {suspicious && <AlertTriangle className="size-3.5 shrink-0" />}
                          {stat.total_sales} {t("brands.salesLabel")}
                          {daysSinceLastSale !== null && ` · ${t("brands.lastSignal").replace("{days}", String(daysSinceLastSale))}`}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-1 py-1">
                      <div className="flex items-center justify-end gap-1">
                        <Button type="button" variant="ghost" size="icon" title={t("brands.copyPixelTitle")} onClick={() => copyPixelScript(brand)}>
                          <Code2 className="size-4" />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => removeBrand(brand.id)}>
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}

            {/* Ligne d'ajout permanente, directement dans le tableau */}
            <tr className="bg-muted/20">
              <td className="px-1 py-1">
                <input
                  placeholder={t("brands.nameLabel")}
                  value={newRow.name}
                  onChange={(e) => setNewRow({ ...newRow, name: e.target.value })}
                  className={cellClass}
                />
              </td>
              <td className="px-1 py-1">
                <input
                  placeholder="zara.com"
                  value={newRow.website_url}
                  onChange={(e) => setNewRow({ ...newRow, website_url: e.target.value })}
                  className={cellClass}
                />
              </td>
              <td className="px-1 py-1">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={newRow.commission_rate}
                  onChange={(e) => setNewRow({ ...newRow, commission_rate: e.target.value })}
                  className={`${cellClass} w-16`}
                />
              </td>
              <td className="px-1 py-1">
                <select
                  value={newRow.currency}
                  onChange={(e) => setNewRow({ ...newRow, currency: e.target.value })}
                  className={cellClass}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </td>
              <td colSpan={2}></td>
              <td className="px-1 py-1">
                <Button
                  type="button"
                  size="icon"
                  disabled={addingRow || !newRow.name.trim() || !newRow.website_url.trim()}
                  onClick={addBrand}
                  className="bg-brand text-brand-foreground hover:bg-brand/90"
                  title={t("brands.addButton")}
                >
                  <Plus className="size-4" />
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>
  );
}
