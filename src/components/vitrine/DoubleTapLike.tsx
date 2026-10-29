import { useRef, useState } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/i18n";
import { useSavedIds, useToggleSave } from "@/lib/social";
import { useCollectionPicker } from "./CollectionPicker";

/**
 * Zone « double-tap pour liker » (comme Instagram) : deux touchers rapprochés
 * sur la photo = un cœur qui apparaît en grand. Double-taper une tenue déjà
 * likée ne la retire pas (comme sur Instagram).
 */
const DOUBLE_TAP_MS = 260;

export function DoubleTapLike({
  postId,
  children,
  className = "",
  onSingleTap,
}: {
  postId: string;
  children: React.ReactNode;
  className?: string;
  /** Un seul toucher (ex. ouvrir la vidéo d'origine). Deux touchers rapides = like, sans ouvrir. */
  onSingleTap?: () => void;
}) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: savedIds } = useSavedIds();
  const toggle = useToggleSave();
  const picker = useCollectionPicker();
  const last = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [burst, setBurst] = useState<{ x: number; y: number; key: number } | null>(null);

  function like(x: number, y: number) {
    setBurst({ x, y, key: Date.now() });
    if (!user) {
      toast(t("card.loginToSave"));
      navigate({ to: "/login" });
      return;
    }
    if (!savedIds?.has(postId)) {
      toggle.mutate(
        { postId, saved: false },
        {
          onSuccess: () =>
            toast(t("engage.savedToast"), { action: { label: t("engage.addToCollection"), onClick: () => picker.open(postId) } }),
          onError: () => toast.error(t("card.actionError")),
        },
      );
    }
  }

  return (
    <div
      className={`relative touch-manipulation select-none ${onSingleTap ? "cursor-pointer" : ""} ${className}`}
      onClick={(e) => {
        const now = Date.now();
        const r = e.currentTarget.getBoundingClientRect();
        if (now - last.current < DOUBLE_TAP_MS) {
          clearTimeout(timer.current);
          last.current = 0;
          like(e.clientX - r.left, e.clientY - r.top);
          return;
        }
        last.current = now;
        if (onSingleTap) timer.current = setTimeout(onSingleTap, DOUBLE_TAP_MS);
      }}
    >
      {children}
      {burst && (
        <Heart
          key={burst.key}
          aria-hidden="true"
          onAnimationEnd={() => setBurst(null)}
          className="heart-burst pointer-events-none absolute h-24 w-24 fill-current text-white drop-shadow-[0_6px_20px_rgba(0,0,0,0.35)]"
          style={{ left: burst.x - 48, top: burst.y - 48 }}
        />
      )}
    </div>
  );
}

/** Like rapide (double-toucher sur une carte du fil) : même règle que sur la page de la tenue. */
export function useQuickLike(postId: string) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: savedIds } = useSavedIds();
  const toggle = useToggleSave();
  const picker = useCollectionPicker();
  return () => {
    if (!user) {
      toast(t("card.loginToSave"));
      navigate({ to: "/login" });
      return false;
    }
    if (!savedIds?.has(postId)) {
      toggle.mutate(
        { postId, saved: false },
        {
          onSuccess: () => toast(t("engage.savedToast"), { action: { label: t("engage.addToCollection"), onClick: () => picker.open(postId) } }),
          onError: () => toast.error(t("card.actionError")),
        },
      );
    }
    return true;
  };
}
