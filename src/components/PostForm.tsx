import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type ProductDraft = {
  id?: string;
  brand: string;
  name: string;
  price: string;
  image_url: string;
  affiliate_link: string;
};

export type PostFormData = {
  title: string;
  tiktok_url: string;
  cover_image: string;
  products: ProductDraft[];
};

export function PostForm({
  initial,
  onSubmit,
  submitLabel,
  loading,
}: {
  initial?: PostFormData;
  onSubmit: (data: PostFormData) => void;
  submitLabel: string;
  loading?: boolean;
}) {
  const [data, setData] = useState<PostFormData>(
    initial ?? { title: "", tiktok_url: "", cover_image: "", products: [] }
  );

  function updateProduct(idx: number, patch: Partial<ProductDraft>) {
    setData((d) => ({
      ...d,
      products: d.products.map((p, i) => (i === idx ? { ...p, ...patch } : p)),
    }));
  }

  function addProduct() {
    setData((d) => ({
      ...d,
      products: [...d.products, { brand: "", name: "", price: "", image_url: "", affiliate_link: "" }],
    }));
  }

  function removeProduct(idx: number) {
    setData((d) => ({ ...d, products: d.products.filter((_, i) => i !== idx) }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(data);
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <section className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-card">
        <h2 className="font-bold">Le post</h2>
        <div>
          <Label htmlFor="title">Titre *</Label>
          <Input id="title" required maxLength={120} value={data.title}
            onChange={(e) => setData({ ...data, title: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="tt">URL TikTok</Label>
          <Input id="tt" type="url" value={data.tiktok_url}
            onChange={(e) => setData({ ...data, tiktok_url: e.target.value })}
            placeholder="https://www.tiktok.com/@user/video/..." />
        </div>
        <div>
          <Label htmlFor="cv">URL image de couverture</Label>
          <Input id="cv" type="url" value={data.cover_image}
            onChange={(e) => setData({ ...data, cover_image: e.target.value })} />
        </div>
      </section>

      <section className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-card">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">Produits ({data.products.length})</h2>
          <Button type="button" variant="outline" size="sm" onClick={addProduct}>
            + Ajouter un produit
          </Button>
        </div>

        {data.products.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Aucun produit. Clique sur "Ajouter un produit".
          </p>
        ) : (
          <ul className="space-y-4">
            {data.products.map((p, i) => (
              <li key={i} className="space-y-3 rounded-lg border border-border bg-background p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-muted-foreground">Produit {i + 1}</span>
                  <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => removeProduct(i)}>
                    Retirer
                  </Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>Marque</Label>
                    <Input value={p.brand} onChange={(e) => updateProduct(i, { brand: e.target.value })} />
                  </div>
                  <div>
                    <Label>Nom *</Label>
                    <Input required value={p.name} onChange={(e) => updateProduct(i, { name: e.target.value })} />
                  </div>
                  <div>
                    <Label>Prix</Label>
                    <Input value={p.price} onChange={(e) => updateProduct(i, { price: e.target.value })} placeholder="29,90 €" />
                  </div>
                  <div>
                    <Label>URL image</Label>
                    <Input type="url" value={p.image_url} onChange={(e) => updateProduct(i, { image_url: e.target.value })} />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Lien d'achat *</Label>
                    <Input required type="url" value={p.affiliate_link}
                      onChange={(e) => updateProduct(i, { affiliate_link: e.target.value })} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Button type="submit" disabled={loading} className="bg-brand text-brand-foreground hover:bg-brand/90">
        {loading ? "Sauvegarde..." : submitLabel}
      </Button>
    </form>
  );
}
