import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/i18n";
import { useFollowedIds, useToggleFollow } from "@/lib/social";

export function FollowButton({
  creatorId,
  size = "md",
  tone = "dark",
  className = "",
}: {
  creatorId: string;
  size?: "md" | "lg";
  tone?: "dark" | "brand";
  className?: string;
}) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: followed } = useFollowedIds();
  const toggle = useToggleFollow();
  const following = !!followed?.has(creatorId);

  // On ne se suit pas soi-même : pas de bouton sur sa propre page.
  if (user?.id === creatorId) return null;

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast(t("card.loginToFollow"));
      navigate({ to: "/login" });
      return;
    }
    toggle.mutate({ creatorId, following }, { onError: () => toast.error(t("card.actionError")) });
  }

  const sizeCls = size === "lg" ? "h-12 px-8 text-base" : "h-11 px-5 text-sm";
  const colorCls = following
    ? "border border-border bg-surface text-foreground hover:bg-card"
    : tone === "brand"
      ? "bg-primary text-primary-foreground hover:bg-primary/90"
      : "bg-ink text-surface hover:bg-ink/85";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={following}
      className={`inline-flex items-center justify-center rounded-full font-bold transition-all active:scale-95 ${sizeCls} ${colorCls} ${className}`}
    >
      {following ? t("card.followingBtn") : t("card.follow")}
    </button>
  );
}
