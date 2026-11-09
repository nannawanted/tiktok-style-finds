import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Copyright, Loader2, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation, type TKey } from "@/lib/i18n";
import { absoluteUrl } from "@/lib/site";
import { LEGAL_UPDATED } from "@/lib/legal";
import { ContactMail } from "@/components/legal/LegalPage";

export type ReportKind = "copyright" | "trademark" | "illegal";
type Search = { post?: string; type?: ReportKind };

/** Catégories reprises de la base de transparence DSA de la Commission européenne (« statements of reasons »). */
export const ILLEGAL_CATEGORIES = [
  "speech",
  "privacy",
  "non_consensual",
  "minors",
  "sexual",
  "violence",
  "public_security",
  "scams",
  "products",
  "animals",
  "self_harm",
  "other",
] as const;
type Category = (typeof ILLEGAL_CATEGORIES)[number];

export const Route = createFileRoute("/droits-auteur")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    post: typeof s.post === "string" && /^[0-9a-f-]{36}$/i.test(s.post) ? s.post : undefined,
    type: s.type === "trademark" || s.type === "illegal" || s.type === "copyright" ? s.type : undefined,
  }),
  head: () => ({ meta: [{ title: "Signaler un contenu — WantedFashion" }] }),
  component: ReportPage,
});

/**
 * Formulaire public de signalement : droits d'auteur, marques, contenus illégaux.
 * Champs repris de l'article 16 §2 du règlement (UE) 2022/2065 (DSA) — motifs, lien exact, nom + e-mail
 * (sauf abus sexuels sur mineurs), déclaration de bonne foi —, du § 512(c)(3) du DMCA pour les droits d'auteur,
 * et du formulaire « marque » d'Instagram (titulaire, pays et numéro d'enregistrement, lien vers le registre).
 */
