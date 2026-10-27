import { useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";

const DOUBLE_TAP_MS = 230;
import { useQuickLike } from "./DoubleTapLike";
import { Heart, Camera } from "lucide-react";
import { VideoSourceIcon } from "./VideoSourceIcon";
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
  const navigate = useNavigate();
  const like = useQuickLike(outfit.id);
  const lastTap = useRef(0);
  const openTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [burst, setBurst] = useState<{ x: number; y: number; key: number } | null>(null);

  // Un toucher = ouvrir la tenue ; deux touchers rapides = liker SANS ouvrir.
  // Pour savoir s'il y a un 2e toucher, on attend un très court instant (0,23 s,
  // la durée d'un double-toucher rapide). Pendant ce temps la tenue est déjà
  // préchargée (dès que le doigt touche l'écran), donc elle s'affiche aussitôt.
  function onCardClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    const now = Date.now();
    if (now - lastTap.current < DOUBLE_TAP_MS) {
      clearTimeout(openTimer.current);
      lastTap.current = 0;
      const img = (e.currentTarget.querySelector("[data-cover]") as HTMLElement | null)?.getBoundingClientRect();
      if (img) setBurst({ x: e.clientX - img.left, y: Math.min(e.clientY - img.top, img.height - 48), key: now });
      like();
      return;
    }
    lastTap.current = now;
    openTimer.current = setTimeout(() => navigate({ to: "/post/$id", params: { id: outfit.id } }), DOUBLE_TAP_MS);
  }

  return (
    <article className="fade-up group mb-4 md:mb-5" style={{ animationDelay: `${Math.min(index, 12) * 45}ms` }}>
      <Link to="/post/$id" params={{ id: outfit.id }} preload="intent" preloadDelay={0} onClick={onCardClick} className="block touch-manipulation select-none">
        <div
          data-cover
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
            <SaveButton postId={outfit.id} count={outfit.likes} />
          </span>
          {outfit.tiktok_url ? (
            <span className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-ink/85 px-2.5 py-1 text-[11px] font-semibold text-surface">
              <VideoSourceIcon url={outfit.tiktok_url} className="h-3 w-3" /> {t("card.video")}
            </span>
          ) : (
            <span className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-ink/85 px-2.5 py-1 text-[11px] font-semibold text-surface">
              <Camera className="h-3 w-3" aria-hidden="true" /> {t("card.photo")}
            </span>
          )}
          {burst && (
            <Heart
              key={burst.key}
              aria-hidden="true"
              onAnimationEnd={() => setBurst(null)}
              className="heart-burst pointer-events-none absolute h-20 w-20 fill-current text-white drop-shadow-[0_6px_20px_rgba(0,0,0,0.35)]"
              style={{ left: burst.x - 40, top: burst.y - 40 }}
            />
          )}
        </div>
        <h3 className="mt-2.5 line-clamp-2 px-0.5 text-[15px] font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
          {outfit.title}
        </h3>
      </Link>
      {showCreator && (
        <div className="mt-1.5 px-0.5">
          <Link
            to="/@{$username}"
            params={{ username: outfit.creator_username }}
            className="inline-flex min-w-0 max-w-full items-center gap-2 text-[13px] text-foreground/75 hover:text-primary"
          >
            <Avatar src={outfit.creator_avatar} name={outfit.creator_username} />
            <span className="truncate">@{outfit.creator_username}</span>
          </Link>
        </div>
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
