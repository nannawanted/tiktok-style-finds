import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Play } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { useCreatorSuggestions } from "@/lib/social";
import { fetchCreators, fetchFeedPage, fetchOutfits, type FeedKind, type OutfitCard } from "@/lib/public-data";
import { isStyleKey, type StyleKey } from "@/lib/styles";
import { DEFAULT_OG_IMAGE, SITE_URL } from "@/lib/site";
import { CreatorRow } from "@/components/vitrine/CreatorCard";
import { FeedSection } from "@/components/vitrine/FeedSection";

type Tab = FeedKind;
type Search = { style?: StyleKey; tab?: Tab };

export const Route = createFileRoute("/")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    style: isStyleKey(s.style) ? s.style : undefined,
    tab: s.tab === "latest" || s.tab === "following" || s.tab === "friends" || s.tab === "trending" || s.tab === "foryou" ? s.tab : undefined,
  }),
  loaderDeps: ({ search }) => ({ style: search.style ?? null }),
  loader: async ({ deps }) => {
    // Première page « Tendances » fabriquée côté serveur (Google + affichage immédiat)
    const [firstPage, creators, weekTop] = await Promise.all([
      fetchFeedPage({ kind: "trending", style: deps.style, page: 0 }),
      fetchCreators({ style: deps.style, limit: 12 }),
      // Le carrousel du haut montre toujours les tenues les plus aimées de la semaine
      deps.style ? fetchOutfits({ sort: "trending", limit: 6 }) : Promise.resolve(null),
    ]);
    return { firstPage, creators, hero: weekTop ?? firstPage.slice(0, 6) };
  },
  head: () => ({
    meta: [
      { title: "WantedFashion — Le look de tes créateurs, pièce par pièce" },
      { name: "description", content: "Retrouve chaque tenue de tes créateurs TikTok et Instagram préférés, avec le lien de chaque vêtement. Streetwear, clean girl, old money…" },
      { property: "og:url", content: SITE_URL },
      { property: "og:image", content: DEFAULT_OG_IMAGE },
    ],
    links: [{ rel: "canonical", href: SITE_URL }],
  }),
  component: Home,
});

/** Les 3 tenues les plus aimées de la semaine (classement « Tendances »), cliquables. */
function HeroCollage({ outfits }: { outfits: OutfitCard[] }) {
  const { t } = useTranslation();
  const covers = outfits.filter((o) => o.cover_image).slice(0, 3);
  // La plus aimée au centre, les deux suivantes de chaque côté
  const slots = [covers[1] ?? null, covers[0] ?? null, covers[2] ?? null];
  const tones = ["#BFA587", "#6B5240", "#CDB496"];
  return (
    <div className="relative mx-auto flex h-[300px] w-full max-w-md items-end justify-center gap-3 sm:h-[360px]">
      {slots.map((o, i) => {
        const mid = i === 1;
        const cls = `fade-up group relative block overflow-hidden rounded-[22px] shadow-xl transition-transform duration-500 hover:-translate-y-2 ${
          mid ? "z-10 h-[280px] w-[44%] sm:h-[340px]" : `h-[220px] w-[30%] sm:h-[260px] ${i === 0 ? "-rotate-6 hover:-rotate-3" : "rotate-6 hover:rotate-3"}`
        }`;
        const style = { animationDelay: `${150 + i * 120}ms`, background: tones[i] };
        const inner = (
          <>
            {o?.cover_image && (
              <img src={o.cover_image} alt={o.title} referrerPolicy="no-referrer" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
            )}
            {mid && o && (
              <>
                <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-ink/85 px-2.5 py-1 text-[11px] font-semibold text-surface">
                  <Play className="h-3 w-3 fill-current" aria-hidden="true" /> {t("card.video")}
                </span>
                <span className="absolute inset-x-3 bottom-3 rounded-xl bg-surface/95 px-3 py-2 text-left">
                  <span className="block truncate text-xs font-bold text-foreground">{o.title}</span>
                  <span className="block truncate text-[11px] text-foreground/65">@{o.creator_username}</span>
                </span>
              </>
            )}
          </>
        );
        return o ? (
          <Link key={o.id} to="/post/$id" params={{ id: o.id }} className={cls} style={style} aria-label={o.title}>
            {inner}
          </Link>
        ) : (
          <div key={`empty-${i}`} className={cls} style={style} aria-hidden="true" />
        );
      })}
    </div>
  );
}

function Home() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate({ from: "/" });
  const { style, tab } = Route.useSearch();
  const { firstPage, creators, hero } = Route.useLoaderData();
  const suggestions = useCreatorSuggestions(creators);

  return (
    <main>
      <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-6 pt-8 md:grid-cols-2 md:px-6 md:pb-10 md:pt-14">
        <div className="fade-up">
          <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-primary">{t("home2.eyebrow")}</p>
          <h1 className="font-display mt-3 text-[40px] font-bold leading-[1.02] text-foreground sm:text-6xl">{t("home2.title")}</h1>
          <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-foreground/75">{t("home2.subtitle")}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href="#tenues"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-ink px-6 font-bold text-surface shadow-lg transition-transform hover:-translate-y-0.5"
            >
              {t("hero.ctaExplore")} <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>
        <HeroCollage outfits={hero} />
      </section>

      {suggestions.creators.length > 0 && (
        <section className="mx-auto mb-10 max-w-7xl px-4 md:px-6">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-display text-3xl font-bold">{suggestions.personal ? t("social.suggestions") : t("home2.creatorsTitle")}</h2>
            <Link to="/createurs" search={{ style }} className="group inline-flex items-center gap-1 text-sm font-bold text-primary">
              {t("home2.seeAllCreators")} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          <CreatorRow creators={suggestions.creators} />
        </section>
      )}

      {!user && (
        <section className="mx-auto mb-12 max-w-7xl px-4 md:px-6">
          <div className="fade-up flex flex-col items-start gap-6 rounded-[28px] bg-secondary p-7 text-secondary-foreground md:flex-row md:items-center md:justify-between md:p-10">
            <div className="max-w-xl">
              <h2 className="font-display text-3xl font-bold leading-tight md:text-4xl">{t("home2.ctaTitle")}</h2>
            </div>
            <Link to="/signup" className="shrink-0 rounded-full bg-surface px-7 py-4 text-[16px] font-bold text-foreground shadow-lg transition-transform hover:-translate-y-1">
              {t("home2.ctaButton")}
            </Link>
          </div>
        </section>
      )}

      <FeedSection
        scope="home"
        title={t("home2.outfitsTitle")}
        tab={tab}
        style={style}
        firstPage={firstPage}
        onChange={(next) => navigate({ search: (prev) => ({ ...prev, ...next }), resetScroll: false, replace: true })}
      />
    </main>
  );
}
