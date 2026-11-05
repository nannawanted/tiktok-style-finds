import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Printer, Search, ShieldCheck, ShieldX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation, type TKey } from "@/lib/i18n";
import { useIsAdmin } from "@/lib/social";

type Event = { id: number; at: string; kind: "signup_age" | "terms_accept" | "cookie_choice" | "account_deleted"; data: Record<string, unknown>; hash: string };

export const Route = createFileRoute("/_authenticated/dashboard/dossier")({
  head: () => ({ meta: [{ title: "Dossier d'un compte — Wanted Fashion" }, { name: "robots", content: "noindex" }] }),
  component: DossierPage,
});

const KIND: Record<Event["kind"], TKey> = {
  signup_age: "dossier.kSignup",
  terms_accept: "dossier.kTerms",
  cookie_choice: "dossier.kCookies",
  account_deleted: "dossier.kDeleted",
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("fr-BE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Europe/Brussels" });

/**
 * Admin : toutes les preuves d'un compte (journal des preuves, non modifiable, chaîné par empreintes SHA-256).
 * À imprimer / enregistrer en PDF pour un avocat ou une autorité.
 */
function DossierPage() {
  const { t } = useTranslation();
  const { data: isAdmin } = useIsAdmin();
  const [input, setInput] = useState("");
  const [username, setUsername] = useState("");

  const { data: events, isFetching } = useQuery({
    queryKey: ["legal-dossier", username],
    enabled: !!isAdmin && !!username,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("legal_dossier" as never, { p_username: username } as never);
      if (error) throw error;
      return (data ?? []) as Event[];
    },
  });
  const { data: chain } = useQuery({
    queryKey: ["legal-chain", username],
    enabled: !!isAdmin && !!username,
    queryFn: async () => {
      const { data } = await supabase.rpc("verify_legal_chain" as never);
      return ((data as unknown as { total: number; ok: boolean; first_broken: number | null }[] | null) ?? [])[0];
    },
  });

  if (isAdmin === false) return <main className="mx-auto max-w-2xl px-4 py-10 text-center text-foreground/70">{t("brandStats.adminOnly")}</main>;

  function detail(e: Event): string {
    const d = e.data;
    if (e.kind === "signup_age") return `@${d.username ?? "?"} · ${t("dossier.birth")} ${d.birth_date ?? "?"} · ${t("dossier.checked")} ${d.age_checked_at ? fmt(String(d.age_checked_at)) : "?"}`;
    if (e.kind === "terms_accept") return `${t("dossier.version")} ${d.version ?? "?"} (${d.context === "signup" ? t("dossier.atSignup") : t("dossier.atUpdate")})`;
    if (e.kind === "cookie_choice") {
      const m = /s([01])a([01])$/.exec(String(d.choice ?? ""));
      return m ? `${t("cookies.statsTitle")} : ${m[1] === "1" ? t("dossier.yes") : t("dossier.no")} · ${t("cookies.affTitle")} : ${m[2] === "1" ? t("dossier.yes") : t("dossier.no")}` : String(d.choice ?? "");
    }
    return "";
  }

  return (
    <main className="mx-auto max-w-3xl px-4 pb-10 pt-4 md:pt-8">
      <div className="flex items-center gap-3" data-no-print>
        <Link to="/dashboard/moderation" aria-label={t("studio.back")} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface">
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </Link>
        <h1 className="font-display text-3xl font-bold">{t("dossier.title")}</h1>
      </div>
      <p className="mt-2 text-sm text-foreground/70" data-no-print>
        {t("dossier.intro")}
      </p>

      <form
        data-no-print
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setUsername(input.trim().replace(/^@/, ""));
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("dossier.placeholder")}
          aria-label={t("dossier.placeholder")}
          className="h-12 min-w-0 flex-1 rounded-full border-[1.5px] border-border bg-background px-4 text-[15px] outline-none focus:border-foreground/50"
        />
        <button type="submit" className="flex h-12 items-center gap-2 rounded-full bg-ink px-5 font-bold text-surface">
          <Search className="h-4 w-4" aria-hidden="true" /> {t("dossier.search")}
        </button>
      </form>

      {username && (
        <section className="mt-6 rounded-3xl bg-surface p-5 print:bg-white print:p-0">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">
                {t("dossier.accountOf")} @{username}
              </h2>
              <p className="text-xs text-foreground/60">
                {t("dossier.generated")} {fmt(new Date().toISOString())}
              </p>
            </div>
            <button type="button" onClick={() => window.print()} data-no-print className="flex h-11 items-center gap-2 rounded-full bg-ink px-4 text-sm font-bold text-surface">
              <Printer className="h-4 w-4" aria-hidden="true" /> {t("brandReport.pdf")}
            </button>
          </div>

          {chain && (
            <p className={`mt-3 flex items-center gap-2 rounded-2xl px-3 py-2 text-[13px] font-semibold ${chain.ok ? "bg-emerald-600/10 text-emerald-800" : "bg-destructive/10 text-destructive"}`}>
              {chain.ok ? <ShieldCheck className="h-4 w-4" aria-hidden="true" /> : <ShieldX className="h-4 w-4" aria-hidden="true" />}
              {chain.ok ? t("dossier.chainOk").replace("{n}", String(chain.total)) : t("dossier.chainBroken").replace("{id}", String(chain.first_broken))}
            </p>
          )}

          {isFetching ? (
            <Loader2 className="mx-auto mt-6 h-5 w-5 animate-spin" aria-hidden="true" />
          ) : !events || events.length === 0 ? (
            <p className="mt-4 text-sm text-foreground/60">{t("dossier.empty")}</p>
          ) : (
            <ol className="mt-4 space-y-2">
              {events.map((e) => (
                <li key={e.id} className="break-inside-avoid rounded-2xl bg-background p-3 text-[13px] leading-snug print:border print:border-neutral-300">
                  <div className="flex flex-wrap justify-between gap-2">
                    <span className="font-bold">{t(KIND[e.kind])}</span>
                    <span className="tabular-nums text-foreground/65">{fmt(e.at)}</span>
                  </div>
                  {detail(e) && <p className="mt-0.5 text-foreground/80">{detail(e)}</p>}
                  <p className="mt-1 break-all font-mono text-[10px] text-foreground/45">
                    #{e.id} · SHA-256 {e.hash}
                  </p>
                </li>
              ))}
            </ol>
          )}
          <p className="mt-4 text-[11px] leading-relaxed text-foreground/55">{t("dossier.method")}</p>
        </section>
      )}
    </main>
  );
}
