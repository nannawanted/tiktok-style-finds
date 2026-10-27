import { useRef } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/i18n";
import { useSavedIds, useToggleSave } from "@/lib/social";
import { useCollectionPicker } from "./CollectionPicker";

export function SaveButton({ postId, variant = "icon", count }: { postId: string; variant?: "icon" | "wide"; count?: number }) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: savedIds } = useSavedIds();
  const toggle = useToggleSave();
  const saved = !!savedIds?.has(postId);
  const picker = useCollectionPicker();

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast(t("card.loginToSave"));
      navigate({ to: "/login" });
      return;
    }
    toggle.mutate(
      { postId, saved },
      {
        onSuccess: () => {
          // Après un cœur : proposer de ranger la tenue dans une collection (Pinterest)
          if (!saved) toast(t("engage.savedToast"), { action: { label: t("engage.addToCollection"), onClick: () => picker.open(postId) } });
        },
        onError: () => toast.error(t("card.actionError")),
      },
    );
  }

  const label = saved ? t("card.unsave") : t("card.save");
  // État au chargement, pour ajuster le compteur sans attendre le serveur
  const initiallySaved = useRef<boolean | null>(null);
  if (initiallySaved.current === null && savedIds) initiallySaved.current = saved;

  if (variant === "wide") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={saved}
        className="flex h-12 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full border border-border bg-surface px-3 text-[15px] font-semibold sm:gap-2 sm:text-base text-foreground transition-colors hover:bg-card"
      >
        <Heart key={String(saved)} className={`h-5 w-5 shrink-0 text-primary ${saved ? "heart-pop fill-current" : ""}`} />
        <span className="truncate">{saved ? t("card.saved") : t("card.save")}</span>
      </button>
    );
  }

  // Nombre de likes affiché à côté du cœur (mis à jour tout de suite quand on like)
  const shown = count === undefined ? undefined : Math.max(0, count + (saved && !initiallySaved.current ? 1 : 0) - (!saved && initiallySaved.current ? 1 : 0));
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={shown ? `${label} (${shown})` : label}
      aria-pressed={saved}
      className={`flex h-10 items-center justify-center gap-1 rounded-full bg-surface/95 shadow-sm backdrop-blur transition-transform hover:scale-105 active:scale-95 ${shown ? "pl-2.5 pr-3" : "w-10"}`}
    >
      <Heart key={String(saved)} className={`h-[18px] w-[18px] shrink-0 text-primary ${saved ? "heart-pop fill-current" : ""}`} />
      {!!shown && <span className="text-[13px] font-bold tabular-nums text-foreground">{formatLikes(shown)}</span>}
    </button>
  );
}

function formatLikes(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}
