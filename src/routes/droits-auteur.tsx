import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation, type TKey } from "@/lib/i18n";
import { absoluteUrl } from "@/lib/site";

type Search = { post?: string };

export const Route = createFileRoute("/droits-auteur")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    post: typeof s.post === "string" && /^[0-9a-f-]{36}$/i.test(s.post) ? s.post : undefined,
  }),
  head: () => ({ meta: [{ title: "Droits d'auteur — WantedFashion" }] }),
  component: CopyrightPage,
});

/**
 * Formulaire de retrait pour droits d'auteur.
 * Champs repris de l'article 16 §2 du règlement (UE) 2022/2065 (DSA) — motifs, lien exact,
 * nom + e-mail, déclaration de bonne foi — et du § 512(c)(3) du DMCA (identification de l'œuvre,
 * déclaration d'exactitude et de mandat, signature), comme les formulaires d'Instagram ou YouTube.
 */
function CopyrightPage() {
  const { t } = useTranslation();
  const { post } = Route.useSearch();
  const [f, setF] = useState({
    postUrl: post ? absoluteUrl(`/post/${post}`) : "",
    relation: "owner" as "owner" | "agent" | "other",
    work: "",
    original: "",
    explanation: "",
    name: "",
    email: "",
    goodFaith: false,
    accurate: false,
    signature: "",
  });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ref, setRef] = useState<string | null>(null);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));

  const ready =
    /\/post\/[0-9a-f-]{36}/i.test(f.postUrl) &&
    f.work.trim().length >= 10 &&
    f.explanation.trim().length >= 10 &&
    f.name.trim().length >= 2 &&
    /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email.trim()) &&
    f.signature.trim().length >= 2 &&
    f.goodFaith &&
    f.accurate;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready || sending) return;
    setSending(true);
    setError(null);
    const { data, error: err } = await supabase.rpc("submit_copyright_report" as never, {
      p_post_url: f.postUrl.trim(),
      p_relation: f.relation,
      p_work: f.work,
      p_original_url: /^https?:\/\//i.test(f.original.trim()) ? f.original.trim() : null,
      p_explanation: f.explanation,
      p_name: f.name,
      p_email: f.email,
      p_signature: f.signature,
      p_good_faith: f.goodFaith,
      p_accurate: f.accurate,
    } as never);
    setSending(false);
    if (err || !data) {
      const code = ["bad_post_url", "post_not_found", "too_many", "already_reported"].find((c) => err?.message?.includes(c));
      setError(t(`copyright.err_${code ?? "generic"}` as TKey));
      return;
    }
    const r = data as unknown as string;
    setRef(r);
    // Accusé de réception par e-mail (art. 16 §4 DSA) + alerte admin
    void supabase.functions.invoke("copyright-mail", { body: { kind: "receipt", ref: r } }).catch(() => undefined);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (ref) {
    return (
      <main className="mx-auto flex max-w-lg flex-col items-center gap-4 px-4 py-20 text-center">
        <CheckCircle2 className="h-12 w-12 text-emerald-700" aria-hidden="true" />
        <h1 className="font-display text-3xl font-bold">{t("copyright.sent")}</h1>
        <p className="text-foreground/75">{t("copyright.sentText").replace("{ref}", ref)}</p>
        <button
          type="button"
          onClick={() => {
            setRef(null);
            setF((s) => ({ ...s, postUrl: "", work: "", original: "", explanation: "", goodFaith: false, accurate: false }));
          }}
          className="mt-2 rounded-full border-[1.5px] border-border bg-surface px-5 py-3 text-sm font-semibold"
        >
          {t("copyright.another")}
        </button>
      </main>
    );
  }

  const input = "w-full rounded-2xl border-[1.5px] border-border bg-background px-4 py-3 text-[15px] outline-none focus:border-foreground/50";
  return (
    <main className="mx-auto max-w-xl px-4 pb-16 pt-6 md:pt-10">
      <h1 className="font-display text-3xl font-bold leading-tight md:text-4xl">{t("copyright.pageTitle")}</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-foreground/75">{t("copyright.intro")}</p>
      <p className="mt-1 text-sm text-foreground/60">{t("copyright.noAccount")}</p>

      <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
        <Step n={1} title={t("copyright.stepLook")}>
          <Field label={t("copyright.postUrl")} hint={t("copyright.postUrlHint")} id="cr-post">
            <input id="cr-post" type="url" inputMode="url" required value={f.postUrl} onChange={(e) => set("postUrl", e.target.value)} className={input} />
          </Field>
        </Step>

        <Step n={2} title={t("copyright.stepWork")}>
          <fieldset>
            <legend className="mb-2 text-sm font-semibold">{t("copyright.relation")}</legend>
            <div className="flex flex-col gap-2" role="radiogroup">
              {(["owner", "agent", "other"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  role="radio"
                  aria-checked={f.relation === r}
                  onClick={() => set("relation", r)}
                  className={`rounded-2xl border-[1.5px] px-4 py-3 text-left text-sm font-semibold transition-colors ${f.relation === r ? "border-ink bg-background" : "border-border"}`}
                >
                  {t(`copyright.${r}` as TKey)}
                </button>
              ))}
            </div>
          </fieldset>
          <Field label={t("copyright.work")} id="cr-work">
            <textarea id="cr-work" required rows={2} maxLength={1000} value={f.work} onChange={(e) => set("work", e.target.value)} placeholder={t("copyright.workPh")} className={input} />
          </Field>
          <Field label={t("copyright.original")} id="cr-orig">
            <input id="cr-orig" type="url" inputMode="url" value={f.original} onChange={(e) => set("original", e.target.value)} placeholder="https://" className={input} />
          </Field>
          <Field label={t("copyright.explanation")} id="cr-expl">
            <textarea id="cr-expl" required rows={3} maxLength={2000} value={f.explanation} onChange={(e) => set("explanation", e.target.value)} placeholder={t("copyright.explanationPh")} className={input} />
          </Field>
        </Step>

        <Step n={3} title={t("copyright.stepYou")}>
          <Field label={t("copyright.name")} id="cr-name">
            <input id="cr-name" required autoComplete="name" maxLength={120} value={f.name} onChange={(e) => set("name", e.target.value)} className={input} />
          </Field>
          <Field label={t("copyright.email")} hint={t("copyright.emailHint")} id="cr-email">
            <input id="cr-email" type="email" required autoComplete="email" maxLength={200} value={f.email} onChange={(e) => set("email", e.target.value)} className={input} />
          </Field>
        </Step>

        <Step n={4} title={t("copyright.stepSign")}>
          <Check checked={f.goodFaith} onChange={(v) => set("goodFaith", v)} label={t("copyright.goodFaith")} />
          <Check checked={f.accurate} onChange={(v) => set("accurate", v)} label={f.relation === "other" ? t("copyright.accurateOther") : t("copyright.accurate")} />
          <Field label={t("copyright.signature")} id="cr-sign">
            <input id="cr-sign" required maxLength={120} value={f.signature} onChange={(e) => set("signature", e.target.value)} className={`${input} font-display italic`} />
          </Field>
          <p className="text-xs leading-relaxed text-foreground/60">{t("copyright.falseWarning")}</p>
        </Step>

        {error && (
          <p role="alert" className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
            {error}
          </p>
        )}
        <button type="submit" disabled={!ready || sending} className="flex h-12 items-center justify-center gap-2 rounded-full bg-ink font-bold text-surface disabled:opacity-40">
          {sending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {t("copyright.send")}
        </button>
        <p className="text-center text-xs text-foreground/55">
          <Link to="/conditions" hash="droits-auteur" className="underline">
            {t("footer.terms")}
          </Link>{" "}
          ·{" "}
          <Link to="/confidentialite" className="underline">
            {t("footer.privacy")}
          </Link>
        </p>
      </form>
    </main>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-3xl bg-surface p-4 sm:p-5">
      <h2 className="flex items-center gap-2.5 text-[17px] font-bold">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-[13px] text-surface">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Field({ label, hint, id, children }: { label: string; hint?: string; id: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      {children}
      {hint && <span className="text-xs text-foreground/55">{hint}</span>}
    </div>
  );
}

function Check({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer gap-3 rounded-2xl border-[1.5px] border-border bg-background px-3.5 py-3 text-sm leading-snug">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--ink)]" />
      <span>{label}</span>
    </label>
  );
}
