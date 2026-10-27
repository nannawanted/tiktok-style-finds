import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft, Check, Crop, Heart, ImagePlus, Link2, Loader2, MapPin, Pencil, Play, Plus, RefreshCw, X,
} from "lucide-react";
import { StylePicker } from "@/components/vitrine/StyleChips";
import { ImageCropDialog } from "@/components/vitrine/ImageCropDialog";
import { MAX_STYLES, type StyleKey } from "@/lib/styles";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchProductMetadata, fetchTikTokOembed, isHttpUrl, isTikTokUrl } from "@/lib/url-metadata";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useTranslation, type TKey } from "@/lib/i18n";

// Création / modification d'une tenue en 3 étapes (Photo · Pièces · Style),
// comme une publication Instagram. Tout ce que faisait l'ancien formulaire
// est conservé : lien vidéo TikTok/Instagram, photo importée ou par lien,
// recadrage, pièces auto-remplies et modifiables à la main, styles.

export type ProductDraft = {
  id?: string;
  brand: string;
  brand_id?: string | null;
  name: string;
  price: string;
  image_url: string;
  affiliate_link: string;
  /** Position du point sur la photo, en % (0–100). */
  pos_x?: number | null;
  pos_y?: number | null;
  /** Clé locale (non enregistrée). */
  _k?: string;
};

type PartnerBrand = { id: string; name: string; website_url: string };

export type PostFormData = {
  title: string;
  tiktok_url: string;
  cover_image: string;
  styles: StyleKey[];
  products: ProductDraft[];
};

const URL_DEBOUNCE_MS = 600;
const EMPTY: PostFormData = { title: "", tiktok_url: "", cover_image: "", styles: [], products: [] };
const SUGGESTIONS: TKey[] = ["studio.sugg1", "studio.sugg2", "studio.sugg3", "studio.sugg4", "studio.sugg5"];

function extractHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function matchBrandForUrl(url: string, brands: PartnerBrand[]): PartnerBrand | null {
  const hostname = extractHostname(url);
  if (!hostname) return null;
  return brands.find((b) => extractHostname(b.website_url) === hostname) ?? null;
}

const newKey = () => Math.random().toString(36).slice(2, 10);
const withKeys = (d: PostFormData): PostFormData => ({ ...d, products: d.products.map((p) => ({ ...p, _k: p._k ?? newKey() })) });
const hasContent = (d: PostFormData) => !!(d.title.trim() || d.cover_image || d.tiktok_url || d.products.length);

// ——— Brouillon (création seulement), gardé dans ce navigateur ———
export function clearPostDraft(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* navigation privée */
  }
}
function readDraft(key: string): PostFormData | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const d = JSON.parse(raw) as PostFormData;
    return d && Array.isArray(d.products) ? { ...EMPTY, ...d } : null;
  } catch {
    return null;
  }
}

