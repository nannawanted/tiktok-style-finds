import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function parseHttpUrl(url: string): URL {
  const parsed = new URL(url);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("URL invalide");
  }
  return parsed;
}

export const fetchProductMetadata = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { url: string }) => {
    parseHttpUrl(data.url);
    return data;
  })
  .handler(async ({ data }) => {
    const res = await fetch(
      `https://api.microlink.io?url=${encodeURIComponent(data.url)}`,
    );
    if (!res.ok) {
      throw new Error("Impossible de récupérer les informations du produit");
    }

    const json = (await res.json()) as {
      status: string;
      data?: {
        title?: string;
        image?: { url?: string } | string;
        price?: number | string;
        currency?: string;
        publisher?: string;
        author?: string;
      };
    };

    if (json.status !== "success" || !json.data) {
      throw new Error("Impossible de récupérer les informations du produit");
    }

    const meta = json.data;
    const image =
      typeof meta.image === "string" ? meta.image : (meta.image?.url ?? "");

    let price = "";
    if (meta.price != null && meta.price !== "") {
      const amount = String(meta.price);
      price = meta.currency ? `${amount} ${meta.currency}` : amount;
    }

    return {
      name: meta.title?.trim() ?? "",
      image_url: image,
      price,
      brand: (meta.publisher ?? meta.author ?? "").trim(),
    };
  });

export const fetchTikTokOembed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { url: string }) => {
    const parsed = parseHttpUrl(data.url);
    if (!parsed.hostname.includes("tiktok.com")) {
      throw new Error("URL TikTok invalide");
    }
    return data;
  })
  .handler(async ({ data }) => {
    const res = await fetch(
      `https://www.tiktok.com/oembed?url=${encodeURIComponent(data.url)}`,
    );
    if (!res.ok) {
      throw new Error("Impossible de récupérer la miniature TikTok");
    }

    const json = (await res.json()) as { thumbnail_url?: string };
    return { thumbnail_url: json.thumbnail_url ?? "" };
  });

export function isTikTokUrl(url: string): boolean {
  try {
    return new URL(url).hostname.includes("tiktok.com");
  } catch {
    return false;
  }
}

export function isHttpUrl(url: string): boolean {
  try {
    parseHttpUrl(url);
    return true;
  } catch {
    return false;
  }
}
