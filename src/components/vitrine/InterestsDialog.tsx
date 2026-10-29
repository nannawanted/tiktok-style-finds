import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/i18n";
import { useMyInterests, useSetInterests } from "@/lib/social";
import { MAX_STYLES, type StyleKey } from "@/lib/styles";
import { StylePicker } from "./StyleChips";

const skippedKey = (id: string) => `wf_interests_skipped:${id}`;

/**
 * Au premier passage après connexion : « Quels styles tu aimes ? »
 * (comme Pinterest qui demande des centres d'intérêt). On peut passer.
 */
export function InterestsDialog() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { data: interests, isSuccess } = useMyInterests();
  const save = useSetInterests();
  const [picked, setPicked] = useState<StyleKey[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user || !isSuccess || (interests && interests.length > 0)) return setOpen(false);
    if (/^\/(login|signup|dashboard)/.test(path)) return;
    let skipped = false;
    try {
      skipped = !!localStorage.getItem(skippedKey(user.id));
    } catch {
      /* stockage indisponible */
    }
    if (!skipped) setOpen(true);
  }, [user, isSuccess, interests, path]);

  function skip() {
    if (user) {
      try {
        localStorage.setItem(skippedKey(user.id), "1");
      } catch {
        /* ignore */
      }
    }
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && skip()}>
      <DialogContent className="w-[calc(100vw-24px)] max-w-md grid-cols-1 rounded-3xl border-border bg-surface p-6 [&>*]:min-w-0">
        <DialogTitle className="font-display text-3xl">{t("engage.interestsTitle")}</DialogTitle>
        <DialogDescription className="sr-only">{t("engage.interestsText")}</DialogDescription>
        <StylePicker value={picked} onChange={setPicked} max={MAX_STYLES} onMax={() => toast(t("creatorSettings.maxStyles"))} />
        <div className="mt-2 flex gap-2">
          <button type="button" onClick={skip} className="h-12 flex-1 rounded-full border border-border font-semibold">
            {t("engage.interestsSkip")}
          </button>
          <button
            type="button"
            disabled={!picked.length || save.isPending}
            onClick={() =>
              save.mutate(picked, {
                onSuccess: () => setOpen(false),
                onError: () => toast.error(t("card.actionError")),
              })
            }
            className="h-12 flex-1 rounded-full bg-primary font-bold text-primary-foreground disabled:opacity-50"
          >
            {t("engage.interestsSave")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
