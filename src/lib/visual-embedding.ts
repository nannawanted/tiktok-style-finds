import { supabase } from "@/integrations/supabase/client";

// « Empreinte visuelle » d'une photo de tenue (comme Pinterest). On utilise une
// IA spécialisée mode, Marqo-FashionSigLIP (licence Apache 2.0), entraînée sur
// des millions de photos de vêtements : elle transforme une photo en 768
// nombres. Deux tenues aux empreintes proches se ressemblent visuellement.
//
// Le calcul se fait dans le navigateur de la personne qui publie (le modèle,
// ~60 Mo, est téléchargé une fois puis gardé en cache) : rien à payer, rien de
// lourd sur le serveur. La bibliothèque est chargée à la demande depuis un CDN
// (version figée) pour ne pas alourdir le site.

export const VISUAL_MODEL = "Marqo/marqo-fashionSigLIP";
export const VISUAL_DIMS = 768;
const TRANSFORMERS_URL = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js";

type Tensor = { normalize: () => { tolist: () => number[][] } };
type ModelOutput = Record<string, Tensor | undefined>;
type Runner = (inputs: unknown) => Promise<ModelOutput>;
type TransformersModule = {
  AutoTokenizer: { from_pretrained: (id: string) => Promise<(texts: string[], opts: Record<string, unknown>) => unknown> };
  AutoProcessor: { from_pretrained: (id: string) => Promise<(img: unknown) => Promise<unknown>> };
  SiglipTextModel: { from_pretrained: (id: string, opts?: Record<string, unknown>) => Promise<Runner> };
  SiglipVisionModel: { from_pretrained: (id: string, opts?: Record<string, unknown>) => Promise<Runner> };
  RawImage: { fromBlob: (b: Blob) => Promise<unknown> };
};

function firstVector(out: ModelOutput, preferred: string): number[] {
  const tensor = out[preferred] ?? out.pooler_output ?? Object.values(out).find(Boolean);
  if (!tensor) throw new Error("no_output");
  const [vector] = tensor.normalize().tolist();
  if (!vector || vector.length !== VISUAL_DIMS) throw new Error("bad_embedding");
  return vector.map((v) => Math.round(v * 1e6) / 1e6);
}

let libPromise: Promise<TransformersModule> | null = null;
function loadLib() {
  libPromise ??= import(/* @vite-ignore */ TRANSFORMERS_URL) as Promise<TransformersModule>;
  libPromise.catch(() => {
    libPromise = null;
  });
  return libPromise;
}

let visionLoader: Promise<{ lib: TransformersModule; processor: (img: unknown) => Promise<unknown>; model: Runner }> | null = null;
function loadVision() {
  if (typeof window === "undefined") return Promise.reject(new Error("browser_only"));
  visionLoader ??= (async () => {
    const lib = await loadLib();
    const [processor, model] = await Promise.all([
      lib.AutoProcessor.from_pretrained(VISUAL_MODEL),
      // version compressée « q4 » (~60 Mo) : bonne précision, téléchargement raisonnable
      lib.SiglipVisionModel.from_pretrained(VISUAL_MODEL, { dtype: "q4" }).catch(() =>
        lib.SiglipVisionModel.from_pretrained(VISUAL_MODEL, { dtype: "q8" }),
      ),
    ]);
    return { lib, processor, model };
  })();
  visionLoader.catch(() => {
    visionLoader = null; // réessayer plus tard si le chargement a échoué
  });
  return visionLoader;
}

// Une même photo n'est analysée qu'une fois (suggestions à la création puis enregistrement)
const imageCache = new Map<string, Promise<number[]>>();

