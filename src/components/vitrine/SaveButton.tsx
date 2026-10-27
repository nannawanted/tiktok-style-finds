import { Heart } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/i18n";
import { useSavedIds, useToggleSave } from "@/lib/social";
import { useCollectionPicker } from "./CollectionPicker";

export function SaveButton({ postId, variant = "icon" }: { postId: string; variant?: "icon" | "wide" }) {
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

  if (variant === "wide") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={saved}
        className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-border bg-surface font-semibold text-foreground transition-colors hover:bg-card"
      >
        <Heart key={String(saved)} className={`h-5 w-5 text-primary ${saved ? "heart-pop fill-current" : ""}`} />
        {saved ? t("card.saved") : t("card.save")}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={saved}
      className="flex h-10 w-10 items-center justify-center rounded-full bg-surface/95 shadow-sm backdrop-blur transition-transform hover:scale-110 active:scale-95"
    >
      <Heart key={String(saved)} className={`h-[18px] w-[18px] text-primary ${saved ? "heart-pop fill-current" : ""}`} />
    </button>
  );
}
