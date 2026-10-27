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
export function DoubleTapLike({ postId, children, className = "" }: { postId: string; children: React.ReactNode; className?: string }) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: savedIds } = useSavedIds();
  const toggle = useToggleSave();
  const picker = useCollectionPicker();
  const last = useRef(0);
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
      className={`relative select-none ${className}`}
      onDoubleClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        like(e.clientX - r.left, e.clientY - r.top);
      }}
      onTouchEnd={(e) => {
        const now = Date.now();
        if (now - last.current < 300) {
          e.preventDefault(); // évite le zoom au double-toucher sur iPhone
          const touch = e.changedTouches[0];
          const r = e.currentTarget.getBoundingClientRect();
          like(touch.clientX - r.left, touch.clientY - r.top);
          last.current = 0;
        } else {
          last.current = now;
        }
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
