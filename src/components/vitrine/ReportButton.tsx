import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Flag, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useTranslation, type TKey } from "@/lib/i18n";

const REASONS: { key: string; label: TKey; hint: TKey }[] = [
  { key: "broken_link", label: "report.brokenLink", hint: "report.brokenLinkHint" },
  { key: "scam", label: "report.scam", hint: "report.scamHint" },
  { key: "shocking", label: "report.shocking", hint: "report.shockingHint" },
  { key: "stolen_photo", label: "report.stolen", hint: "report.stolenHint" },
];

/** « Signaler ce contenu » : choix du motif, envoyé à la modération (compte connecté requis). */
export function ReportButton({ postId, className = "" }: { postId: string; className?: string }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string | null>(null);
  const [details, setDetails] = useState("");
  const [sending, setSending] = useState(false);

  async function send() {
    if (!reason) return;
    setSending(true);
    const { error } = await supabase.rpc("report_post" as never, { p_post: postId, p_reason: reason, p_details: details } as never);
    setSending(false);
    if (error) {
      toast.error(t("report.error"));
      return;
    }
    setOpen(false);
    setReason(null);
    setDetails("");
    toast.success(t("report.thanks"));
    // À 3 signalements, l'admin reçoit aussi un e-mail (si le service d'e-mail est configuré)
    void supabase.functions.invoke("report-alert", { body: { post_id: postId } }).catch(() => undefined);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (!user) {
            toast(t("report.loginFirst"));
            navigate({ to: "/login" });
            return;
          }
          setOpen(true);
        }}
        className={`inline-flex items-center gap-1 underline hover:text-primary ${className}`}
      >
        <Flag className="h-3 w-3" aria-hidden="true" /> {t("outfit.report")}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[calc(100vw-24px)] max-w-md grid-cols-1 rounded-3xl border-border bg-surface p-5 [&>*]:min-w-0">
          <DialogTitle className="font-display text-2xl">{t("report.title")}</DialogTitle>
          <DialogDescription className="sr-only">{t("report.subtitle")}</DialogDescription>
          <div className="mt-1 flex flex-col gap-2" role="radiogroup">
            {REASONS.map((r) => (
              <button
                key={r.key}
                type="button"
                role="radio"
                aria-checked={reason === r.key}
                onClick={() => setReason(r.key)}
                className={`rounded-2xl border-[1.5px] px-4 py-3 text-left transition-colors ${reason === r.key ? "border-ink bg-background" : "border-border"}`}
              >
                <span className="block text-[15px] font-semibold">{t(r.label)}</span>
                <span className="block text-[13px] text-foreground/60">{t(r.hint)}</span>
              </button>
            ))}
          </div>
          <label className="mt-1 block text-sm font-semibold" htmlFor={`report-details-${postId}`}>
            {t("report.details")}
          </label>
          <textarea
            id={`report-details-${postId}`}
            value={details}
            onChange={(e) => setDetails(e.target.value.slice(0, 500))}
            rows={3}
            placeholder={t("report.detailsPlaceholder")}
            className="w-full rounded-2xl border-[1.5px] border-border bg-background px-3 py-2 text-[15px] outline-none focus:border-foreground/50"
          />
          <button
            type="button"
            disabled={!reason || sending}
            onClick={send}
            className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary font-bold text-primary-foreground disabled:opacity-40"
          >
            {sending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {t("report.send")}
          </button>
        </DialogContent>
      </Dialog>
    </>
  );
}
