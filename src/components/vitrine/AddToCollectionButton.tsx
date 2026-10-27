import { FolderPlus } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/i18n";
import { useCollectionPicker } from "./CollectionPicker";

export function AddToCollectionButton({ postId }: { postId: string }) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const picker = useCollectionPicker();
  return (
    <button
      type="button"
      aria-label={t("engage.addToCollection")}
      title={t("engage.addToCollection")}
      onClick={() => {
        if (!user) {
          toast(t("card.loginToSave"));
          navigate({ to: "/login" });
          return;
        }
        picker.open(postId);
      }}
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border bg-surface transition-colors hover:bg-card"
    >
      <FolderPlus className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}
