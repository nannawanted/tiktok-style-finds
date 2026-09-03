import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Brand = Tables<"brands">;

export const Route = createFileRoute("/_authenticated/dashboard/brands")({
  head: () => ({ meta: [{ title: "Marques partenaires — Wanted Fashion" }] }),
  component: BrandsPage,
});

function BrandsPage() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    website_url: "",
    commission_rate: "10",
    contact_email: "",
  });

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
  }, [isAdmin]);

  async function loadBrands() {
    setLoading(true);
    const { data, error } = await supabase.from("brands").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setBrands(data ?? []);
    setLoading(false);
  }

  async function addBrand(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.website_url.trim()) return;

    let websiteUrl = form.website_url.trim();
    if (!/^https?:\/\//i.test(websiteUrl)) websiteUrl = `https://${websiteUrl}`;

    setSaving(true);
    const { error } = await supabase.from("brands").insert({
      name: form.name.trim(),
      website_url: websiteUrl,
      commission_rate: Number(form.commission_rate) || 10,
      contact_email: form.contact_email.trim() || null,
      status: "active",
    });
    setSaving(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Marque ajoutée");
    setForm({ name: "", website_url: "", commission_rate: "10", contact_email: "" });
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
    const { error } = await supabase.from("brands").update({ status: nextStatus }).eq("id", brand.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setBrands((b) => b.map((x) => (x.id === brand.id ? { ...x, status: nextStatus } : x)));
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
        Accès réservé à l'administrateur.
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-black">Marques partenaires</h1>

      <form onSubmit={addBrand} className="mb-8 space-y-4 rounded-xl border border-border bg-card p-4 shadow-card">
        <h2 className="font-bold">Ajouter une marque</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="name">Nom de la marque</Label>
            <Input
              id="name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Zara"
            />
          </div>
          <div>
            <Label htmlFor="website">Site web</Label>
            <Input
              id="website"
              required
              value={form.website_url}
              onChange={(e) => setForm({ ...form, website_url: e.target.value })}
              placeholder="zara.com"
            />
          </div>
          <div>
            <Label htmlFor="commission">Commission négociée (%)</Label>
            <Input
              id="commission"
              type="number"
              min="0"
              max="100"
              step="0.5"
              required
              value={form.commission_rate}
              onChange={(e) => setForm({ ...form, commission_rate: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="contact">Email de contact (optionnel)</Label>
            <Input
              id="contact"
              type="email"
              value={form.contact_email}
              onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
              placeholder="contact@zara.com"
            />
          </div>
        </div>
        <Button type="submit" disabled={saving} className="bg-brand text-brand-foreground hover:bg-brand/90">
          {saving ? "Ajout..." : "Ajouter la marque"}
        </Button>
      </form>

      <section className="space-y-3">
        <h2 className="font-bold">Marques enregistrées ({brands.length})</h2>
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : brands.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Aucune marque pour l'instant.</p>
        ) : (
          <ul className="space-y-2">
            {brands.map((brand) => (
              <li
                key={brand.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background p-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold">{brand.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{brand.website_url}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-sm font-medium text-muted-foreground">{brand.commission_rate}%</span>
                  <button
                    type="button"
                    onClick={() => toggleStatus(brand)}
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      brand.status === "active"
                        ? "bg-green-500/15 text-green-600"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {brand.status === "active" ? "Active" : "En pause"}
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => removeBrand(brand.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
