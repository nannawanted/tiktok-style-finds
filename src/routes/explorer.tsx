import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "@/lib/i18n";
import { cleanQuery, fetchFeedPage, logSearchClick, searchOutfits, type FeedKind, type OutfitCard } from "@/lib/public-data";
import { isStyleKey, type StyleKey } from "@/lib/styles";
import { absoluteUrl } from "@/lib/site";
import { OutfitGrid } from "@/components/vitrine/OutfitCard";
import { StyleChips } from "@/components/vitrine/StyleChips";
import { EmptyBox } from "@/components/vitrine/EmptyBox";
import { FeedSection } from "@/components/vitrine/FeedSection";
import { refineSuggestions } from "@/lib/visual-concepts";
import { Plus } from "lucide-react";

type Search = { q?: string; style?: StyleKey; tab?: FeedKind };

export const Route = createFileRoute("/explorer")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    q: cleanQuery(s.q) || undefined,
    style: isStyleKey(s.style) ? s.style : undefined,
    tab: s.tab === "latest" || s.tab === "following" || s.tab === "trending" || s.tab === "foryou" ? s.tab : undefined,
  }),
  loaderDeps: ({ search }) => ({ q: search.q ?? "", style: search.style ?? null }),
  loader: async ({ deps }) => {
    // Avec une recherche : les tenues qui correspondent. Sans : première page « Tendances ».
    if (deps.q) return { results: await searchOutfits(deps.q, deps.style, 60), firstPage: [] as OutfitCard[] };
    return { results: null, firstPage: await fetchFeedPage({ kind: "trending", style: deps.style, page: 0 }) };
  },
  head: ({ match }) => {
    const q = (match.search as Search).q;
    return {
      meta: [
        { title: q ? `${q} — Tenues et créateurs | WantedFashion` : "Explorer les tenues | WantedFashion" },
        { name: "description", content: "Cherche une tenue, une pièce, une marque ou un créateur mode sur WantedFashion." },
        // Les pages de recherche ne doivent pas encombrer Google
        ...(q ? [{ name: "robots", content: "noindex, follow" }] : []),
      ],
      links: [{ rel: "canonical", href: absoluteUrl("/explorer") }],
    };
  },
  component: Explorer,
});

function Explorer() {
  const { t } = useTranslation();
  const navigate = useNavigate({ from: "/explorer" });
  const { q, style, tab } = Route.useSearch();
  const { results, firstPage } = Route.useLoaderData();
  const refine = q ? refineSuggestions(q, 10) : [];
  const update = (next: Partial<Search>) => navigate({ search: (p) => ({ ...p, ...next }), resetScroll: false, replace: true });

  if (!q || !results) {
    return (
      <main className="pt-6 md:pt-10">
        <FeedSection scope="explore" titleAs="h1" title={t("explore.title")} tab={tab} style={style} firstPage={firstPage} onChange={update} />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 pt-6 md:px-6 md:pt-10">
      <h1 className="font-display fade-up text-4xl font-bold md:text-5xl">
        <span className="text-foreground/60">{t("explore.resultsFor")}</span> « {q} »
      </h1>
      {/* Affiner, comme Pinterest : des mots à ajouter pour préciser la recherche */}
      {refine.length > 0 && (
        <div className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 md:-mx-6 md:px-6" role="group" aria-label={t("explore.refine")}>
          {refine.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => update({ q: `${q} ${w}` })}
              className="inline-flex shrink-0 items-center gap-1 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-surface transition-transform active:scale-95"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" /> {w}
            </button>
          ))}
        </div>
      )}
      <div className="sticky top-[118px] z-30 -mx-4 mt-3 bg-background/90 px-4 py-3 backdrop-blur-md md:top-[72px] md:-mx-6 md:px-6">
        <StyleChips value={style ?? null} onChange={(s) => update({ style: s ?? undefined })} />
      </div>
      <div
        className="mt-6"
        // La recherche apprend des clics : on note quelle tenue est ouverte après cette recherche
        onClickCapture={(e) => {
          const a = (e.target as HTMLElement).closest("a[href^='/post/']");
          const id = a?.getAttribute("href")?.split("/")[2];
          if (id && q) logSearchClick(q, id);
        }}
      >
        {results.length ? <OutfitGrid outfits={results} /> : <EmptyBox text={t("explore.noOutfits")} />}
      </div>
    </main>
  );
}
