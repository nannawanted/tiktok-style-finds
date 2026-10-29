// Vérification « pas de nudité » des photos, AVANT l'envoi (comme Instagram).
// Petite IA open source (AdamCodd/vit-base-nsfw-detector, licence Apache 2.0,
// ~90 Mo téléchargés une fois puis gardés en cache) qui tourne dans le
// navigateur : gratuit, rien n'est envoyé ailleurs.
// Limite : un utilisateur très doué peut contourner une vérif faite dans le
// navigateur. Plus tard, une vérification serveur (service payant) pourra
// s'ajouter ; en attendant, les signalements restent le filet de sécurité.

const TRANSFORMERS_URL = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js";
const NSFW_MODEL = "AdamCodd/vit-base-nsfw-detector";
// Au-dessus de ce score, la photo est refusée (haut pour ne pas bloquer les photos de mode normales)
const BLOCK_SCORE = 0.85;

type Classifier = (img: unknown) => Promise<{ label: string; score: number }[]>;
type Lib = {
  pipeline: (task: string, model: string, opts?: Record<string, unknown>) => Promise<Classifier>;
  RawImage: { fromBlob: (b: Blob) => Promise<unknown> };
};

let loader: Promise<{ lib: Lib; classify: Classifier }> | null = null;
function load() {
  if (typeof window === "undefined") return Promise.reject(new Error("browser_only"));
  loader ??= (async () => {
    const lib = (await import(/* @vite-ignore */ TRANSFORMERS_URL)) as Lib;
    const classify = await lib.pipeline("image-classification", NSFW_MODEL, { dtype: "q8" });
    return { lib, classify };
  })();
  loader.catch(() => {
    loader = null;
  });
  return loader;
}

/** Commence à télécharger l'IA en avance (quand on ouvre la page de création). */
export function preloadNsfwCheck() {
  void load().catch(() => undefined);
}

/**
 * true = photo obscène (à refuser). Si l'IA ne peut pas se charger (pas de
 * réseau…), la photo passe : les signalements prennent le relais.
 */
export async function isExplicitImage(file: Blob): Promise<boolean> {
  try {
    const { lib, classify } = await load();
    const img = await lib.RawImage.fromBlob(file);
    const out = await classify(img);
    const nsfw = out.find((o) => o.label.toLowerCase() === "nsfw")?.score ?? 0;
    return nsfw >= BLOCK_SCORE;
  } catch (e) {
    console.warn("[nsfw] vérification indisponible", e);
    return false;
  }
}
