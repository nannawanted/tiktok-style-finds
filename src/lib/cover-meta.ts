import { supabase } from "@/integrations/supabase/client";

// Comme Instagram / Pinterest :
//  - une MINIATURE légère (640 px de large) pour le fil, la grande photo seulement sur la page du look ;
//  - la TAILLE de la photo, pour réserver la bonne place avant qu'elle arrive (le fil ne « saute » pas) ;
//  - la COULEUR DOMINANTE, affichée à la place de la photo pendant le chargement.

export type CoverMeta = { thumb: string; w: number; h: number; color: string };

const THUMB_WIDTH = 640;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Couleur moyenne de la photo (un peu adoucie pour un fond agréable). */
function dominantColor(img: HTMLImageElement): string {
  const c = document.createElement("canvas");
  c.width = 12;
  c.height = 12;
  const ctx = c.getContext("2d");
  if (!ctx) return "#d8c6a8";
  ctx.drawImage(img, 0, 0, 12, 12);
  const d = ctx.getImageData(0, 0, 12, 12).data;
  let r = 0, g = 0, b = 0;
  for (let i = 0; i < d.length; i += 4) {
    r += d[i];
    g += d[i + 1];
    b += d[i + 2];
  }
  const n = d.length / 4;
  const hex = (v: number) => Math.round(v / n).toString(16).padStart(2, "0");
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

/** Fabrique la miniature, l'envoie dans le stockage et renvoie ses infos. null si impossible. */
export async function makeCoverMeta(src: string | Blob): Promise<CoverMeta | null> {
  let objectUrl: string | null = null;
  try {
    const url = typeof src === "string" ? src : (objectUrl = URL.createObjectURL(src));
    const img = await loadImage(url);
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    if (!w || !h) return null;
    const scale = Math.min(1, THUMB_WIDTH / w);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const color = dominantColor(img);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.78));
    if (!blob) return null;
    const path = `thumbs/${crypto.randomUUID()}.jpg`;
    const { error } = await supabase.storage.from("covers").upload(path, blob, { contentType: "image/jpeg" });
    if (error) return null;
    return { thumb: supabase.storage.from("covers").getPublicUrl(path).data.publicUrl, w, h, color };
  } catch (e) {
    console.warn("[cover] miniature impossible", e);
    return null;
  } finally {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
}

/** Rattrapage d'un ancien look : calcule ses infos et les enregistre. */
export async function backfillCoverMeta(postId: string, coverUrl: string): Promise<boolean> {
  const meta = await makeCoverMeta(coverUrl);
  if (!meta) return false;
  const { error } = await supabase.rpc("set_post_cover_meta" as never, {
    p_post: postId,
    p_thumb: meta.thumb,
    p_w: meta.w,
    p_h: meta.h,
    p_color: meta.color,
  } as never);
  return !error;
}
