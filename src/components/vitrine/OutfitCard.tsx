import { Link } from "@tanstack/react-router";
import { Play } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import type { OutfitCard as OutfitCardData } from "@/lib/public-data";
import { SaveButton } from "./SaveButton";

const TONES = ["#BFA587", "#8E6F55", "#CDB496", "#6B5240", "#D8C2A3", "#A0816A"];
const RATIOS = ["aspect-[3/4]", "aspect-[4/5]", "aspect-[2/3]"];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function Avatar({ src, name, className = "h-6 w-6" }: { src: string | null; name: string; className?: string }) {
  return src ? (
    <img src={src} alt="" loading="lazy" className={`${className} shrink-0 rounded-full object-cover`} />
  ) : (
    <span
      aria-hidden="true"
      className={`${className} flex shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-surface`}
      style={{ background: TONES[hash(name) % TONES.length] }}
    >
      {name[0]?.toUpperCase()}
    </span>
  );
}

export function OutfitCard({ outfit, index = 0, showCreator = true }: { outfit: OutfitCardData; index?: number; showCreator?: boolean }) {
  const { t } = useTranslation();
  const h = hash(outfit.id);
  const pieces = `${outfit.pieceCount} ${outfit.pieceCount > 1 ? t("card.pieces") : t("card.piece")}`;

  return (
    <article className="fade-up group mb-4 md:mb-5" style={{ animationDelay: `${Math.min(index, 12) * 45}ms` }}>
      <Link to="/post/$id" params={{ id: outfit.id }} className="block">
        <div
          className={`relative overflow-hidden rounded-2xl bg-card ${outfit.cover_image ? "" : RATIOS[h % RATIOS.length]}`}
          style={outfit.cover_image ? undefined : { background: TONES[h % TONES.length] }}
        >
          {outfit.cover_image && (
            <img
              src={outfit.cover_image}
              alt={outfit.title}
              loading={index < 4 ? "eager" : "lazy"}
              referrerPolicy="no-referrer"
              className="block min-h-[180px] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            />
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/35 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          {outfit.pieceCount > 0 && (
            <span className="absolute left-2.5 top-2.5 rounded-full bg-surface/95 px-2.5 py-1 text-[11px] font-bold text-foreground shadow-sm">
              {pieces}
            </span>
          )}
          <span className="absolute right-2 top-2">
            <SaveButton postId={outfit.id} />
          </span>
          {outfit.tiktok_url && (
            <span className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-ink/85 px-2.5 py-1 text-[11px] font-semibold text-surface">
              <Play className="h-3 w-3 fill-current" aria-hidden="true" /> {t("card.video")}
            </span>
          )}
        </div>
        <h3 className="mt-2.5 line-clamp-2 px-0.5 text-[15px] font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
          {outfit.title}
        </h3>
      </Link>
      {showCreator && (
        <Link
          to="/@{$username}"
          params={{ username: outfit.creator_username }}
          className="mt-1.5 inline-flex items-center gap-2 px-0.5 text-[13px] text-foreground/75 hover:text-primary"
        >
          <Avatar src={outfit.creator_avatar} name={outfit.creator_username} />@{outfit.creator_username}
        </Link>
      )}
    </article>
  );
}

export function OutfitGrid({ outfits, showCreator = true }: { outfits: OutfitCardData[]; showCreator?: boolean }) {
  return (
    <div className="masonry">
      {outfits.map((o, i) => (
        <OutfitCard key={o.id} outfit={o} index={i} showCreator={showCreator} />
      ))}
    </div>
  );
}

export function OutfitGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="masonry" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="mb-4 md:mb-5">
          <div className={`animate-pulse rounded-2xl bg-card ${RATIOS[i % RATIOS.length]}`} />
          <div className="mt-2.5 h-4 w-3/4 animate-pulse rounded bg-card" />
        </div>
      ))}
    </div>
  );
}
