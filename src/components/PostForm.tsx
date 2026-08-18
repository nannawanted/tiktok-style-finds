import { useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchProductMetadata, fetchTikTokOembed, isHttpUrl, isTikTokUrl } from "@/lib/url-metadata";

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
  const [productLoading, setProductLoading] = useState<Record<number, boolean>>({});

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

  function handleTikTokUrlChange(url: string) {
    setData((d) => ({ ...d, tiktok_url: url }));

    clearTimeout(tiktokDebounceRef.current);
    if (!isTikTokUrl(url)) {
      setTiktokLoading(false);
      return;
    }

    tiktokDebounceRef.current = setTimeout(async () => {
      setTiktokLoading(true);
      try {
        const result = await fetchTikTokOembed({ data: { url } });
        if (result.thumbnail_url) {
          setData((d) => ({ ...d, cover_image: result.thumbnail_url }));
        }
      } catch {
        // Le créateur peut toujours saisir l'image manuellement.
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
          <Label htmlFor="tt">URL TikTok</Label>
          <div className="relative">
