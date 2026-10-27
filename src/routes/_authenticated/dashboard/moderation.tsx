import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, ExternalLink, ShieldAlert, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation, type TKey } from "@/lib/i18n";
import { REPORT_ALERT_THRESHOLD, useIsAdmin, useModerationQueue, type ModerationItem } from "@/lib/social";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/dashboard/moderation")({
  head: () => ({ meta: [{ title: "Modération — Wanted Fashion" }, { name: "robots", content: "noindex" }] }),
  component: Moderation,
});

const REASON_LABEL: Record<string, TKey> = {
  broken_link: "report.brokenLink",
  scam: "report.scam",
  shocking: "report.shocking",
  stolen_photo: "report.stolen",
};

function ReasonCounts({ postId }: { postId: string }) {
  const { t } = useTranslation();
  const { data } = useQuery({
    queryKey: ["moderation-reasons", postId],
    queryFn: async () => {
      const { data: rows } = await supabase.rpc("moderation_reason_counts" as never, { p_post: postId } as never);
      return (rows ?? []) as { reason: string; n: number }[];
    },
  });
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {(data ?? []).map((r) => (
        <span key={r.reason} className="rounded-full bg-background px-2.5 py-1 text-[12px] font-semibold">
          {REASON_LABEL[r.reason] ? t(REASON_LABEL[r.reason]) : r.reason} · {Number(r.n)}
        </span>
      ))}
    </div>
  );
}

/** Admin : tenues signalées. À 3 signalements, une alerte arrive ; l'admin garde ou supprime. */
function Moderation() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data: isAdmin } = useIsAdmin();
  const { data, isLoading } = useModerationQueue(1);
  const [toRemove, setToRemove] = useState<ModerationItem | null>(null);

  async function act(postId: string, action: "keep" | "remove") {
    const { error } = await supabase.rpc("moderate_post" as never, { p_post: postId, p_action: action } as never);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(action === "keep" ? t("moderation.kept") : t("moderation.removed"));
    qc.invalidateQueries({ queryKey: ["moderation-queue"] });
    qc.invalidateQueries({ queryKey: ["feed"] });
  }

  if (isAdmin === false) {
    return <main className="mx-auto max-w-2xl px-4 py-10 text-center text-foreground/70">{t("brandStats.adminOnly")}</main>;
  }

  const items = data ?? [];
  return (
    <main className="mx-auto max-w-3xl px-4 pb-16 pt-4 md:pt-8">
      <div className="flex items-center gap-3">
        <Link to="/dashboard" aria-label={t("studio.back")} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface">
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </Link>
        <h1 className="font-display text-3xl font-bold">{t("moderation.title")}</h1>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-foreground/65">{t("moderation.intro")}</p>

      {isLoading ? (
        <p className="mt-6 text-sm text-foreground/60">…</p>
      ) : items.length === 0 ? (
        <p className="mt-6 rounded-3xl border-[1.5px] border-dashed border-border p-8 text-center text-sm text-foreground/65">{t("moderation.empty")}</p>
      ) : (
        <ul className="mt-5 space-y-3">
          {items.map((it) => {
            const alert = it.open_reports >= REPORT_ALERT_THRESHOLD;
            return (
              <li key={it.post_id} className={`rounded-3xl p-4 ${alert ? "bg-primary/10 ring-2 ring-primary/40" : "bg-surface"}`}>
                <div className="flex gap-3">
                  <Link to="/post/$id" params={{ id: it.post_id }} className="h-24 w-[72px] shrink-0 overflow-hidden rounded-2xl bg-card">
                    {it.cover_image && <img src={it.cover_image} alt="" className="h-full w-full object-cover" />}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 text-[13px] font-bold text-primary">
                      {alert && <ShieldAlert className="h-4 w-4" aria-hidden="true" />}
                      {it.open_reports} {it.open_reports > 1 ? t("moderation.reports") : t("moderation.report")}
                    </p>
                    <p className="truncate text-[15px] font-bold">{it.title}</p>
                    <p className="truncate text-[13px] text-foreground/60">@{it.creator_username}</p>
                    <ReasonCounts postId={it.post_id} />
                  </div>
                </div>
                {it.details.length > 0 && (
                  <ul className="mt-3 space-y-1.5">
                    {it.details.slice(0, 5).map((d, i) => (
                      <li key={i} className="rounded-2xl bg-background px-3 py-2 text-[13px] leading-snug text-foreground/80">« {d} »</li>
                    ))}
                  </ul>
                )}
                <div className="mt-3 grid grid-cols-[1fr_1fr_auto] gap-2">
                  <button type="button" onClick={() => act(it.post_id, "keep")} className="flex h-11 items-center justify-center gap-1.5 rounded-full border-[1.5px] border-border bg-surface text-sm font-semibold">
                    <Check className="h-4 w-4" aria-hidden="true" /> {t("moderation.keep")}
                  </button>
                  <button type="button" onClick={() => setToRemove(it)} className="flex h-11 items-center justify-center gap-1.5 rounded-full bg-destructive text-sm font-semibold text-destructive-foreground">
                    <Trash2 className="h-4 w-4" aria-hidden="true" /> {t("moderation.remove")}
                  </button>
                  <Link to="/post/$id" params={{ id: it.post_id }} aria-label={t("dashboard.preview")} className="flex h-11 w-11 items-center justify-center rounded-full bg-surface">
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <AlertDialog open={!!toRemove} onOpenChange={(o) => !o && setToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("moderation.removeTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("moderation.removeDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("dashboard.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (toRemove) void act(toRemove.post_id, "remove");
                setToRemove(null);
              }}
            >
              {t("moderation.remove")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
