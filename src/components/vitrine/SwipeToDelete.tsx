import { useRef, useState, type ReactNode } from "react";
import { Trash2, X } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

const OPEN_AT = 88; // largeur du bouton « Supprimer » révélé

/**
 * Balayer vers la gauche pour supprimer, comme dans Mail ou les notifications d'Instagram :
 * - un long balayage supprime directement ;
 * - un petit balayage montre le bouton rouge « Supprimer » (toucher pour confirmer) ;
 * - à la souris, une petite croix apparaît au survol.
 */
export function SwipeToDelete({
  children,
  onDelete,
  className = "",
  rowClassName = "",
}: {
  children: ReactNode;
  onDelete: () => void;
  /** Classes du conteneur (marges, arrondis). */
  className?: string;
  /** Classes de la ligne qui glisse : elle doit avoir un fond opaque. */
  rowClassName?: string;
}) {
  const { t } = useTranslation();
  const [x, setX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const start = useRef<{ x: number; y: number; base: number; t: number; axis: "x" | "y" | null } | null>(null);
  const moved = useRef(false);

  function remove() {
    setLeaving(true);
    setX(-(rowRef.current?.offsetWidth ?? 400));
    // La ligne glisse hors de l'écran, puis se referme
    setTimeout(() => setGone(true), 220);
    setTimeout(onDelete, 420);
  }

  function onPointerDown(e: React.PointerEvent) {
    if (leaving || e.pointerType === "mouse") return;
    start.current = { x: e.clientX, y: e.clientY, base: x, t: Date.now(), axis: null };
    moved.current = false;
  }
  function onPointerMove(e: React.PointerEvent) {
    const s = start.current;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (!s.axis) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      s.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      if (s.axis === "x") {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        setDragging(true);
      }
    }
    if (s.axis !== "x") return;
    moved.current = true;
    const next = Math.min(0, s.base + dx);
    // Un peu de résistance quand on va au-delà du bouton
    setX(next < -OPEN_AT ? -OPEN_AT + (next + OPEN_AT) * 0.85 : next);
  }
  function onPointerUp() {
    const s = start.current;
    start.current = null;
    if (!s || s.axis !== "x") return;
    setDragging(false);
    const width = rowRef.current?.offsetWidth ?? 400;
    const fast = Date.now() - s.t < 250 && x < -40;
    if (-x > width * 0.5 || (fast && -x > OPEN_AT)) remove();
    else if (-x > OPEN_AT / 2 || fast) setX(-OPEN_AT);
    else setX(0);
  }

  return (
    <div
      className={`group relative overflow-hidden ${className}`}
      style={{ maxHeight: gone ? 0 : 400, opacity: gone ? 0 : 1, transition: "max-height 200ms ease-in, opacity 200ms ease-in" }}
    >
      {/* Fond rouge révélé par le balayage */}
      <button
        type="button"
        onClick={remove}
        tabIndex={x < 0 ? 0 : -1}
        aria-hidden={x === 0}
        className="absolute inset-y-0 right-0 flex items-center justify-end bg-destructive pr-5 text-[13px] font-bold text-destructive-foreground"
        style={{ width: Math.max(OPEN_AT, -x) }}
      >
        <span className="flex flex-col items-center gap-1">
          <Trash2 className="h-5 w-5" aria-hidden="true" />
          {t("engage.delete")}
        </span>
      </button>
      <div
        ref={rowRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClickCapture={(e) => {
          // Après un balayage, le doigt levé ne doit pas ouvrir le lien
          if (moved.current) {
            e.preventDefault();
            e.stopPropagation();
            moved.current = false;
          } else if (x !== 0) {
            e.preventDefault();
            e.stopPropagation();
            setX(0);
          }
        }}
        className={`relative ${rowClassName}`}
        style={{ transform: `translateX(${x}px)`, transition: dragging ? "none" : "transform 220ms cubic-bezier(.2,.8,.2,1)", touchAction: "pan-y" }}
      >
        {children}
        {/* Souris / clavier : petite croix */}
        <button
          type="button"
          onClick={remove}
          aria-label={t("engage.delete")}
          className="absolute right-1.5 top-1.5 hidden h-7 w-7 items-center justify-center rounded-full bg-background/90 text-foreground/60 opacity-0 shadow-sm transition-opacity hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:hover)]:flex"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
