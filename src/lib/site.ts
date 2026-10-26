// Adresse publique du site, utilisée pour les liens absolus (aperçus de liens,
// plan du site pour Google). À changer le jour où un vrai nom de domaine est acheté.
export const SITE_URL = "https://wantedfashion.vercel.app";
export const SITE_NAME = "WantedFashion";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.png`;

export function absoluteUrl(path: string) {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function profilePath(username: string) {
  return `/@${username}`;
}

export function outfitPath(id: string) {
  return `/post/${id}`;
}

/** Coupe un texte proprement pour une meta description (≈155 caractères). */
export function clip(text: string, max = 155) {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length <= max ? t : `${t.slice(0, max - 1).replace(/\s+\S*$/, "")}…`;
}
