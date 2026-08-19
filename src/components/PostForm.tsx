import { useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchProductMetadata, fetchTikTokOembed, isHttpUrl, isTikTokUrl } from "@/lib/url-metadata";
import { supabase } from "@/integrations/supabase/client";

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

const URL_DEBOUNCE_MS = 600;

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
    initial ?? { title: "", tiktok_url: "", cover_image: "", products: [] },
  );
  const [tiktokLoading, setTiktokLoading] = useState(false);
  const [tiktokNotice, setTiktokNotice] = useState<string | null>(null);
  const [productLoading, setProductLoading] = useState<Record<number, boolean>>({});
  const [coverUploading, setCoverUploading] = useState(false);
  const coverFileInputRef = useRef<HTMLInputElement>(null);

  const tiktokDebounceRef = useRef<ReturnType<typeof setTimeout>>();
  const productDebounceRef = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

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
    clearTimeout(productDebounceRef.current[idx]);
    delete productDebounceRef.current[idx];
    setProductLoading((prev) => {
      const next = { ...prev };
      delete next[idx];
      return next;
    });
    setData((d) => ({ ...d, products: d.products.filter((_, i) => i !== idx) }));
  }

  function isInstagramUrl(url: string) {
    return url.includes("instagram.com");
  }

  async function uploadCoverImage(file: File) {
    setCoverUploading(true);
    setTiktokNotice(null);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("covers").upload(path, file, { upsert: true });
      if (upErr) {
        setTiktokNotice("Échec de l'import de la photo. Réessaie ou colle une URL d'image manuellement.");
        return;
      }
      const { data: urlData } = supabase.storage.from("covers").getPublicUrl(path);
      setData((d) => ({ ...d, cover_image: urlData.publicUrl }));
    } finally {
      setCoverUploading(false);
    }
  }

  function handleTikTokUrlChange(url: string) {
    setData((d) => ({ ...d, tiktok_url: url }));

    clearTimeout(tiktokDebounceRef.current);
    setTiktokNotice(null);

    const isTikTok = isTikTokUrl(url);
    const isInstagram = isInstagramUrl(url);
    if (!isTikTok && !isInstagram) {
      setTiktokLoading(false);
      return;
    }

    tiktokDebounceRef.current = setTimeout(async () => {
      setTiktokLoading(true);
      try {
        if (isTikTok) {
          const result = await fetchTikTokOembed({ data: { url } });
          if (result.thumbnail_url) {
            setData((d) => ({ ...d, cover_image: result.thumbnail_url }));
          } else {
            setTiktokNotice(
              "La miniature automatique ne marche que pour les vraies vidéos TikTok. Pour un post en slide (photos), importe une photo directement pour l'image de couverture.",
            );
          }
        } else {
          const meta = await fetchProductMetadata({ data: { url } });
          if (meta.image_url) {
            setData((d) => ({ ...d, cover_image: meta.image_url }));
          } else {
            setTiktokNotice(
              "Impossible de récupérer automatiquement l'image de ce post Instagram. Importe une photo directement pour l'image de couverture.",
            );
          }
        }
      } catch {
        setTiktokNotice(
          isTikTok
            ? "La miniature automatique ne marche que pour les vraies vidéos TikTok. Pour un post en slide (photos), importe une photo directement pour l'image de couverture."
            : "Impossible de récupérer automatiquement l'image de ce post Instagram. Importe une photo directement pour l'image de couverture.",
        );
      } finally {
        setTiktokLoading(false);
      }
    }, URL_DEBOUNCE_MS);
  }

  function handleAffiliateLinkChange(idx: number, url: string) {
    updateProduct(idx, { affiliate_link: url });

    clearTimeout(productDebounceRef.current[idx]);
    if (!isHttpUrl(url)) {
      setProductLoading((prev) => ({ ...prev, [idx]: false }));
      return;
    }

    productDebounceRef.current[idx] = setTimeout(async () => {
      setProductLoading((prev) => ({ ...prev, [idx]: true }));
      try {
        const meta = await fetchProductMetadata({ data: { url } });
        updateProduct(idx, {
          ...(meta.name ? { name: meta.name } : {}),
          ...(meta.image_url ? { image_url: meta.image_url } : {}),
          ...(meta.price ? { price: meta.price } : {}),
          ...(meta.brand ? { brand: meta.brand } : {}),
        });
      } catch {
        // Le créateur peut toujours remplir les champs manuellement.
      } finally {
        setProductLoading((prev) => ({ ...prev, [idx]: false }));
      }
    }, URL_DEBOUNCE_MS);
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
          <Label htmlFor="tt">URL TikTok ou Instagram</Label>
          <div className="relative">
            <Input
              id="tt"
              type="url"
              value={data.tiktok_url}
              onChange={(e) => handleTikTokUrlChange(e.target.value)}
              placeholder="https://www.tiktok.com/@user/video/... ou https://www.instagram.com/p/..."
            />
            {tiktokLoading && (
              <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Colle l&apos;URL TikTok ou Instagram : la miniature se remplit automatiquement.
          </p>
          {tiktokNotice && (
            <p className="mt-1.5 rounded-md bg-accent/40 px-2.5 py-1.5 text-xs text-foreground">
              {tiktokNotice}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="cv">URL image de couverture</Label>
          <div className="flex gap-2">
            <Input id="cv" type="url" value={data.cover_image} className="flex-1"
              onChange={(e) => setData({ ...data, cover_image: e.target.value })} />
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={coverUploading}
              onClick={() => coverFileInputRef.current?.click()}
              title="Importer une photo"
            >
              {coverUploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            </Button>
            <input
              ref={coverFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCoverImage(f); }}
            />
          </div>
          {data.cover_image && (
            <div className="mt-2 h-24 w-24 overflow-hidden rounded-lg border border-border bg-muted">
              <img src={data.cover_image} alt="Aperçu couverture" className="h-full w-full object-cover" />
            </div>
          )}
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
            Aucun produit. Clique sur &quot;Ajouter un produit&quot;.
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
                  <div className="sm:col-span-2">
                    <Label>Lien d&apos;achat *</Label>
                    <div className="relative">
                      <Input
                        required
                        type="url"
                        value={p.affiliate_link}
                        onChange={(e) => handleAffiliateLinkChange(i, e.target.value)}
                        placeholder="https://www.zara.com/..."
                      />
                      {productLoading[i] && (
                        <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Colle l&apos;URL produit : nom, image et prix se remplissent automatiquement.
                    </p>
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
                  <div>
                    <Label>Marque</Label>
                    <Input value={p.brand} onChange={(e) => updateProduct(i, { brand: e.target.value })} />
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