function ReportPage() {
  const { t } = useTranslation();
  const search = Route.useSearch();
  const [kind, setKind] = useState<ReportKind>(search.type ?? "copyright");
  const [f, setF] = useState({
    postUrl: search.post ? absoluteUrl(`/post/${search.post}`) : "",
    relation: "owner" as "owner" | "agent" | "other",
    work: "",
    original: "",
    explanation: "",
    category: "" as Category | "",
    tmName: "",
    tmCountry: "",
    tmNumber: "",
    tmRegistry: "",
    name: "",
    email: "",
    goodFaith: false,
    accurate: false,
    signature: "",
  });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ref, setRef] = useState<{ ref: string; anon: boolean } | null>(null);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));

  function changeKind(k: ReportKind) {
    setKind(k);
    setError(null);
    setF((s) => ({
      ...s,
      relation: k === "illegal" ? "other" : "owner",
      goodFaith: false,
      accurate: false,
    }));
  }

  // Signalement anonyme permis seulement pour les abus sexuels sur mineurs (art. 16 §2 c DSA)
  const anonAllowed = kind === "illegal" && f.category === "minors";
  const contactGiven = f.name.trim() !== "" || f.email.trim() !== "" || f.signature.trim() !== "";
  const anon = anonAllowed && !contactGiven;
  const contactOk =
    anon ||
    (f.name.trim().length >= 2 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email.trim()) && f.signature.trim().length >= 2);

  const ready =
    /\/post\/[0-9a-f-]{36}/i.test(f.postUrl) &&
    f.explanation.trim().length >= 10 &&
    (kind === "copyright" ? f.work.trim().length >= 10 : true) &&
    (kind === "trademark"
      ? f.work.trim().length >= 2 && f.tmName.trim().length >= 1 && f.tmCountry.trim().length >= 2 && f.tmNumber.trim().length >= 1
      : true) &&
    (kind === "illegal" ? f.category !== "" : true) &&
    contactOk &&
    f.goodFaith &&
    f.accurate;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready || sending) return;
    setSending(true);
    setError(null);
    const work = kind === "illegal" ? f.work.trim() || t(`copyright.cat_${f.category}` as TKey) : f.work;
    const { data, error: err } = await supabase.rpc("submit_copyright_report" as never, {
      p_post_url: f.postUrl.trim(),
      p_relation: f.relation,
      p_work: work,
      p_original_url: kind === "copyright" && /^https?:\/\//i.test(f.original.trim()) ? f.original.trim() : null,
      p_explanation: f.explanation,
      p_name: anon ? null : f.name,
      p_email: anon ? null : f.email,
      p_signature: anon ? null : f.signature,
      p_good_faith: f.goodFaith,
      p_accurate: f.accurate,
      p_kind: kind,
      p_category: kind === "illegal" ? f.category : null,
      p_tm_name: kind === "trademark" ? f.tmName : null,
      p_tm_country: kind === "trademark" ? f.tmCountry : null,
      p_tm_number: kind === "trademark" ? f.tmNumber : null,
      p_tm_registry_url: kind === "trademark" && /^https?:\/\//i.test(f.tmRegistry.trim()) ? f.tmRegistry.trim() : null,
    } as never);
    setSending(false);
    if (err || !data) {
      const code = ["bad_post_url", "post_not_found", "too_many", "already_reported"].find((c) => err?.message?.includes(c));
      setError(t(`copyright.err_${code ?? "generic"}` as TKey));
      return;
    }
    const r = data as unknown as string;
    setRef({ ref: r, anon });
    // Accusé de réception par e-mail (art. 16 §4 DSA) + alerte admin
    void supabase.functions.invoke("copyright-mail", { body: { kind: "receipt", ref: r } }).catch(() => undefined);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (ref) {
    return (
      <main className="mx-auto flex max-w-lg flex-col items-center gap-4 px-4 py-20 text-center">
        <CheckCircle2 className="h-12 w-12 text-emerald-700" aria-hidden="true" />
        <h1 className="font-display text-3xl font-bold">{t("copyright.sent")}</h1>
        <p className="text-foreground/75">{t(ref.anon ? "copyright.sentAnon" : "copyright.sentText").replace("{ref}", ref.ref)}</p>
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
  const KINDS: { k: ReportKind; icon: typeof Copyright; title: TKey; desc: TKey }[] = [
    { k: "copyright", icon: Copyright, title: "copyright.kCopyright", desc: "copyright.kCopyrightD" },
    { k: "trademark", icon: Tag, title: "copyright.kTrademark", desc: "copyright.kTrademarkD" },
    { k: "illegal", icon: AlertTriangle, title: "copyright.kIllegal", desc: "copyright.kIllegalD" },
  ];
  const relations: ("owner" | "agent" | "other")[] = kind === "trademark" ? ["owner", "agent"] : ["owner", "agent", "other"];
  const relLabel = (r: "owner" | "agent" | "other") =>
    kind === "trademark" ? t(r === "owner" ? "copyright.tmOwner" : "copyright.tmAgent") : t(`copyright.${r}` as TKey);

  return (
    <main className="mx-auto max-w-xl px-4 pb-16 pt-6 md:pt-10">
      <nav className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-primary">
        <Link to="/legal" className="hover:underline">
          {t("legal.hub")}
        </Link>
      </nav>
      <h1 className="font-display text-3xl font-bold leading-tight md:text-4xl">{t("copyright.reportTitle")}</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-foreground/75">{t("copyright.reportIntro")}</p>

      <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">{t("copyright.kindLabel")}</legend>
          <div className="grid gap-2 sm:grid-cols-3" role="radiogroup">
            {KINDS.map(({ k, icon: Icon, title, desc }) => (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={kind === k}
                onClick={() => changeKind(k)}
                className={`flex gap-3 rounded-2xl border-[1.5px] p-3 text-left transition-colors sm:flex-col sm:gap-1.5 ${kind === k ? "border-ink bg-surface" : "border-border"}`}
              >
                <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                <span>
                  <span className="block text-sm font-bold">{t(title)}</span>
                  <span className="block text-xs leading-snug text-foreground/65">{t(desc)}</span>
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        <Step n={1} title={t("copyright.stepLook")}>
          <Field label={t("copyright.postUrl")} hint={t("copyright.postUrlHint")} id="cr-post">
            <input id="cr-post" type="url" inputMode="url" required value={f.postUrl} onChange={(e) => set("postUrl", e.target.value)} className={input} />
          </Field>
        </Step>

        {kind === "copyright" && (
          <Step n={2} title={t("copyright.stepWork")}>
            <Relation value={f.relation} options={relations} label={relLabel} legend={t("copyright.relation")} onChange={(r) => set("relation", r)} />
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
        )}

        {kind === "trademark" && (
          <Step n={2} title={t("copyright.stepTm")}>
            <Relation value={f.relation} options={relations} label={relLabel} legend={t("copyright.relation")} onChange={(r) => set("relation", r)} />
            <Field label={t("copyright.tmOwnerName")} id="tm-owner">
              <input id="tm-owner" required maxLength={200} value={f.work} onChange={(e) => set("work", e.target.value)} placeholder={t("copyright.tmOwnerNamePh")} className={input} />
            </Field>
            <Field label={t("copyright.tmName")} id="tm-name">
              <input id="tm-name" required maxLength={200} value={f.tmName} onChange={(e) => set("tmName", e.target.value)} className={input} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("copyright.tmCountry")} id="tm-country">
                <input id="tm-country" required maxLength={100} value={f.tmCountry} onChange={(e) => set("tmCountry", e.target.value)} placeholder={t("copyright.tmCountryPh")} className={input} />
              </Field>
              <Field label={t("copyright.tmNumber")} id="tm-number">
                <input id="tm-number" required maxLength={100} value={f.tmNumber} onChange={(e) => set("tmNumber", e.target.value)} className={input} />
              </Field>
            </div>
            <Field label={t("copyright.tmRegistry")} hint={t("copyright.tmRegistryHint")} id="tm-reg">
              <input id="tm-reg" type="url" inputMode="url" value={f.tmRegistry} onChange={(e) => set("tmRegistry", e.target.value)} placeholder="https://" className={input} />
            </Field>
            <Field label={t("copyright.tmExplanation")} id="tm-expl">
              <textarea id="tm-expl" required rows={3} maxLength={2000} value={f.explanation} onChange={(e) => set("explanation", e.target.value)} placeholder={t("copyright.tmExplanationPh")} className={input} />
            </Field>
          </Step>
        )}

        {kind === "illegal" && (
          <Step n={2} title={t("copyright.stepIllegal")}>
            <Field label={t("copyright.category")} id="il-cat">
              <select id="il-cat" required value={f.category} onChange={(e) => set("category", e.target.value as Category)} className={input}>
                <option value="" disabled>
                  —
                </option>
                {ILLEGAL_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {t(`copyright.cat_${c}` as TKey)}
                  </option>
                ))}
              </select>
            </Field>
            {f.category === "minors" && (
              <div className="rounded-2xl bg-destructive/10 px-4 py-3 text-[13px] leading-snug">
                <p className="font-semibold">{t("copyright.minorsAnon")}</p>
                <p className="mt-1 text-foreground/75">
                  {t("copyright.minorsPolice")}{" "}
                  <a href="https://www.stopchildporno.be/" target="_blank" rel="noopener noreferrer" className="font-semibold underline">
                    stopchildporno.be
                  </a>
                </p>
              </div>
            )}
            <Field label={`${t("copyright.illegalWhat")} ${t("copyright.optional")}`} id="il-what">
              <input id="il-what" maxLength={1000} value={f.work} onChange={(e) => set("work", e.target.value)} placeholder={t("copyright.illegalWhatPh")} className={input} />
            </Field>
            <Field label={t("copyright.illegalExplanation")} id="il-expl">
              <textarea id="il-expl" required rows={4} maxLength={2000} value={f.explanation} onChange={(e) => set("explanation", e.target.value)} placeholder={t("copyright.illegalExplanationPh")} className={input} />
            </Field>
            <Relation
              value={f.relation === "other" ? "other" : "owner"}
              options={["owner", "other"]}
              label={(r) => t(r === "owner" ? "copyright.illegalMe" : "copyright.illegalNotMe")}
              legend={t("copyright.illegalRelation")}
              onChange={(r) => set("relation", r)}
            />
          </Step>
        )}

        <Step n={3} title={t("copyright.stepYou")}>
          <Field label={`${t("copyright.name")}${anonAllowed ? ` ${t("copyright.optional")}` : ""}`} id="cr-name">
            <input id="cr-name" required={!anonAllowed} autoComplete="name" maxLength={120} value={f.name} onChange={(e) => set("name", e.target.value)} className={input} />
          </Field>
          <Field label={`${t("copyright.email")}${anonAllowed ? ` ${t("copyright.optional")}` : ""}`} hint={t("copyright.emailHint")} id="cr-email">
            <input id="cr-email" type="email" required={!anonAllowed} autoComplete="email" maxLength={200} value={f.email} onChange={(e) => set("email", e.target.value)} className={input} />
          </Field>
        </Step>

        <Step n={4} title={t("copyright.stepSign")}>
          <Check
            checked={f.goodFaith}
            onChange={(v) => set("goodFaith", v)}
            label={t(kind === "trademark" ? "copyright.tmGoodFaith" : kind === "illegal" ? "copyright.illegalGoodFaith" : "copyright.goodFaith")}
          />
          <Check
            checked={f.accurate}
            onChange={(v) => set("accurate", v)}
            label={
              kind === "illegal" || f.relation === "other"
                ? t("copyright.accurateOther")
                : t(kind === "trademark" ? "copyright.tmAccurate" : "copyright.accurate")
            }
          />
          <Field label={`${t("copyright.signature")}${anonAllowed ? ` ${t("copyright.optional")}` : ""}`} id="cr-sign">
            <input id="cr-sign" required={!anonAllowed} maxLength={120} value={f.signature} onChange={(e) => set("signature", e.target.value)} className={`${input} font-display italic`} />
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
      </form>

      <Policy />
    </main>
  );
}

/**
 * Ce qui se passe après un signalement. Repris des pratiques publiées par YouTube (avertissements de 90 jours,
 * 3 = suspension), Instagram / Pinterest (exceptions, contre-notification) et des articles 16, 17, 20 et 23 du DSA.
 */
function Policy() {
  const { t } = useTranslation();
  const items: { id: string; title: string; body: ReactNode }[] = [
    {
      id: "apres",
      title: "Après ton signalement",
      body: (
        <ul>
          <li>Tu reçois un accusé de réception par e-mail avec une référence.</li>
          <li>Une personne examine le signalement, sans outil automatique, de façon objective et sans retard. Les signalements d'abus sur mineurs sont traités en priorité.</li>
          <li>Tu reçois notre décision par e-mail, avec les recours possibles.</li>
          <li>
            Si le look est retiré, le créateur reçoit un message qui explique la mesure, sa raison et comment la contester.
            Ton nom et ton e-mail ne lui sont communiqués que si c'est strictement nécessaire.
          </li>
        </ul>
      ),
    },
    {
      id: "exceptions",
      title: "Avant de signaler : ce qui reste autorisé",
      body: (
        <ul>
          <li>
            <strong>Droits d'auteur</strong> : la loi prévoit des exceptions, par exemple la citation, la critique, la
            parodie, la caricature ou le pastiche (article 5 de la directive 2001/29/CE, article XI.190 du Code de droit
            économique en Belgique). Une utilisation qui entre dans une exception n'est pas une violation.
          </li>
          <li>
            <strong>Marques</strong> : citer une marque pour décrire un vrai produit (« veste de la marque X ») est en
            principe permis. Ce qui est visé, ce sont les contrefaçons et l'usage trompeur d'une marque, par exemple un compte
            qui se fait passer pour elle.
          </li>
          <li>
            Un contenu qui ne te plaît pas mais qui n'est pas illégal peut être signalé avec le bouton « Signaler » s'il ne
            respecte pas nos <Link to="/regles">Règles de la communauté</Link>.
          </li>
        </ul>
      ),
    },
    {
      id: "avertissements",
      title: "Avertissements et suspension",
      body: (
        <p>
          Chaque look retiré pour droits d'auteur ou pour une marque donne au créateur un avertissement valable 90 jours. À 3
          avertissements actifs, le compte est suspendu. Pour un contenu illégal, la mesure dépend de la gravité : en cas de
          manquement grave, le compte peut être suspendu immédiatement (voir les{" "}
          <Link to="/conditions" hash="moderation">Conditions d'utilisation</Link>).
        </p>
      ),
    },
    {
      id: "contester",
      title: "Contester une décision",
      body: (
        <p>
          Le créateur comme la personne qui a signalé peuvent contester la décision pendant 6 mois en écrivant à{" "}
          <ContactMail />. Une personne réexamine le dossier ; si la contestation est fondée, l'avertissement est annulé. Les
          autres recours (organismes de règlement des litiges certifiés, IBPT, tribunaux) sont expliqués sur la page{" "}
          <Link to="/dsa">Services numériques (DSA)</Link>.
        </p>
      ),
    },
    {
      id: "abus",
      title: "Signalements abusifs",
      body: (
        <p>
          Une fausse déclaration peut engager la responsabilité de son auteur. Si une personne envoie souvent des
          signalements manifestement infondés, nous pouvons, après l'avoir prévenue, arrêter de traiter ses signalements
          pendant un temps raisonnable (article 23 du DSA).
        </p>
      ),
    },
  ];
  return (
    <section aria-labelledby="how" className="mt-10">
      <h2 id="how" className="font-display text-2xl font-bold">
        {t("copyright.howItWorks")}
      </h2>
      <p className="mt-1 text-xs font-semibold text-foreground/55">
        {t("legal.version")} {LEGAL_UPDATED}
      </p>
      <div className="mt-4 flex flex-col gap-3">
        {items.map((it) => (
          <article key={it.id} id={it.id} className="legal-body scroll-mt-24 rounded-3xl bg-card p-5 text-[14.5px] leading-relaxed">
            <h3 className="!mt-0 text-[17px] font-bold">{it.title}</h3>
            <div className="mt-2">{it.body}</div>
          </article>
        ))}
      </div>
      <p className="mt-4 text-center text-xs text-foreground/55">
        <Link to="/conditions" hash="droits-auteur" className="underline">
          {t("footer.terms")}
        </Link>{" "}
        ·{" "}
        <Link to="/confidentialite" className="underline">
          {t("footer.privacy")}
        </Link>{" "}
        ·{" "}
        <Link to="/legal" className="underline">
          {t("legal.hub")}
        </Link>
      </p>
    </section>
  );
}

function Relation<R extends string>({
  value,
  options,
  label,
  legend,
  onChange,
}: {
  value: R;
  options: R[];
  label: (r: R) => string;
  legend: string;
  onChange: (r: R) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold">{legend}</legend>
      <div className="flex flex-col gap-2" role="radiogroup">
        {options.map((r) => (
          <button
            key={r}
            type="button"
            role="radio"
            aria-checked={value === r}
            onClick={() => onChange(r)}
            className={`rounded-2xl border-[1.5px] px-4 py-3 text-left text-sm font-semibold transition-colors ${value === r ? "border-ink bg-background" : "border-border"}`}
          >
            {label(r)}
          </button>
        ))}
      </div>
    </fieldset>
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