export function PostForm({
  initial,
  onSubmit,
  submitLabel,
  loading,
  mode = "edit",
  draftKey,
}: {
  initial?: PostFormData;
  onSubmit: (data: PostFormData) => void;
  submitLabel: string;
  loading?: boolean;
  mode?: "new" | "edit";
  draftKey?: string;
}) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [data, setData] = useState<PostFormData>(() => withKeys(initial ?? EMPTY));
  const [step, setStep] = useState(() => (mode === "new" && !initial?.cover_image ? 0 : 1));
  const [reached, setReached] = useState(() => (mode === "edit" ? 3 : 1));
  const [coverLoading, setCoverLoading] = useState(false);
  const [coverNotice, setCoverNotice] = useState<string | null>(null);
  const [showVideoField, setShowVideoField] = useState(false);
  const [showCoverUrl, setShowCoverUrl] = useState(false);
  const [pendingCover, setPendingCover] = useState<File | null>(null);
  const [productLoading, setProductLoading] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [placing, setPlacing] = useState<string | null>(null);
  const [pieceUrl, setPieceUrl] = useState("");
  const [partnerBrands, setPartnerBrands] = useState<PartnerBrand[]>([]);
  const [draftSavedAt, setDraftSavedAt] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const coverImgRef = useRef<HTMLImageElement>(null);
  const videoDebounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const productDebounce = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const { data: myUsername } = useQuery({
    queryKey: ["my-username", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: row } = await supabase.from("creators").select("username").eq("id", user!.id).maybeSingle();
      return row?.username ?? "";
    },
  });

  useEffect(() => {
    supabase
      .from("brands_public")
      .select("id, name, website_url")
      .then(({ data: rows }) => setPartnerBrands((rows ?? []).filter((b): b is PartnerBrand => !!b.id && !!b.name && !!b.website_url)));
  }, []);

  // Brouillon : reprise au chargement…
  useEffect(() => {
    if (mode !== "new" || !draftKey || initial) return;
    const draft = readDraft(draftKey);
    if (!draft || !hasContent(draft)) return;
    setData(withKeys(draft));
    setStep(1);
    setReached(draft.products.length ? 3 : 2);
    toast(t("studio.draftRestored"), {
      action: {
        label: t("studio.restart"),
        onClick: () => {
          clearPostDraft(draftKey);
          setData(withKeys(EMPTY));
          setStep(0);
          setReached(1);
        },
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // …et sauvegarde automatique
  useEffect(() => {
    if (mode !== "new" || !draftKey || !hasContent(data)) return;
    const id = setTimeout(() => {
      try {
        const clean = { ...data, products: data.products.map(({ _k, ...p }) => p) };
        localStorage.setItem(draftKey, JSON.stringify(clean));
        setDraftSavedAt(Date.now());
      } catch {
        /* stockage indisponible : pas de brouillon */
      }
    }, 500);
    return () => clearTimeout(id);
  }, [data, mode, draftKey]);

  function go(n: number) {
    setStep(n);
    setReached((r) => Math.max(r, n));
    setPlacing(null);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ——— Photo ———
  async function uploadCoverImage(file: File) {
    setCoverLoading(true);
    setCoverNotice(null);
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("covers").upload(path, file, { upsert: true });
      if (upErr) {
        setCoverNotice(t("postForm.uploadPhotoFailed"));
        return;
      }
      const { data: urlData } = supabase.storage.from("covers").getPublicUrl(path);
      setData((d) => ({ ...d, cover_image: urlData.publicUrl }));
      if (step === 0) go(1);
    } finally {
      setCoverLoading(false);
    }
  }

  async function recropCurrent() {
    if (!data.cover_image) return;
    try {
      const res = await fetch(data.cover_image, { mode: "cors" });
      if (!res.ok) throw new Error("fetch");
      const blob = await res.blob();
      setPendingCover(new File([blob], "cover.jpg", { type: blob.type || "image/jpeg" }));
    } catch {
      toast(t("studio.cropUnavailable"));
    }
  }

  function handleVideoUrlChange(url: string) {
    setData((d) => ({ ...d, tiktok_url: url }));
    clearTimeout(videoDebounce.current);
    setCoverNotice(null);
    const isTikTok = isTikTokUrl(url);
    const isInstagram = url.includes("instagram.com");
    if (!isTikTok && !isInstagram) {
      setCoverLoading(false);
      return;
    }
    videoDebounce.current = setTimeout(async () => {
      setCoverLoading(true);
      try {
        if (isTikTok) {
          const { data: sessionData } = await supabase.auth.getSession();
          const accessToken = sessionData.session?.access_token ?? "";
          const result = await fetchTikTokOembed({ data: { url, accessToken } });
          if (result.thumbnail_url) {
            setData((d) => ({ ...d, cover_image: result.thumbnail_url ?? d.cover_image }));
            toast(t("studio.coverReady"));
            if (step === 0) go(1);
          } else setCoverNotice(t("postForm.tiktokThumbFail"));
        } else {
          const meta = await fetchProductMetadata({ data: { url } });
          if (meta.image_url) {
            setData((d) => ({ ...d, cover_image: meta.image_url ?? d.cover_image }));
            toast(t("studio.coverReady"));
            if (step === 0) go(1);
          } else setCoverNotice(t("postForm.instagramThumbFail"));
        }
      } catch {
        setCoverNotice(isTikTok ? t("postForm.tiktokThumbFail") : t("postForm.instagramThumbFail"));
      } finally {
        setCoverLoading(false);
      }
    }, URL_DEBOUNCE_MS);
  }

  async function pasteInto(apply: (v: string) => void, fallbackId: string) {
    try {
      const text = (await navigator.clipboard.readText()).trim();
      if (text) {
        apply(text);
        return;
      }
    } catch {
      /* le navigateur refuse : on laisse coller à la main */
    }
    document.getElementById(fallbackId)?.focus();
    toast(t("studio.pasteManually"));
  }

  // ——— Pièces ———
  function updateProduct(key: string, patch: Partial<ProductDraft>) {
    setData((d) => ({ ...d, products: d.products.map((p) => (p._k === key ? { ...p, ...patch } : p)) }));
  }

  function fetchPieceMeta(key: string, url: string, brandFromDomain: PartnerBrand | null, announce: boolean) {
    clearTimeout(productDebounce.current[key]);
    if (!isHttpUrl(url)) {
      setProductLoading((s) => ({ ...s, [key]: false }));
      return;
    }
    productDebounce.current[key] = setTimeout(async () => {
      setProductLoading((s) => ({ ...s, [key]: true }));
      let gotName = false;
      let gotPrice = false;
      try {
        const meta = await fetchProductMetadata({ data: { url } });
        gotName = !!meta.name;
        gotPrice = !!meta.price;
        updateProduct(key, {
          ...(meta.name ? { name: meta.name } : {}),
          ...(meta.image_url ? { image_url: meta.image_url } : {}),
          ...(meta.price ? { price: meta.price } : {}),
          // Le nom de marque déduit du domaine est plus fiable que la page
          ...(meta.brand && !brandFromDomain ? { brand: meta.brand } : {}),
        });
      } catch {
        /* le créateur complète à la main */
      } finally {
        setProductLoading((s) => ({ ...s, [key]: false }));
        if (announce) {
          if (!gotName) {
            setEditing(key);
            toast(t("studio.fetchFailed"));
          } else toast(gotPrice ? t("studio.pieceAdded") : t("studio.pieceAddedNoPrice"));
        }
      }
    }, announce ? 0 : URL_DEBOUNCE_MS);
  }

  function addPieceFromUrl(raw: string) {
    const url = raw.trim();
    if (!isHttpUrl(url)) {
      toast(t("studio.linkInvalid"));
      return;
    }
    const key = newKey();
    const brand = matchBrandForUrl(url, partnerBrands);
    setData((d) => ({
      ...d,
      products: [
        ...d.products,
        { _k: key, affiliate_link: url, brand: brand?.name ?? "", brand_id: brand?.id ?? null, name: "", price: "", image_url: "", pos_x: null, pos_y: null },
      ],
    }));
    setPieceUrl("");
    setProductLoading((s) => ({ ...s, [key]: true }));
    fetchPieceMeta(key, url, brand, true);
  }

  function addPieceManually() {
    const key = newKey();
    setData((d) => ({
      ...d,
      products: [...d.products, { _k: key, affiliate_link: "", brand: "", brand_id: null, name: "", price: "", image_url: "", pos_x: null, pos_y: null }],
    }));
    setEditing(key);
  }

  function onPieceLinkEdited(key: string, url: string) {
    const brand = matchBrandForUrl(url, partnerBrands);
    updateProduct(key, { affiliate_link: url, brand_id: brand?.id ?? null, ...(brand ? { brand: brand.name } : {}) });
    fetchPieceMeta(key, url, brand, false);
  }

  function removeProduct(key: string) {
    clearTimeout(productDebounce.current[key]);
    setData((d) => ({ ...d, products: d.products.filter((p) => p._k !== key) }));
    if (placing === key) setPlacing(null);
    if (editing === key) setEditing(null);
  }

  function onCoverClick(e: React.MouseEvent) {
    if (!placing || !coverImgRef.current) return;
    const r = coverImgRef.current.getBoundingClientRect();
    const x = Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100));
    const y = Math.min(100, Math.max(0, ((e.clientY - r.top) / r.height) * 100));
    updateProduct(placing, { pos_x: Math.round(x * 10) / 10, pos_y: Math.round(y * 10) / 10 });
    setPlacing(null);
    toast(t("studio.placed"));
  }

  // ——— Validation & envoi ———
  const readyPieces = data.products.filter((p) => !productLoading[p._k ?? ""]);
  const anyLoading = data.products.some((p) => productLoading[p._k ?? ""]);

  function firstInvalidPiece() {
    return data.products.find((p) => !isHttpUrl(p.affiliate_link) || !p.name.trim());
  }

  function submit() {
    if (data.title.trim().length < 1) {
      go(1);
      toast(t("studio.needTitle"));
      return;
    }
    const bad = firstInvalidPiece();
    if (bad) {
      go(2);
      setEditing(bad._k ?? null);
      toast(!isHttpUrl(bad.affiliate_link) ? t("studio.linkInvalid") : t("studio.nameRequired"));
      return;
    }
    onSubmit({ ...data, title: data.title.trim(), products: data.products.map(({ _k, ...p }) => p) });
  }

  const cta = useMemo(() => {
    if (step === 1) return { label: t("studio.toPieces"), ok: data.title.trim().length > 0, why: t("studio.needTitle"), sub: `${t("studio.step")} 1/3` };
    if (step === 2) return { label: t("studio.next"), ok: !anyLoading, why: t("studio.loadingPieces"), sub: data.products.length ? `${t("studio.step")} 2/3` : t("studio.noPiecesSoft") };
    if (step === 3) return { label: submitLabel, ok: !loading && !anyLoading, why: "", sub: mode === "new" ? t("studio.editableLater") : "" };
    return null;
  }, [step, data, anyLoading, loading, submitLabel, mode, t]);

  const steps: TKey[] = ["studio.stepPhoto", "studio.stepPieces", "studio.stepStyle"];
  const placedNumbers = data.products.map((p, i) => ({ p, n: i + 1 })).filter(({ p }) => p.pos_x != null && p.pos_y != null);

  // ——— Rendu ———
  const coverBlock = (forPlacing: boolean) =>
    data.cover_image ? (
      <div
        className={`relative mx-auto w-full overflow-hidden rounded-[28px] bg-card shadow-[0_20px_40px_-28px_rgba(40,20,10,.7)] ${forPlacing ? "max-w-[300px]" : "max-w-md"} ${forPlacing && placing ? "cursor-crosshair ring-4 ring-ink/80" : ""}`}
        onClick={forPlacing ? onCoverClick : undefined}
      >
        <img
          ref={forPlacing ? coverImgRef : undefined}
          src={data.cover_image}
          alt={t("studio.coverAlt")}
          referrerPolicy="no-referrer"
          draggable={false}
          className="block w-full select-none"
        />
        {forPlacing &&
          placedNumbers.map(({ p, n }) => (
            <span
              key={p._k}
              className="heart-pop absolute flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-surface text-[13px] font-bold text-foreground shadow-[0_0_0_4px_rgba(255,250,240,.45),0_6px_14px_-4px_rgba(0,0,0,.6)]"
              style={{ left: `${p.pos_x}%`, top: `${p.pos_y}%` }}
            >
              {n}
            </span>
          ))}
        {forPlacing && placing && (
          <div className="pointer-events-none absolute inset-x-3 bottom-3 flex items-center gap-2 rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-surface">
            <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" /> {t("studio.placeHint")}
          </div>
        )}
        {!forPlacing && (
          <div className="absolute right-3 top-3 flex gap-2">
            <button type="button" onClick={recropCurrent} className="inline-flex items-center gap-1.5 rounded-full bg-surface/90 px-3 py-2 text-[13px] font-semibold backdrop-blur">
              <Crop className="h-3.5 w-3.5" aria-hidden="true" /> {t("studio.crop")}
            </button>
            <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1.5 rounded-full bg-surface/90 px-3 py-2 text-[13px] font-semibold backdrop-blur">
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> {t("studio.change")}
            </button>
          </div>
        )}
        {coverLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70 text-sm font-semibold">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> {t("studio.fetchingCover")}
          </div>
        )}
      </div>
    ) : (
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="mx-auto flex aspect-[3/4] w-full max-w-md flex-col items-center justify-center gap-3 rounded-[28px] border-2 border-dashed border-border bg-surface/60 text-foreground/70"
      >
        {coverLoading ? <Loader2 className="h-8 w-8 animate-spin" aria-hidden="true" /> : <ImagePlus className="h-8 w-8" aria-hidden="true" />}
        <span className="font-semibold">{coverLoading ? t("studio.fetchingCover") : t("studio.addPhoto")}</span>
      </button>
    );

  return (
    <div className="pb-36">
      {/* En-tête : retour, titre, brouillon, progression */}
      <div className="mb-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label={t("studio.back")}
            onClick={() => (step > 1 || (step === 1 && mode === "new") ? go(step - 1) : window.history.back())}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface transition-transform active:scale-95"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="font-display truncate text-2xl font-bold leading-tight">
              {mode === "new" ? t("studio.newTitle") : t("studio.editTitle")}
            </h1>
            {mode === "new" && draftSavedAt && step > 0 && (
              <p className="flex items-center gap-1.5 text-xs text-foreground/60">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" aria-hidden="true" /> {t("studio.draftSaved")}
              </p>
            )}
          </div>
        </div>
        {step > 0 && (
          <nav aria-label={t("studio.progress")} className="mt-4 grid grid-cols-3 gap-1.5">
            {steps.map((k, i) => {
              const n = i + 1;
              const can = n <= reached;
              return (
                <button
                  key={k}
                  type="button"
                  disabled={!can}
                  aria-current={step === n ? "step" : undefined}
                  onClick={() => can && go(n)}
                  className="group text-left disabled:cursor-default"
                >
                  <span className="block h-1 overflow-hidden rounded-full bg-border/70">
                    <span className={`block h-full rounded-full bg-ink transition-transform duration-500 ${n <= step ? "scale-x-100" : "scale-x-0"} origin-left`} />
                  </span>
                  <span className={`mt-1.5 block text-[11px] font-bold uppercase tracking-wider ${step === n ? "text-foreground" : "text-foreground/50"}`}>{t(k)}</span>
                </button>
              );
            })}
          </nav>
        )}
      </div>

      {/* 0 · Départ */}
      {step === 0 && (
        <section className="fade-up flex flex-col gap-4">
          <h2 className="font-display text-4xl font-bold leading-[1.02] [text-wrap:balance]">{t("studio.startTitle")}</h2>
          <p className="text-base leading-relaxed text-foreground/70">{t("studio.startLead")}</p>

          <div className="rounded-3xl bg-surface p-4 shadow-[var(--shadow-card)]">
            <button type="button" onClick={() => setShowVideoField((v) => !v)} className="flex w-full items-center gap-3.5 text-left">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-ink text-surface">
                <Play className="h-5 w-5 fill-current" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block text-[17px] font-bold">{t("studio.fromVideo")}</span>
                <span className="block text-[13.5px] leading-snug text-foreground/65">{t("studio.fromVideoHint")}</span>
              </span>
            </button>
            {showVideoField && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2 rounded-full border-[1.5px] border-border bg-background py-1.5 pl-4 pr-1.5">
                  <input
                    id="studio-video"
                    type="url"
                    inputMode="url"
                    autoFocus
                    value={data.tiktok_url}
                    onChange={(e) => handleVideoUrlChange(e.target.value)}
                    placeholder={t("studio.videoPlaceholder")}
                    aria-label={t("studio.videoLabel")}
                    className="min-w-0 flex-1 bg-transparent py-2 text-[15px] outline-none"
                  />
                  {coverLoading ? (
                    <Loader2 className="mr-3 h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <button type="button" onClick={() => pasteInto(handleVideoUrlChange, "studio-video")} className="rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-surface">
                      {t("studio.paste")}
                    </button>
                  )}
                </div>
                <p className="px-1 text-[13px] text-foreground/60">{t("studio.instaToo")}</p>
                {coverNotice && <p className="rounded-xl bg-accent/30 px-3 py-2 text-[13px]">{coverNotice}</p>}
              </div>
            )}
          </div>

          <button type="button" onClick={() => fileRef.current?.click()} className="flex w-full items-center gap-3.5 rounded-3xl bg-surface p-4 text-left shadow-[var(--shadow-card)] transition-transform active:scale-[.98]">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              {coverLoading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <ImagePlus className="h-5 w-5" aria-hidden="true" />}
            </span>
            <span className="min-w-0">
              <span className="block text-[17px] font-bold">{t("studio.fromGallery")}</span>
              <span className="block text-[13.5px] leading-snug text-foreground/65">{t("studio.fromGalleryHint")}</span>
            </span>
          </button>

          <div className="flex flex-wrap justify-between gap-2 px-1 text-sm">
            <button type="button" onClick={() => { setShowCoverUrl(true); go(1); }} className="font-semibold underline underline-offset-4">
              {t("studio.fromLink")}
            </button>
            <button type="button" onClick={() => go(1)} className="font-semibold text-foreground/60 underline underline-offset-4">
              {t("studio.skip")}
            </button>
          </div>
        </section>
      )}

      {/* 1 · Photo + nom */}
      {step === 1 && (
        <section className="fade-up flex flex-col gap-4">
          {coverBlock(false)}
          {coverNotice && <p className="rounded-xl bg-accent/30 px-3 py-2 text-[13px]">{coverNotice}</p>}

          <div className="rounded-3xl bg-surface px-4 py-3.5">
            <label htmlFor="studio-title" className="text-[11px] font-bold uppercase tracking-wider text-foreground/60">
              {t("studio.titleLabel")}
            </label>
            <input
              id="studio-title"
              maxLength={120}
              value={data.title}
              onChange={(e) => setData((d) => ({ ...d, title: e.target.value }))}
              placeholder={t("studio.titlePlaceholder")}
              autoComplete="off"
              className="font-display w-full bg-transparent py-1 text-2xl font-bold outline-none placeholder:text-foreground/30"
            />
            <div className="flex justify-between gap-3 text-xs text-foreground/60">
              <span>{t("studio.titleHint")}</span>
              <span className="tabular-nums">{data.title.length}/120</span>
            </div>
          </div>
          {!data.title && (
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((k) => (
                <button key={k} type="button" onClick={() => setData((d) => ({ ...d, title: t(k) }))} className="rounded-full border-[1.5px] border-border px-3 py-1.5 text-[13px] font-semibold">
                  {t(k)}
                </button>
              ))}
            </div>
          )}

          <details className="rounded-3xl bg-surface/70 px-4 py-3" open={showVideoField || showCoverUrl || !!data.tiktok_url || undefined}>
            <summary className="cursor-pointer text-sm font-semibold">{t("studio.moreOptions")}</summary>
            <div className="mt-3 space-y-4">
              <div>
                <Label htmlFor="studio-video2">{t("studio.videoLabel")}</Label>
                <div className="relative mt-1">
                  <Input id="studio-video2" type="url" inputMode="url" value={data.tiktok_url} onChange={(e) => handleVideoUrlChange(e.target.value)} placeholder={t("studio.videoPlaceholder")} />
                  {coverLoading && <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
                </div>
                <p className="mt-1 text-xs text-foreground/60">{t("studio.videoHint")}</p>
              </div>
              <div>
                <Label htmlFor="studio-cover-url">{t("studio.coverUrlLabel")}</Label>
                <Input id="studio-cover-url" type="url" inputMode="url" className="mt-1" value={data.cover_image} onChange={(e) => setData((d) => ({ ...d, cover_image: e.target.value }))} placeholder="https://…" />
              </div>
            </div>
          </details>
        </section>
      )}

      {/* 2 · Pièces */}
      {step === 2 && (
        <section className="fade-up flex flex-col gap-4">
          {data.cover_image && coverBlock(true)}
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-display text-2xl font-bold">{t("studio.pieces")}</h2>
            <span className="rounded-full bg-ink px-2.5 py-0.5 text-[13px] font-bold text-surface tabular-nums">{data.products.length}</span>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addPieceFromUrl(pieceUrl);
            }}
            className="flex items-center gap-2 rounded-full border-[1.5px] border-border bg-surface py-1.5 pl-4 pr-1.5"
          >
            <Link2 className="h-4 w-4 shrink-0 text-foreground/50" aria-hidden="true" />
            <input
              id="studio-piece-url"
              type="url"
              inputMode="url"
              value={pieceUrl}
              onChange={(e) => setPieceUrl(e.target.value)}
              onPaste={(e) => {
                const v = e.clipboardData.getData("text").trim();
                if (isHttpUrl(v)) {
                  e.preventDefault();
                  addPieceFromUrl(v);
                }
              }}
              placeholder={t("studio.pieceLinkPlaceholder")}
              aria-label={t("studio.pieceLinkPlaceholder")}
              className="min-w-0 flex-1 bg-transparent py-2 text-[15px] outline-none"
            />
            {pieceUrl.trim() ? (
              <button type="submit" className="rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-surface">{t("studio.add")}</button>
            ) : (
              <button type="button" onClick={() => pasteInto(addPieceFromUrl, "studio-piece-url")} className="rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-surface">
                {t("studio.paste")}
              </button>
            )}
          </form>
          <p className="-mt-1 px-1 text-[13px] leading-snug text-foreground/60">{t("studio.piecesHint")}</p>

          {data.products.length === 0 ? (
            <div className="rounded-3xl border-[1.5px] border-dashed border-border p-5 text-center text-sm leading-relaxed text-foreground/65">{t("studio.noPieces")}</div>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {data.products.map((p, i) => {
                const key = p._k ?? String(i);
                const isLoading = !!productLoading[key];
                const isEditing = editing === key;
                const isPlaced = p.pos_x != null && p.pos_y != null;
                return (
                  <li key={key} className="fade-up rounded-[22px] bg-surface p-2.5">
                    <div className="grid grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-3">
                      <span className="relative h-16 w-16 overflow-hidden rounded-2xl bg-card">
                        {isLoading ? (
                          <span className="block h-full w-full animate-pulse bg-card" />
                        ) : p.image_url ? (
                          <img src={p.image_url} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                        ) : null}
                        <span className="absolute left-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[11px] font-bold text-surface">{i + 1}</span>
                      </span>
                      <span className="min-w-0">
                        {isLoading ? (
                          <>
                            <span className="mb-2 block h-3 w-2/5 animate-pulse rounded bg-card" />
                            <span className="block h-4 w-4/5 animate-pulse rounded bg-card" />
                          </>
                        ) : (
                          <>
                            <span className="block truncate text-[11px] font-bold uppercase tracking-wider text-foreground/60">
                              {p.brand || extractHostname(p.affiliate_link) || t("studio.newPiece")}
                            </span>
                            <span className={`block truncate text-[15px] font-bold ${p.name ? "" : "text-primary"}`}>{p.name || t("studio.nameRequired")}</span>
                            {p.price ? (
                              <span className="block text-sm font-bold text-primary">{p.price}</span>
                            ) : (
                              <button type="button" onClick={() => setEditing(key)} className="text-left text-sm font-semibold text-foreground/60 underline decoration-dotted underline-offset-4">
                                {t("studio.addPrice")}
                              </button>
                            )}
                          </>
                        )}
                      </span>
                      <span className="flex flex-col gap-1.5">
                        {data.cover_image && (
                          <button
                            type="button"
                            aria-label={t("studio.place")}
                            aria-pressed={placing === key}
                            onClick={() => {
                              setPlacing(placing === key ? null : key);
                              if (placing !== key) window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            className={`flex h-9 w-9 items-center justify-center rounded-full ${placing === key ? "bg-ink text-surface" : isPlaced ? "bg-primary/15 text-primary" : "bg-background"}`}
                          >
                            <MapPin className="h-4 w-4" aria-hidden="true" />
                          </button>
                        )}
                        <button type="button" aria-label={isEditing ? t("studio.done") : t("studio.edit")} onClick={() => setEditing(isEditing ? null : key)} className={`flex h-9 w-9 items-center justify-center rounded-full ${isEditing ? "bg-ink text-surface" : "bg-background"}`}>
                          {isEditing ? <Check className="h-4 w-4" aria-hidden="true" /> : <Pencil className="h-4 w-4" aria-hidden="true" />}
                        </button>
                      </span>
                    </div>
                    {isEditing && (
                      <div className="mt-3 grid gap-3 border-t border-border/60 px-1 pb-1 pt-3 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <Label htmlFor={`pl-${key}`}>{t("postForm.buyLink")}</Label>
                          <Input id={`pl-${key}`} type="url" inputMode="url" className="mt-1" value={p.affiliate_link} onChange={(e) => onPieceLinkEdited(key, e.target.value)} placeholder="https://…" />
                          <p className="mt-1 text-xs text-foreground/60">{t("postForm.buyLinkHint")}</p>
                        </div>
                        <div>
                          <Label htmlFor={`pn-${key}`}>{t("postForm.name")}</Label>
                          <Input id={`pn-${key}`} className="mt-1" value={p.name} onChange={(e) => updateProduct(key, { name: e.target.value })} />
                        </div>
                        <div>
                          <Label htmlFor={`pp-${key}`}>{t("postForm.price")}</Label>
                          <Input id={`pp-${key}`} className="mt-1" value={p.price} onChange={(e) => updateProduct(key, { price: e.target.value })} placeholder="29,90 €" />
                        </div>
                        <div>
                          <Label htmlFor={`pb-${key}`}>{t("postForm.brand")}</Label>
                          <Input id={`pb-${key}`} className="mt-1" value={p.brand} onChange={(e) => updateProduct(key, { brand: e.target.value })} />
                        </div>
                        <div>
                          <Label htmlFor={`pi-${key}`}>{t("postForm.imageUrl")}</Label>
                          <Input id={`pi-${key}`} type="url" className="mt-1" value={p.image_url} onChange={(e) => updateProduct(key, { image_url: e.target.value })} />
                        </div>
                        <div className="flex flex-wrap gap-2 sm:col-span-2">
                          {isPlaced && (
                            <button type="button" onClick={() => updateProduct(key, { pos_x: null, pos_y: null })} className="rounded-full border border-border px-3 py-1.5 text-[13px] font-semibold">
                              {t("studio.unplace")}
                            </button>
                          )}
                          <button type="button" onClick={() => removeProduct(key)} className="inline-flex items-center gap-1 rounded-full border border-destructive/40 px-3 py-1.5 text-[13px] font-semibold text-destructive">
                            <X className="h-3.5 w-3.5" aria-hidden="true" /> {t("postForm.remove")}
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          <button type="button" onClick={addPieceManually} className="inline-flex items-center gap-1.5 self-start px-1 text-sm font-semibold underline underline-offset-4">
            <Plus className="h-4 w-4" aria-hidden="true" /> {t("studio.addManually")}
          </button>
        </section>
      )}

      {/* 3 · Style + aperçu */}
      {step === 3 && (
        <section className="fade-up flex flex-col gap-5">
          <div>
            <h2 className="font-display text-2xl font-bold">{t("studio.styleTitle")}</h2>
            <p className="mt-1 text-[13px] text-foreground/60">{t("studio.styleHint")}</p>
          </div>
          <StylePicker value={data.styles} max={MAX_STYLES} onMax={() => toast(t("creatorSettings.maxStyles"))} onChange={(styles) => setData((d) => ({ ...d, styles }))} />
          <div>
            <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-foreground/60">{t("studio.preview")}</p>
            <div className="grid max-w-md grid-cols-2 gap-3">
              <article>
                <div className="relative overflow-hidden rounded-2xl bg-card">
                  {data.cover_image ? (
                    <img src={data.cover_image} alt="" referrerPolicy="no-referrer" className="block w-full object-cover" />
                  ) : (
                    <div className="aspect-[3/4]" />
                  )}
                  {readyPieces.length > 0 && (
                    <span className="absolute left-2.5 top-2.5 rounded-full bg-surface/95 px-2.5 py-1 text-[11px] font-bold">
                      {readyPieces.length} {readyPieces.length > 1 ? t("card.pieces") : t("card.piece")}
                    </span>
                  )}
                  <span className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-surface/95 text-primary">
                    <Heart className="h-4 w-4" aria-hidden="true" />
                  </span>
                </div>
                <h3 className="mt-2 line-clamp-2 text-[15px] font-semibold leading-snug">{data.title || t("studio.yourLook")}</h3>
                {myUsername && <p className="mt-1 text-xs text-foreground/60">@{myUsername}</p>}
              </article>
              <div aria-hidden="true" className="opacity-35">
                <div className="aspect-[3/4] rounded-2xl bg-card" />
                <div className="mt-2 h-3.5 w-4/5 rounded bg-card" />
                <div className="mt-2 h-3 w-1/2 rounded bg-card" />
              </div>
            </div>
          </div>
          <p className="text-[13px] leading-relaxed text-foreground/60">{t("studio.previewNote")}</p>
        </section>
      )}

      {/* Bouton principal, toujours en bas */}
      {cta && (
        <div className="fixed inset-x-0 bottom-0 z-40 bg-gradient-to-t from-background from-70% to-transparent px-4 pb-[calc(14px+env(safe-area-inset-bottom,0px))] pt-6">
          <div className="mx-auto max-w-2xl">
            <button
              type="button"
              disabled={!cta.ok}
              onClick={() => (step === 3 ? submit() : go(step + 1))}
              className={`flex h-14 w-full items-center justify-center gap-2 rounded-full text-base font-bold transition-all active:scale-[.98] disabled:opacity-40 ${step === 3 ? "bg-primary text-primary-foreground" : "bg-ink text-surface"}`}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {cta.label}
            </button>
            {(cta.ok ? cta.sub : cta.why) && <p className="mt-2 text-center text-xs text-foreground/60">{cta.ok ? cta.sub : cta.why}</p>}
          </div>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) setPendingCover(f);
          e.target.value = "";
        }}
      />
      <ImageCropDialog
        file={pendingCover}
        aspect={3 / 4}
        onCancel={() => setPendingCover(null)}
        onDone={(f) => {
          setPendingCover(null);
          uploadCoverImage(f);
        }}
      />
    </div>
  );
}
