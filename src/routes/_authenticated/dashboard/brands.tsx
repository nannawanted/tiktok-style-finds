import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { getBrandSignalStats } from "@/lib/brand-signal-stats";
import { Loader2, Trash2, Code2, AlertTriangle, Plus } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Brand = Tables<"brands">;
type SignalStat = { total_clicks: number; total_sales: number; last_sale_at: string | null };
type BrandFormState = { name: string; website_url: string; commission_rate: string; currency: string; contact_email: string; status: string };

const CURRENCIES = ["EUR", "USD", "GBP", "MAD", "CHF", "CAD"];

const EMPTY_FORM: BrandFormState = { name: "", website_url: "", commission_rate: "10", currency: "EUR", contact_email: "", status: "active" };

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

  // Fiche ouverte : null = fermé, "new" = création, sinon l'id de la marque éditée
  const [openId, setOpenId] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<BrandFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

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

  function openNew() {
    setForm(EMPTY_FORM);
    setOpenId("new");
  }

  function openExisting(brand: Brand) {
    setForm({
      name: brand.name,
      website_url: brand.website_url,
      commission_rate: String(brand.commission_rate),
      currency: brand.currency,
      contact_email: brand.contact_email ?? "",
      status: brand.status,
    });
    setOpenId(brand.id);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.website_url.trim()) return;
    setSaving(true);

    const payload = {
      name: form.name.trim(),
      website_url: normalizeUrl(form.website_url),
      commission_rate: Number(form.commission_rate) || 0,
      currency: form.currency,
      contact_email: form.contact_email.trim() || null,
      status: form.status,
    };

    const { error } =
      openId === "new"
        ? await supabase.from("brands").insert(payload)
        : await supabase.from("brands").update(payload).eq("id", openId);

    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(openId === "new" ? t("brands.brandAdded") : t("brands.changesSaved"));
    setOpenId(null);
    loadBrands();
  }

  async function removeBrand(id: string) {
    const { error } = await supabase.from("brands").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setBrands((b) => b.filter((brand) => brand.id !== id));
    setOpenId(null);
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
      <main className="mx-auto flex max-w-2xl justify-center px-4 py-10">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10 text-center text-muted-foreground">
        {t("brands.adminOnly")}
      </main>
    );
  }

  const editingBrand = openId && openId !== "new" ? brands.find((b) => b.id === openId) : null;

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-black">{t("brands.title")}</h1>
        <Button onClick={openNew} size="sm" className="bg-brand text-brand-foreground hover:bg-brand/90">
          <Plus className="mr-1 size-4" /> {t("brands.newBrand")}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : brands.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">{t("brands.noBrands")}</p>
      ) : (
        <ul className="space-y-2">
          {brands.map((brand) => {
            const stat = signalStats[brand.id];
            const daysSinceLastSale = stat?.last_sale_at
              ? Math.floor((Date.now() - new Date(stat.last_sale_at).getTime()) / 86_400_000)
              : null;
            const suspicious = !!stat && stat.total_clicks >= 10 && (daysSinceLastSale === null || daysSinceLastSale > 14);
            return (
              <li key={brand.id}>
                <button
                  type="button"
                  onClick={() => openExisting(brand)}
                  className="flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-card p-3 text-left shadow-card transition-colors hover:bg-muted/40"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{brand.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{brand.website_url} · {brand.currency}</p>
                    {stat && (
                      <p className={`mt-1 flex items-center gap-1 text-xs ${suspicious ? "font-semibold text-destructive" : "text-muted-foreground"}`}>
                        {suspicious && <AlertTriangle className="size-3.5 shrink-0" />}
                        {stat.total_sales} {t("brands.salesLabel")}
                        {daysSinceLastSale !== null && ` · ${t("brands.lastSignal").replace("{days}", String(daysSinceLastSale))}`}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground">{brand.commission_rate}%</span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        brand.status === "active" ? "bg-green-500/15 text-green-600" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {brand.status === "active" ? t("brands.active") : t("brands.paused")}
                    </span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Fiche détail : ouverture pour créer OU éditer, rien ne change sans clic sur Enregistrer */}
      <Dialog open={openId !== null} onOpenChange={(open) => !open && setOpenId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{openId === "new" ? t("brands.newBrand") : t("brands.editBrand")}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-3 py-2 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="f-name">{t("brands.nameLabel")}</Label>
              <Input id="f-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Zara" />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="f-website">{t("brands.websiteLabel")}</Label>
              <Input id="f-website" value={form.website_url} onChange={(e) => setForm({ ...form, website_url: e.target.value })} placeholder="zara.com" />
            </div>
            <div>
              <Label htmlFor="f-commission">{t("brands.commissionLabel")}</Label>
              <Input
                id="f-commission"
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={form.commission_rate}
                onChange={(e) => setForm({ ...form, commission_rate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="f-currency">{t("brands.currencyLabel")}</Label>
              <select
                id="f-currency"
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="f-contact">{t("brands.contactLabel")}</Label>
              <Input id="f-contact" type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} placeholder="contact@zara.com" />
            </div>
            {openId !== "new" && (
              <div className="sm:col-span-2">
                <Label htmlFor="f-status">{t("brands.statusLabel")}</Label>
                <select
                  id="f-status"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                >
                  <option value="active">{t("brands.active")}</option>
                  <option value="paused">{t("brands.paused")}</option>
                </select>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            {editingBrand && (
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => copyPixelScript(editingBrand)}>
                  <Code2 className="mr-1 size-4" /> {t("brands.copyPixelTitle")}
                </Button>
                <Button type="button" variant="outline" size="sm" className="text-destructive" onClick={() => removeBrand(editingBrand.id)}>
                  <Trash2 className="mr-1 size-4" /> {t("brands.delete")}
                </Button>
              </div>
            )}
            <Button
              type="button"
              disabled={saving || !form.name.trim() || !form.website_url.trim()}
              onClick={handleSave}
              className="bg-brand text-brand-foreground hover:bg-brand/90"
            >
              {saving ? t("brands.adding") : t("brands.saveChanges")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