export function computeImageEmbedding(imageUrl: string): Promise<number[]> {
  let p = imageCache.get(imageUrl);
  if (!p) {
    p = (async () => {
      const { lib, processor, model } = await loadVision();
      const res = await fetch(imageUrl, { mode: "cors" });
      if (!res.ok) throw new Error(`image_${res.status}`);
      const image = await lib.RawImage.fromBlob(await res.blob());
      const inputs = await processor(image);
      return firstVector(await model(inputs), "image_embeds");
    })();
    p.catch(() => imageCache.delete(imageUrl));
    imageCache.set(imageUrl, p);
  }
  return p;
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

/**
 * Ce que l'IA repère sur une photo (vêtements, couleurs, motifs, lieu…),
 * sous forme de clés du vocabulaire (voir visual-concepts.ts).
 */
export async function suggestVisualTags(imageUrl: string): Promise<string[]> {
  const embedding = await computeImageEmbedding(imageUrl);
  const { data, error } = await supabase.rpc("suggest_visual_tags" as never, { p_model: VISUAL_MODEL, p_embedding: embedding } as never);
  if (error) throw error;
  return ((data ?? []) as { key: string }[]).map((r) => r.key);
}

// ——— Phrases (pour la recherche visuelle par mots) ———
// Le modèle texte (~110 Mo) n'est chargé que par l'admin, une seule fois, pour
// calculer les empreintes du vocabulaire ; les visiteurs ne le téléchargent jamais.

let textLoader: Promise<{ tokenizer: (t: string[], o: Record<string, unknown>) => unknown; model: Runner }> | null = null;

function loadText() {
  if (typeof window === "undefined") return Promise.reject(new Error("browser_only"));
  textLoader ??= (async () => {
    const lib = await loadLib();
    const [tokenizer, model] = await Promise.all([
      lib.AutoTokenizer.from_pretrained(VISUAL_MODEL),
      lib.SiglipTextModel.from_pretrained(VISUAL_MODEL, { dtype: "q8" }),
    ]);
    return { tokenizer, model };
  })();
  textLoader.catch(() => {
    textLoader = null;
  });
  return textLoader;
}

export async function computeTextEmbeddings(texts: string[]): Promise<number[][]> {
  const { tokenizer, model } = await loadText();
  // Une phrase à la fois : SigLIP demande des phrases de même longueur (64 jetons)
  const out: number[][] = [];
  for (const text of texts) {
    const inputs = tokenizer([text], { padding: "max_length", truncation: true, max_length: 64 });
    out.push(firstVector(await model(inputs), "text_embeds"));
  }
  return out;
}

/** Calcule et enregistre les empreintes des notions manquantes (admin). */
export async function indexVisualConcepts(
  concepts: { key: string; prompt: string; category?: string }[],
  onProgress?: (done: number, total: number) => void,
): Promise<{ done: number; failed: number }> {
  let done = 0;
  let failed = 0;
  for (let i = 0; i < concepts.length; i += 8) {
    const batch = concepts.slice(i, i + 8);
    try {
      const vectors = await computeTextEmbeddings(batch.map((c) => c.prompt));
      for (let j = 0; j < batch.length; j++) {
        const { error } = await supabase.rpc("set_visual_concept" as never, {
          p_key: batch[j].key,
          p_model: VISUAL_MODEL,
          p_prompt: batch[j].prompt,
          p_embedding: vectors[j],
        } as never);
        if (!error && batch[j].category) {
          await supabase.rpc("set_visual_concept_category" as never, { p_key: batch[j].key, p_category: batch[j].category } as never);
        }
        if (error) failed += 1;
        else done += 1;
      }
    } catch (e) {
      console.warn("[visual] notions impossibles", e);
      failed += batch.length;
    }
    onProgress?.(done + failed, concepts.length);
  }
  return { done, failed };
}

/**
 * La photo a-t-elle un lien avec la mode ? Renvoie la raison si elle est nettement
 * hors sujet (« de la nourriture »…), sinon null. Si l'IA n'est pas disponible,
 * la photo passe (les signalements prennent le relais).
 */
export async function offTopicReason(imageUrl: string): Promise<string | null> {
  try {
    const embedding = await computeImageEmbedding(imageUrl);
    const { data, error } = await supabase.rpc("photo_subject_check" as never, { p_model: VISUAL_MODEL, p_embedding: embedding } as never);
    if (error) throw error;
    const row = ((data ?? []) as { top_key: string; fashion_prob: number }[])[0];
    if (!row || row.fashion_prob >= 0.3 || !row.top_key?.startsWith("subj_n_")) return null;
    const { SUBJECT_CONCEPTS } = await import("./visual-concepts");
    return SUBJECT_CONCEPTS.find((c) => c.key === row.top_key)?.label || null;
  } catch (e) {
    console.warn("[visual] vérification du sujet impossible", e);
    return null;
  }
}
