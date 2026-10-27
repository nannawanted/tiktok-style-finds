import { useEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";

export type PhotoTag = { id: string; n: number; x: number; y: number; name: string; brand: string | null; price: string | null; href: string };

/**
 * Photo de la tenue avec les pièces placées dessus (comme les tags produits
 * d'Instagram). Les positions sont en % de l'image entière ; on tient compte
 * du recadrage `object-cover` pour que les points restent au bon endroit.
 */
export function TaggedImage({ src, alt, className = "", tags }: { src: string; alt: string; className?: string; tags: PhotoTag[] }) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [box, setBox] = useState<{ w: number; h: number; nw: number; nh: number } | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    const measure = () => {
      if (img.naturalWidth) setBox({ w: img.clientWidth, h: img.clientHeight, nw: img.naturalWidth, nh: img.naturalHeight });
    };
    measure();
    img.addEventListener("load", measure);
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    ro?.observe(img);
    return () => {
      img.removeEventListener("load", measure);
      ro?.disconnect();
    };
  }, [src]);

  function place(x: number, y: number) {
    if (!box) return null;
    const scale = Math.max(box.w / box.nw, box.h / box.nh);
    const dw = box.nw * scale;
    const dh = box.nh * scale;
    const left = (x / 100) * dw - (dw - box.w) / 2;
    const top = (y / 100) * dh - (dh - box.h) / 2;
    if (left < 0 || top < 0 || left > box.w || top > box.h) return null; // hors du cadre visible
    return { left, top };
  }

  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  return (
    <>
      <img ref={imgRef} src={src} alt={alt} referrerPolicy="no-referrer" draggable={false} className={className} />
      {box &&
        tags.map((tag) => {
          const pos = place(tag.x, tag.y);
          if (!pos) return null;
          const isOpen = open === tag.id;
          const right = pos.left > box.w * 0.55;
          return (
            <span key={tag.id} className="absolute z-10" style={{ left: pos.left, top: pos.top }} onDoubleClick={stop} onTouchEnd={stop}>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-label={`${tag.n}. ${tag.brand ? `${tag.brand} · ` : ""}${tag.name}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(isOpen ? null : tag.id);
                }}
                className="heart-pop flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-surface text-[13px] font-bold text-foreground shadow-[0_0_0_4px_rgba(255,250,240,.45),0_6px_14px_-4px_rgba(0,0,0,.6)] transition-transform active:scale-90"
              >
                {tag.n}
              </button>
              {isOpen && (
                <a
                  href={tag.href}
                  target="_blank"
                  rel="noopener noreferrer nofollow sponsored"
                  onClick={stop}
                  className="absolute top-5 flex w-max max-w-[220px] items-center gap-2 rounded-2xl bg-ink px-3 py-2 text-left text-surface shadow-lg"
                  style={right ? { right: -16 } : { left: -16 }}
                >
                  <span className="min-w-0">
                    {tag.brand && <span className="block truncate text-[10px] font-bold uppercase tracking-wider text-surface/70">{tag.brand}</span>}
                    <span className="block truncate text-[13px] font-semibold">{tag.name}</span>
                    {tag.price && <span className="block text-[12px] font-bold text-surface/85">{tag.price}</span>}
                  </span>
                  <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                </a>
              )}
            </span>
          );
        })}
    </>
  );
}
