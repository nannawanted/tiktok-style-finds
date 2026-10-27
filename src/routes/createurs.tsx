import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { cleanQuery, fetchCreators } from "@/lib/public-data";
import { isStyleKey, type StyleKey } from "@/lib/styles";
import { absoluteUrl } from "@/lib/site";
import { CreatorGrid } from "@/components/vitrine/CreatorCard";
import { StyleChips } from "@/components/vitrine/StyleChips";
import { EmptyBox } from "@/components/vitrine/EmptyBox";

type SearchParams = { q?: string; style?: StyleKey };

export const Route = createFileRoute("/createurs")({
  validateSearch: (s: Record<string, unknown>): SearchParams => ({
    q: cleanQuery(s.q) || undefined,
    style: isStyleKey(s.style) ? s.style : undefined,
  }),
  loaderDeps: ({ search }) => ({ q: search.q ?? "", style: search.style ?? null }),
  loader: ({ deps }) => fetchCreators({ q: deps.q, style: deps.style, limit: 60 }),
  head: () => ({
    meta: [
      { title: "Créateurs mode francophones par style | WantedFashion" },
      { name: "description", content: "Découvre les créateurs mode francophones par style : streetwear, clean girl, old money, Y2K… et retrouve toutes leurs tenues." },
      { property: "og:url", content: absoluteUrl("/createurs") },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/createurs") }],
  }),
  component: CreatorsPage,
});

function CreatorsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate({ from: "/createurs" });
  const { q = "", style } = Route.useSearch();
  const creators = Route.useLoaderData();
  const [text, setText] = useState(q);
  useEffect(() => setText(q), [q]);

  // Recherche « au fil de la frappe », avec un petit délai pour ne pas
  // interroger la base à chaque lettre.
  useEffect(() => {
    const clean = cleanQuery(text);
    if (clean === q) return;
    const id = setTimeout(() => navigate({ search: (p) => ({ ...p, q: clean || undefined }), resetScroll: false, replace: true }), 300);
    return () => clearTimeout(id);
  }, [text, q, navigate]);

  return (
    <main className="mx-auto max-w-7xl px-4 pt-6 md:px-6 md:pt-10">
      <div className="fade-up max-w-2xl">
        <h1 className="font-display text-4xl font-bold md:text-5xl">{t("creatorsPage.title")}</h1>
        <p className="mt-3 text-[17px] text-foreground/75">{t("creatorsPage.subtitle")}</p>
      </div>

      <label className="mt-6 flex h-12 max-w-xl items-center gap-2.5 rounded-full border border-border bg-surface px-4 focus-within:border-foreground/50">
        <Search className="h-5 w-5 shrink-0 text-secondary" aria-hidden="true" />
        <span className="sr-only">{t("creatorsPage.searchPlaceholder")}</span>
        <input
          type="search"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("creatorsPage.searchPlaceholder")}
          maxLength={60}
          className="w-full min-w-0 bg-transparent text-[15px] outline-none placeholder:text-foreground/50"
        />
      </label>

      <div className="sticky top-[var(--sticky-top,118px)] z-30 -mx-4 mt-3 bg-background/90 px-4 py-2.5 backdrop-blur-md transition-[top] duration-300 md:-mx-6 md:px-6">
        <StyleChips
          value={style ?? null}
          onChange={(s) => navigate({ search: (p) => ({ ...p, style: s ?? undefined }), resetScroll: false, replace: true })}
        />
      </div>

      <div className="mt-6">{creators.length ? <CreatorGrid creators={creators} /> : <EmptyBox text={t("creatorsPage.empty")} />}</div>
    </main>
  );
}
