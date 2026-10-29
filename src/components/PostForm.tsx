import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft, Check, Crop, ImagePlus, Link2, Loader2, Pencil, RefreshCw, X,
} from "lucide-react";
import { SiInstagram, SiTiktok } from "react-icons/si";
import { StylePicker } from "@/components/vitrine/StyleChips";
import { ImageCropDialog } from "@/components/vitrine/ImageCropDialog";
import { MAX_STYLES, styleLabelKey, type StyleKey } from "@/lib/styles";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchProductMetadata, isHttpUrl, isTikTokUrl } from "@/lib/url-metadata";
import { checkLinkShape, type LinkProblem } from "@/lib/link-safety";
import { supabase } from "@/integrations/supabase/client";
import { checkUploadedImage } from "@/lib/nsfw-check";
import { useTranslation, type TKey } from "@/lib/i18n";
import { MAX_TAGS, cleanTags, normalizeTag, parseTags } from "@/lib/tags";
import { checkPhotoTopic, preloadVision, suggestVisualTags, type TopicResult } from "@/lib/visual-embedding";
import { conceptLabel } from "@/lib/visual-concepts";

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
  /** Clé locale (non enregistrée). */
  _k?: string;
};

type PartnerBrand = { id: string; name: string; website_url: string };

export type PostFormData = {
  title: string;
  tiktok_url: string;
  cover_image: string;
  styles: StyleKey[];
  /** Hashtags (sans #) pour retrouver la tenue dans la recherche. */
  tags: string[];
  /** Ce que l’IA a vu sur la photo, gardé / retiré par le créateur (clés du vocabulaire). */
  visual_tags: string[];
  visual_tags_rejected: string[];
  products: ProductDraft[];
  /** « ok » = l'IA a confirmé que c'est une photo de mode ; « unchecked » = pas pu vérifier (l'admin la verra). */
  topic_check?: "ok" | "unchecked";
};

