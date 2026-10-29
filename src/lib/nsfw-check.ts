import { supabase } from "@/integrations/supabase/client";

// Vérification « pas de nudité » des photos, sur le SERVEUR (Sightengine), comme les
// grandes applis : la photo est envoyée, le serveur la vérifie, puis le site l'accepte
// ou la refuse. Rien à télécharger sur le téléphone.
//
// Le site ne se bloque jamais : si la vérification n'a pas pu se faire (quota gratuit
// épuisé, panne, trop lent), la photo passe et l'admin la voit dans « Photos non vérifiées ».

export type ImageVerdict = "ok" | "explicit" | "unverified" | "disabled";
type Bucket = "covers" | "avatars" | "banners";

const CLIENT_TIMEOUT_MS = 10_000;

export async function checkUploadedImage(bucket: Bucket, path: string): Promise<ImageVerdict> {
  try {
    const call = supabase.functions.invoke("check-image", { body: { bucket, path } }).then(({ data, error }) => {
      if (error) throw error;
      const v = (data as { verdict?: string } | null)?.verdict;
      return v === "ok" || v === "explicit" || v === "disabled" ? v : "unverified";
    });
    const timeout = new Promise<ImageVerdict>((r) => setTimeout(() => r("unverified"), CLIENT_TIMEOUT_MS));
    return await Promise.race([call, timeout]);
  } catch (e) {
    console.warn("[check-image] vérification impossible", e);
    return "unverified";
  }
}
