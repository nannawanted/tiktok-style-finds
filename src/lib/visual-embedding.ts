import { supabase } from "@/integrations/supabase/client";

// « Empreinte visuelle » d'une photo de tenue (comme Pinterest) : une petite IA
// (MobileCLIP, ~12 Mo, mise en cache par le navigateur) transforme la photo en
// 512 nombres. Deux tenues aux empreintes proches se ressemblent visuellement.
// Le calcul se fait dans le navigateur de la personne qui publie : rien à
// payer, rien de lourd sur le serveur. La bibliothèque est chargée à la demande
// depuis un CDN (version figée) pour ne pas alourdir le site.

export const VISUAL_MODEL = "Xenova/mobileclip_s0";
const TRANSFORMERS_URL = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js";

type Tensor = { normalize: () => { tolist: () => number[][] } };
type TransformersModule = {
  AutoProcessor: { from_pretrained: (id: string) => Promise<(img: unknown) => Promise<unknown>> };
  CLIPVisionModelWithProjection: {
    from_pretrained: (id: string, opts?: Record<string, unknown>) => Promise<(inputs: unknown) => Promise<{ image_embeds: Tensor }>>;
  };
  RawImage: { read: (src: string | Blob) => Promise<unknown>; fromBlob: (b: Blob) => Promise<unknown> };
};

let loader: Promise<{ lib: TransformersModule; processor: (img: unknown) => Promise<unknown>; model: (i: unknown) => Promise<{ image_embeds: Tensor }> }> | null = null;

function load() {
  if (typeof window === "undefined") return Promise.reject(new Error("browser_only"));
  loader ??= (async () => {
    const lib = (await import(/* @vite-ignore */ TRANSFORMERS_URL)) as TransformersModule;
    const [processor, model] = await Promise.all([
      lib.AutoProcessor.from_pretrained(VISUAL_MODEL),
      lib.CLIPVisionModelWithProjection.from_pretrained(VISUAL_MODEL, { dtype: "q8" }),
    ]);
    return { lib, processor, model };
  })();
  loader.catch(() => {
    loader = null; // réessayer plus tard si le chargement a échoué
  });
  return loader;
}

export async function computeImageEmbedding(imageUrl: string): Promise<number[]> {
  const { lib, processor, model } = await load();
  const res = await fetch(imageUrl, { mode: "cors" });
  if (!res.ok) throw new Error(`image_${res.status}`);
  const image = await lib.RawImage.fromBlob(await res.blob());
  const inputs = await processor(image);
  const { image_embeds } = await model(inputs);
  const [vector] = image_embeds.normalize().tolist();
  if (!vector || vector.length !== 512) throw new Error("bad_embedding");
  return vector.map((v) => Math.round(v * 1e6) / 1e6);
}

/** Calcule et enregistre l'empreinte d'une tenue. Ne bloque jamais : en cas d'échec, « Plus comme ça » utilise les styles. */
export async function indexPostImage(postId: string, imageUrl: string | null | undefined): Promise<boolean> {
  if (!imageUrl) return false;
  try {
    const embedding = await computeImageEmbedding(imageUrl);
    const { error } = await supabase.rpc("set_post_embedding" as never, { p_post: postId, p_model: VISUAL_MODEL, p_embedding: embedding } as never);
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn("[visual] indexation impossible", postId, e);
    return false;
  }
}

/** Lancer l'indexation en arrière-plan (après publication / modification). */
export function indexPostImageLater(postId: string, imageUrl: string | null | undefined) {
  if (!imageUrl || typeof window === "undefined") return;
  void indexPostImage(postId, imageUrl);
}