const URL_DEBOUNCE_MS = 600;
const EMPTY: PostFormData = { title: "", tiktok_url: "", cover_image: "", styles: [], tags: [], visual_tags: [], visual_tags_rejected: [], products: [] };

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
const withKeys = (d: PostFormData): PostFormData => ({ ...d, tags: cleanTags(d.tags), visual_tags: d.visual_tags ?? [], visual_tags_rejected: d.visual_tags_rejected ?? [], products: d.products.map((p) => ({ ...p, _k: p._k ?? newKey() })) });
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
  const [data, setData] = useState<PostFormData>(() => withKeys(initial ?? EMPTY));
  const [step, setStep] = useState(() => (mode === "new" && !initial?.cover_image ? 0 : 1));
  const [reached, setReached] = useState(() => (mode === "edit" ? 3 : 1));
  const [coverLoading, setCoverLoading] = useState(false);
  const [coverNotice, setCoverNotice] = useState<string | null>(null);
  const [showVideoField, setShowVideoField] = useState(false);
  const [pendingCover, setPendingCover] = useState<File | null>(null);
  const [productLoading, setProductLoading] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState<string | null>(null);
  // Vérification « photo de mode » : tourne en arrière-plan pendant qu'on ajoute les pièces,
  // et doit être finie avant de publier (comme le « Vérification… » des grandes applis).
  const topicRef = useRef<{ url: string; p: Promise<TopicResult> } | null>(null);
  const dataRef = useRef(data);
  dataRef.current = data;
  const [topic, setTopic] = useState<{ url: string; state: "checking" | "ok" | "error" } | null>(null);
  const [verifying, setVerifying] = useState(false);
  // Lien refusé (dangereux, raccourci, pas une boutique, pas un vêtement…)
  const [linkIssue, setLinkIssue] = useState<Record<string, LinkProblem | undefined>>({});
  const [pieceUrl, setPieceUrl] = useState("");
  const [tagInput, setTagInput] = useState("");
  // Ce que l'IA voit sur la photo (calculé dès que la photo est choisie)
  const [, setAi] = useState<{ status: "idle" | "loading" | "done" | "error"; keys: string[] }>({ status: "idle", keys: [] });
  const [partnerBrands, setPartnerBrands] = useState<PartnerBrand[]>([]);
  const [draftSavedAt, setDraftSavedAt] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const productDebounce = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

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

  useEffect(() => {
    const url = data.cover_image;
    if (!url || typeof window === "undefined") return;
    let cancelled = false;
    setAi({ status: "loading", keys: [] });
    suggestVisualTags(url)
      .then((keys) => {
        if (cancelled) return;
        setAi({ status: "done", keys });
        // Par défaut, tout ce que l'IA voit est gardé (sauf ce que le créateur a déjà retiré)
        setData((d) => ({
          ...d,
          visual_tags: [...new Set([...d.visual_tags, ...keys.filter((k) => !d.visual_tags_rejected.includes(k))])].slice(0, 20),
        }));
      })
      .catch((e) => {
        console.warn("[visual] suggestions indisponibles", e);
        if (!cancelled) setAi({ status: "error", keys: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [data.cover_image]);


  // L'IA mode se télécharge dès l'ouverture de la page, pour être prête quand la photo arrive
  useEffect(() => preloadVision(), []);

  function startTopicCheck(url: string) {
    const p = checkPhotoTopic(url);
    topicRef.current = { url, p };
    setTopic({ url, state: "checking" });
    void p.then((r) => {
      if (topicRef.current?.url !== url) return;
      if (r.status === "off") {
        topicRef.current = null;
        setTopic(null);
        const shown = dataRef.current.cover_image === url;
        setData((d) => (d.cover_image === url ? { ...d, cover_image: "" } : d));
        if (shown) go(0); // photo déjà affichée (vérification lente) : on revient au choix
        toast.error(t("safety.offTopic").replace("{what}", r.reason), { duration: 8000 });
        return;
      }
      setTopic({ url, state: r.status === "ok" ? "ok" : "error" });
    });
    return p;
  }

  function go(n: number) {
    setStep(n);
    setReached((r) => Math.max(r, n));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ——— Photo ———
  async function uploadCoverImage(file: File) {
    setCoverLoading(true);
    setCoverNotice(null);
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("covers").upload(path, file, { upsert: true, contentType: file.type || "image/jpeg" });
      if (upErr) {
        console.warn("[cover] envoi refusé", upErr);
        setCoverNotice(t("postForm.uploadPhotoFailed"));
        toast.error(t("postForm.uploadPhotoFailed"));
        return;
      }
      const url = supabase.storage.from("covers").getPublicUrl(path).data.publicUrl;
      // Nudité : vérifiée sur le serveur (Sightengine). Photo de mode : IA, en arrière-plan.
      if ((await checkUploadedImage("covers", path)) === "explicit") {
        toast.error(t("safety.explicit"));
        return;
      }
      // On attend un court instant le verdict de l'IA mode avant d'afficher l'étape suivante :
      // une photo hors sujet est refusée tout de suite, sans aller-retour entre les pages.
      const p = startTopicCheck(url);
      const quick = await Promise.race([p, new Promise<null>((r) => setTimeout(() => r(null), 4000))]);
      if (quick?.status === "off") return; // message déjà affiché, on reste au choix de la photo
      setData((d) => ({ ...d, cover_image: url }));
      if (step === 0) go(1);
    } catch (e) {
      console.warn("[cover] envoi impossible", e);
      setCoverNotice(t("postForm.uploadPhotoFailed"));
      toast.error(t("postForm.uploadPhotoFailed"));
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

  // Lien de la vidéo : on le garde pour le bouton « Voir la vidéo ». La couverture,
  // elle, est toujours une photo importée (les miniatures de vidéo sont souvent
  // moches et aident mal la recherche visuelle).
  const isVideoLink = (url: string) => isTikTokUrl(url) || /(^|\.)instagram\.com$/.test(extractHostname(url));
  function handleVideoUrlChange(url: string) {
    setData((d) => ({ ...d, tiktok_url: url.trim() }));
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
        if (meta.verdict !== "ok" && meta.verdict !== "unverified") {
          setLinkIssue((s) => ({ ...s, [key]: meta.verdict as LinkProblem }));
          if (announce) {
            // Lien refusé : la pièce n'est pas ajoutée
            setData((d) => ({ ...d, products: d.products.filter((p) => p._k !== key) }));
            toast.error(t(`link.${meta.verdict}` as TKey));
            announce = false;
          }
          return;
        }
        setLinkIssue((s) => ({ ...s, [key]: undefined }));
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
    const problem = checkLinkShape(url);
    if (problem) {
      toast.error(t(`link.${problem}` as TKey));
      return;
    }
    const key = newKey();
    const brand = matchBrandForUrl(url, partnerBrands);
    setData((d) => ({
      ...d,
      products: [
        ...d.products,
        { _k: key, affiliate_link: url, brand: brand?.name ?? "", brand_id: brand?.id ?? null, name: "", price: "", image_url: "" },
      ],
    }));
    setPieceUrl("");
    setProductLoading((s) => ({ ...s, [key]: true }));
    fetchPieceMeta(key, url, brand, true);
  }

  function onPieceLinkEdited(key: string, url: string) {
    const brand = matchBrandForUrl(url, partnerBrands);
    updateProduct(key, { affiliate_link: url, brand_id: brand?.id ?? null, ...(brand ? { brand: brand.name } : {}) });
    setLinkIssue((s) => ({ ...s, [key]: isHttpUrl(url) ? (checkLinkShape(url) ?? undefined) : undefined }));
    if (!checkLinkShape(url)) fetchPieceMeta(key, url, brand, false);
  }

  function removeProduct(key: string) {
    clearTimeout(productDebounce.current[key]);
    setData((d) => ({ ...d, products: d.products.filter((p) => p._k !== key) }));
    if (editing === key) setEditing(null);
  }

  // ——— Hashtags ———
  function addTags(raw: string) {
    const incoming = parseTags(raw);
    if (!incoming.length) return;
    setData((d) => {
      const next = cleanTags([...d.tags, ...incoming]);
      if (d.tags.length + incoming.length > MAX_TAGS) toast(t("studio.maxTags"));
      return { ...d, tags: next };
    });
    setTagInput("");
  }
  // Styles proposés d'après ce que l'IA voit sur la photo
  const suggestedStyles = useMemo(() => {
    const map: Record<string, StyleKey> = {
      streetwear: "streetwear", y2k: "y2k", vintage: "vintage", minimal: "minimal", preppy: "preppy", boho: "boheme",
      gorpcore: "gorpcore", sporty: "sport", elegant: "chic", luxury: "old-money", romantic: "coquette", edgy: "grunge", cozy: "casual",
    };
    return [...new Set(data.visual_tags.map((k) => map[k]).filter((x): x is StyleKey => !!x))];
  }, [data.visual_tags]);

  const tagSuggestions = useMemo(() => {
    // Marques des pièces d'abord, puis ce que l'IA voit sur la photo (pièces, couleurs, matières…), puis les styles choisis
    const words = [
      ...data.products.map((p) => p.brand),
      ...data.visual_tags.map((k) => conceptLabel(k)),
      ...data.styles.map((st) => t(styleLabelKey(st))),
    ]
      .map(normalizeTag)
      .filter((w) => w.length > 1 && !data.tags.includes(w));
    return [...new Set(words)].slice(0, 8);
  }, [data.products, data.visual_tags, data.styles, data.tags, t]);

  // ——— Validation & envoi ———
  const anyLoading = data.products.some((p) => productLoading[p._k ?? ""]);

  function firstInvalidPiece() {
    return data.products.find((p) => !isHttpUrl(p.affiliate_link) || !!linkIssue[p._k ?? ""] || !!checkLinkShape(p.affiliate_link) || !p.name.trim());
  }

  async function submit() {
    if (data.title.trim().length < 1) {
      go(1);
      toast(t("studio.needTitle"));
      return;
    }
    // Comme sur une boutique : pas de look sans au moins une pièce
    if (data.products.length === 0) {
      go(2);
      toast(t("studio.needPiece"));
      return;
    }
    const bad = firstInvalidPiece();
    if (bad) {
      go(2);
      setEditing(bad._k ?? null);
      const issue = linkIssue[bad._k ?? ""] ?? (isHttpUrl(bad.affiliate_link) ? checkLinkShape(bad.affiliate_link) : null);
      toast(issue ? t(`link.${issue}` as TKey) : !isHttpUrl(bad.affiliate_link) ? t("studio.linkInvalid") : t("studio.nameRequired"));
      return;
    }
    // La vérification de la photo doit être finie avant de publier
    let topic_check = data.topic_check;
    const pending = topicRef.current;
    if (pending && pending.url === data.cover_image) {
      setVerifying(true);
      // 60 s maximum : si l'IA ne répond pas, le look part dans « Photos non vérifiées » de l'admin
      const r = await Promise.race([pending.p, new Promise<TopicResult>((res) => setTimeout(() => res({ status: "error" }), 60_000))]);
      setVerifying(false);
      if (r.status === "off") return; // photo retirée, message déjà affiché
      topic_check = r.status === "ok" ? "ok" : "unchecked";
    }
    const tags = cleanTags([...data.tags, ...parseTags(tagInput)]);
    onSubmit({ ...data, topic_check, tags, title: data.title.trim(), products: data.products.map(({ _k, ...p }) => p) });
  }

  // Modification : tout sur une seule page (pas d'étapes)
  const single = mode === "edit";
  const cta = useMemo(() => {
    if (verifying) return { label: t("studio.verifyingPhoto"), ok: false, why: "", sub: "" };
    if (single) return { label: submitLabel, ok: !loading && !anyLoading, why: t("studio.loadingPieces"), sub: "" };
    if (step === 1) return { label: t("studio.toPieces"), ok: data.title.trim().length > 0, why: t("studio.needTitle"), sub: "" };
    if (step === 2) return { label: t("studio.next"), ok: !anyLoading && data.products.length > 0, why: anyLoading ? t("studio.loadingPieces") : t("studio.needPiece"), sub: "" };
    if (step === 3) return { label: submitLabel, ok: !loading && !anyLoading, why: "", sub: "" };
    return null;
  }, [step, data, anyLoading, loading, submitLabel, mode, single, t, verifying]);

  const steps: TKey[] = ["studio.stepPhoto", "studio.stepPieces", "studio.stepStyle"];

  // ——— Rendu ———
  const coverBlock = () =>
    data.cover_image ? (
      <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-[28px] bg-card shadow-[0_20px_40px_-28px_rgba(40,20,10,.7)]">
        <img src={data.cover_image} alt={t("studio.coverAlt")} referrerPolicy="no-referrer" draggable={false} className="block w-full select-none" />
        <div className="absolute right-3 top-3 flex gap-2">
            <button type="button" onClick={recropCurrent} className="inline-flex items-center gap-1.5 rounded-full bg-surface/90 px-3 py-2 text-[13px] font-semibold backdrop-blur">
              <Crop className="h-3.5 w-3.5" aria-hidden="true" /> {t("studio.crop")}
            </button>
          <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1.5 rounded-full bg-surface/90 px-3 py-2 text-[13px] font-semibold backdrop-blur">
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> {t("studio.change")}
          </button>
        </div>
        {topic && topic.url === data.cover_image && topic.state !== "error" && (
          <span className={`absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold backdrop-blur ${topic.state === "ok" ? "bg-emerald-600/90 text-white" : "bg-ink/80 text-surface"}`}>
            {topic.state === "ok" ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
            {topic.state === "ok" ? t("studio.photoChecked") : t("studio.checkingPhoto")}
          </span>
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
    <div className="pb-28">
      {/* En-tête : retour, titre, brouillon, progression */}
      <div className="mb-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label={t("studio.back")}
            onClick={() => (!single && (step > 1 || (step === 1 && mode === "new")) ? go(step - 1) : window.history.back())}
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
        {step > 0 && !single && (
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

          <div className="rounded-3xl bg-surface p-4 shadow-[var(--shadow-card)]">
            <button type="button" onClick={() => setShowVideoField((v) => !v)} className="flex w-full items-center gap-3.5 text-left">
              <span className="flex h-12 w-14 shrink-0 items-center justify-center gap-1 rounded-2xl bg-ink text-surface">
                <SiTiktok className="h-[18px] w-[18px]" aria-hidden="true" />
                <SiInstagram className="h-[18px] w-[18px]" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block text-[17px] font-bold">{t("studio.fromVideo")}</span>
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
                  {data.tiktok_url ? (
                    <button type="button" aria-label={t("postForm.remove")} onClick={() => handleVideoUrlChange("")} className="flex h-10 w-10 items-center justify-center rounded-full">
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  ) : (
                    <button type="button" onClick={() => pasteInto(handleVideoUrlChange, "studio-video")} className="rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-surface">
                      {t("studio.paste")}
                    </button>
                  )}
                </div>
                {data.tiktok_url && !isVideoLink(data.tiktok_url) && (
                  <p className="px-1 text-[13px] font-semibold text-primary">{t("studio.videoLinkInvalid")}</p>
                )}
                {isVideoLink(data.tiktok_url) && (
                  <div className="space-y-2.5 pt-1">
                    <p className="flex items-center gap-1.5 px-1 text-[13px] font-semibold text-emerald-700">
                      <Check className="h-4 w-4" aria-hidden="true" /> {t("studio.videoLinkOk")}
                    </p>
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-4 text-[15px] font-bold text-primary-foreground"
                    >
                      {coverLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ImagePlus className="h-4 w-4" aria-hidden="true" />}
                      {t("studio.importCover")}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              // Photo de la galerie : pas de vidéo liée
              setData((d) => ({ ...d, tiktok_url: "" }));
              setShowVideoField(false);
              fileRef.current?.click();
            }}
            className="flex w-full items-center gap-3.5 rounded-3xl bg-surface p-4 text-left shadow-[var(--shadow-card)] transition-transform active:scale-[.98]">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              {coverLoading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <ImagePlus className="h-5 w-5" aria-hidden="true" />}
            </span>
            <span className="min-w-0">
              <span className="block text-[17px] font-bold">{t("studio.fromGallery")}</span>
            </span>
          </button>

        </section>
      )}

      {/* 1 · Photo + nom */}
      {(single || step === 1) && (
        <section className="fade-up flex flex-col gap-4">
          {single && <h2 className="font-display text-2xl font-bold">{t("studio.photoAndName")}</h2>}
          {coverBlock()}
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
              className="w-full bg-transparent py-2 text-[22px] font-bold leading-normal outline-none placeholder:text-foreground/30"
            />
            {data.title.length > 100 && <p className="text-right text-xs tabular-nums text-foreground/60">{data.title.length}/120</p>}
          </div>

        </section>
      )}

      {/* 2 · Pièces */}
      {(single || step === 2) && (
        <section className={`fade-up flex flex-col gap-4 ${single ? "mt-12 border-t border-border/70 pt-8" : ""}`}>
          {!single && data.cover_image && (
            <div className="flex items-center gap-3 rounded-[22px] bg-surface/70 p-2.5">
              <img src={data.cover_image} alt="" referrerPolicy="no-referrer" className="h-16 w-12 shrink-0 rounded-xl object-cover" />
              <span className="min-w-0 truncate font-display text-lg font-bold">{data.title}</span>
            </div>
          )}
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
          {data.products.length > 0 && (
            <ul className="flex flex-col gap-2.5">
              {data.products.map((p, i) => {
                const key = p._k ?? String(i);
                const isLoading = !!productLoading[key];
                const isEditing = editing === key;
                return (
                  <li key={key} className="fade-up rounded-[22px] bg-surface p-2.5">
                    <div className="grid grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-3">
                      <span className="relative h-16 w-16 overflow-hidden rounded-2xl bg-card">
                        {isLoading ? (
                          <span className="block h-full w-full animate-pulse bg-card" />
                        ) : p.image_url ? (
                          <img src={p.image_url} alt="" referrerPolicy="no-referrer" className="h-full w-full bg-white object-contain object-center p-1" />
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
                        <button type="button" aria-label={isEditing ? t("studio.done") : t("studio.edit")} onClick={() => setEditing(isEditing ? null : key)} className={`flex h-9 w-9 items-center justify-center rounded-full ${isEditing ? "bg-ink text-surface" : "bg-background"}`}>
                          {isEditing ? <Check className="h-4 w-4" aria-hidden="true" /> : <Pencil className="h-4 w-4" aria-hidden="true" />}
                        </button>
                      </span>
                    </div>
                    {linkIssue[key] && (
                      <p className="mt-2 rounded-xl bg-destructive/10 px-3 py-2 text-[13px] font-semibold text-destructive">{t(`link.${linkIssue[key]}` as TKey)}</p>
                    )}
                    {isEditing && (
                      <div className="mt-3 grid gap-3 border-t border-border/60 px-1 pb-1 pt-3 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <Label htmlFor={`pl-${key}`}>{t("postForm.buyLink")}</Label>
                          <Input id={`pl-${key}`} type="url" inputMode="url" className="mt-1" value={p.affiliate_link} onChange={(e) => onPieceLinkEdited(key, e.target.value)} placeholder="https://…" />
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
                        <div className="flex flex-wrap gap-2 sm:col-span-2">
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
        </section>
      )}

      {/* 3 · Style + aperçu */}
      {(single || step === 3) && (
        <section className={`fade-up flex flex-col gap-5 ${single ? "mt-12 border-t border-border/70 pt-8" : ""}`}>
          <h2 className="font-display text-2xl font-bold">{t("studio.styleTitle")}</h2>
          <StylePicker row suggested={suggestedStyles} value={data.styles} max={MAX_STYLES} onMax={() => toast(t("creatorSettings.maxStyles"))} onChange={(styles) => setData((d) => ({ ...d, styles }))} />

          <div>
            <h2 className="font-display text-2xl font-bold">{t("studio.tagsTitle")}</h2>
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-3xl border-[1.5px] border-border bg-surface p-2">
              {data.tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-ink py-1.5 pl-3 pr-1.5 text-[13px] font-semibold text-surface">
                  #{tag}
                  <button
                    type="button"
                    aria-label={`${t("postForm.remove")} #${tag}`}
                    onClick={() => setData((d) => ({ ...d, tags: d.tags.filter((x) => x !== tag) }))}
                    className="flex h-5 w-5 items-center justify-center rounded-full bg-surface/20"
                  >
                    <X className="h-3 w-3" aria-hidden="true" />
                  </button>
                </span>
              ))}
              {data.tags.length < MAX_TAGS && (
                <input
                  id="studio-tags"
                  value={tagInput}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (/[\s,;]$/.test(v)) addTags(v);
                    else setTagInput(v);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTags(tagInput);
                    } else if (e.key === "Backspace" && !tagInput && data.tags.length) {
                      setData((d) => ({ ...d, tags: d.tags.slice(0, -1) }));
                    }
                  }}
                  onBlur={() => tagInput && addTags(tagInput)}
                  placeholder={data.tags.length ? t("studio.tagsMore") : t("studio.tagsPlaceholder")}
                  aria-label={t("studio.tagsTitle")}
                  autoCapitalize="none"
                  autoCorrect="off"
                  className="min-w-[8rem] flex-1 bg-transparent px-2 py-1.5 text-[15px] outline-none"
                />
              )}
            </div>
            {tagSuggestions.length > 0 && data.tags.length < MAX_TAGS && (
              <div className="mt-2 flex flex-wrap gap-2">
                {tagSuggestions.map((s) => (
                  <button key={s} type="button" onClick={() => addTags(s)} className="rounded-full border-[1.5px] border-border px-3 py-1 text-[13px] font-semibold text-foreground/75">
                    + #{s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Bouton principal, toujours en bas */}
      {cta && (
        <div className="fixed inset-x-0 bottom-0 z-40 bg-gradient-to-t from-background from-70% to-transparent px-4 pb-[calc(14px+env(safe-area-inset-bottom,0px))] pt-6">
          <div className="mx-auto max-w-2xl">
            <button
              type="button"
              disabled={!cta.ok}
              onClick={() => (single || step === 3 ? void submit() : go(step + 1))}
              className={`flex h-14 w-full items-center justify-center gap-2 rounded-full text-base font-bold transition-all active:scale-[.98] disabled:opacity-40 ${single || step === 3 ? "bg-primary text-primary-foreground" : "bg-ink text-surface"}`}
            >
              {(loading || verifying) && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
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
