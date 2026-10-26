import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "@/lib/i18n";
import { cleanQuery, fetchCreators, searchOutfits } from "@/lib/public-data";
import { isStyleKey, type StyleKey } from "@/lib/styles";
import { absoluteUrl } from "@/lib/site";
import { OutfitGrid } from "@/components/vitrine/OutfitCard";
import { CreatorGrid } from "@/components/vitrine/CreatorCard";
import { StyleChips } from "@/components/vitrine/StyleChips";
import { EmptyBox } from "@/components/vitrine/EmptyBox";

type Search = { q?: string; style?: StyleKey; vue?: "createurs" };

export const Route = createFileRoute("/explorer")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    q: cleanQuery(s.q) || undefined,
    style: isStyleKey(s.style) ? s.style : undefined,
    vue: s.vue === "createurs" ? "createurs" : undefined,
  }),
  loaderDeps: ({ search }) => ({ q: search.q ?? "", style: search.style ?? null }),
  loader: async ({ deps }) => {
    const [outfits, creators] = await Promise.all([
      searchOutfits(deps.q, deps.style, 48),
      fetchCreators({ q: deps.q, style: deps.style, limit: 30 }),
    ]);
    return { outfits, creators };
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
  const { q, style, vue } = Route.useSearch();
  const { outfits, creators } = Route.useLoaderData();
  const showCreators = vue === "createurs";

  const tabCls = (active: boolean) =>
    `rounded-full px-4 py-2 text-sm font-semibold transition-colors ${active ? "bg-ink text-surface" : "text-foreground/75 hover:text-foreground"}`;

  return (
    <main className="mx-auto max-w-7xl px-4 pt-6 md:px-6 md:pt-10">
      <h1 className="font-display fade-up text-4xl font-bold md:text-5xl">
        {q ? (
          <>
            <span className="text-foreground/60">{t("explore.resultsFor")}</span> « {q} »
          </>
        ) : (
          t("explore.title")
        )}
      </h1>

      <div className="sticky top-[118px] z-30 -mx-4 mt-4 bg-background/90 px-4 py-3 backdrop-blur-md md:top-[72px] md:-mx-6 md:px-6">
        <StyleChips
          value={style ?? null}
          onChange={(s) => navigate({ search: (p) => ({ ...p, style: s ?? undefined }), resetScroll: false, replace: true })}
        />
      </div>

      <div className="mt-3 inline-flex gap-1.5 rounded-full bg-surface p-1" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={!showCreators}
          className={tabCls(!showCreators)}
          onClick={() => navigate({ search: (p) => ({ ...p, vue: undefined }), resetScroll: false, replace: true })}
        >
          {t("explore.outfits")} · {outfits.length}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={showCreators}
          className={tabCls(showCreators)}
          onClick={() => navigate({ search: (p) => ({ ...p, vue: "createurs" }), resetScroll: false, replace: true })}
        >
          {t("explore.creators")} · {creators.length}
        </button>
      </div>

      <div className="mt-6">
        {showCreators ? (
          creators.length ? <CreatorGrid creators={creators} /> : <EmptyBox text={t("explore.noCreators")} />
        ) : outfits.length ? (
          <OutfitGrid outfits={outfits} />
        ) : (
          <EmptyBox text={t("explore.noOutfits")} />
        )}
      </div>
    </main>
  );
}
