import { Play } from "lucide-react";
import { SiInstagram, SiTiktok } from "react-icons/si";

/** Plateforme de la vidéo liée à une tenue, d'après son lien. */
export function videoPlatform(url: string | null | undefined): "tiktok" | "instagram" | "other" | null {
  if (!url) return null;
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host === "tiktok.com" || host.endsWith(".tiktok.com")) return "tiktok";
    if (host === "instagram.com" || host.endsWith(".instagram.com")) return "instagram";
    return "other";
  } catch {
    return null;
  }
}

/** Icône officielle de la plateforme (TikTok / Instagram), sinon un simple « lecture ». */
export function VideoSourceIcon({ url, className = "" }: { url: string | null | undefined; className?: string }) {
  const p = videoPlatform(url);
  if (p === "tiktok") return <SiTiktok className={className} aria-hidden="true" />;
  if (p === "instagram") return <SiInstagram className={className} aria-hidden="true" />;
  return <Play className={`fill-current ${className}`} aria-hidden="true" />;
}
