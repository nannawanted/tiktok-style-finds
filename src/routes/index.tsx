import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Play } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { useFollowedIds } from "@/lib/social";
import { fetchCreators, fetchOutfits, type OutfitCard } from "@/lib/public-data";
import { isStyleKey, type StyleKey } from "@/lib/styles";
import { DEFAULT_OG_IMAGE, SITE_URL } from "@/lib/site";
import { OutfitGrid, OutfitGridSkeleton } from "@/components/vitrine/OutfitCard";
import { CreatorRow } from "@/components/vitrine/CreatorCard";
import { StyleChips } from "@/components/vitrine/StyleChips";
import { EmptyBox } from "@/components/vitrine/EmptyBox";

type Tab = "trending" | "latest" | "following";
type Search = { style?: StyleKey; tab?: Tab };

export const Route = createFileRoute("/")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    style: isStyleKey(s.style) ? s.style : undefined,
    tab: s.tab === "latest" || s.tab === "following" ? s.tab : undefined,
  }),
  loaderDeps: ({ search }) => ({ style: search.style ?? null, tab: search.tab ?? "trending" }),
  loader: async ({ deps }) => {
    const isDefaultTrending = deps.tab === "trending" && !deps.style;
    const [outfits, creators, weekTop] = await Promise.all([
      deps.tab === "following" ? Promise.resolve([] as OutfitCard[]) : fetchOutfits({ style: deps.style, sort: deps.tab === "latest" ? "latest" : "trending", limit: 30 }),
      fetchCreators({ style: deps.style, limit: 10 }),
      // Le carrousel du haut montre toujours les tenues les plus aimées de la semaine
      isDefaultTrending ? Promise.resolve(null) : fetchOutfits({ sort: "trending", limit: 6 }),
    ]);
    return { outfits, creators, hero: weekTop ?? outfits.slice(0, 6) };
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
  const { style, tab = "trending" } = Route.useSearch();
  const { outfits, creators, hero } = Route.useLoaderData();
  const { data: followedIds } = useFollowedIds();

  const followingFeed = useQuery({
    queryKey: ["following-feed", user?.id, style ?? null, [...(followedIds ?? [])].join(",")],
    enabled: tab === "following" && !!user && !!followedIds,
    queryFn: () => fetchOutfits({ style, sort: "latest", limit: 40, creatorIds: [...(followedIds ?? [])] }),
  });

  const setSearch = (next: Partial<Search>) =>
    navigate({ search: (prev) => ({ ...prev, ...next }), resetScroll: false, replace: true });

  const tabs: { key: Tab; label: string }[] = [
    { key: "trending", label: t("home2.trending") },
    { key: "latest", label: t("home2.latest") },
    { key: "following", label: t("home2.following") },
  ];

  const shown = tab === "following" ? (followingFeed.data ?? []) : outfits;

  return (
    <main>
      <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-6 pt-8 md:grid-cols-2 md:px-6 md:pb-10 md:pt-14">
        <div className="fade-up">
          <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-primary">{t("home2.eyebrow")}</p>
          <h1 className="font-display mt-3 text-[40px] font-bold leading-[1.02] text-foreground sm:text-6xl">{t("home2.title")}</h1>
          <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-foreground/75">{t("home2.subtitle")}</p>
        </div>
        <HeroCollage outfits={hero} />
      </section>

      <section id="tenues" className="mx-auto max-w-7xl scroll-mt-28 px-4 md:px-6">
        <div className="sticky top-[118px] z-30 -mx-4 bg-background/90 px-4 py-3 backdrop-blur-md md:top-[72px] md:-mx-6 md:px-6">
          <StyleChips value={style ?? null} onChange={(s) => setSearch({ style: s ?? undefined })} />
        </div>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-3xl font-bold">{t("home2.outfitsTitle")}</h2>
          <div className="flex gap-1.5 rounded-full bg-surface p-1" role="tablist">
            {tabs.map((tb) => (
              <button
                key={tb.key}
                type="button"
                role="tab"
                aria-selected={tab === tb.key}
                onClick={() => setSearch({ tab: tb.key === "trending" ? undefined : tb.key })}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  tab === tb.key ? "bg-ink text-surface" : "text-foreground/75 hover:text-foreground"
                }`}
              >
                {tb.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          {tab === "following" && !user ? (
            <EmptyBox text={t("home2.loginToFollow")} action={{ to: "/login", label: t("nav2.login") }} />
          ) : tab === "following" && followingFeed.isLoading ? (
            <OutfitGridSkeleton />
          ) : shown.length === 0 ? (
            <EmptyBox text={tab === "following" ? t("home2.followingEmpty") : style ? t("home2.noResult") : t("home2.empty")} />
          ) : (
            <OutfitGrid outfits={shown} />
          )}
        </div>
      </section>

      {creators.length > 0 && (
        <section className="mx-auto mt-14 max-w-7xl px-4 md:px-6">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-display text-3xl font-bold">{t("home2.creatorsTitle")}</h2>
            <Link
              to="/createurs"
              search={{ style }}
              className="group inline-flex items-center gap-1 text-sm font-bold text-primary"
            >
              {t("home2.seeAllCreators")} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          <CreatorRow creators={creators} />
        </section>
      )}

      <section className="mt-16 bg-secondary text-secondary-foreground">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-6 px-4 py-14 md:flex-row md:items-center md:justify-between md:px-6">
          <div className="max-w-xl">
            <h2 className="font-display text-4xl font-bold leading-tight">{t("home2.ctaTitle")}</h2>
            <p className="mt-3 text-[17px] leading-relaxed opacity-90">{t("home2.ctaText")}</p>
          </div>
          <Link
            to="/signup"
            className="rounded-full bg-surface px-7 py-4 text-[17px] font-bold text-foreground shadow-lg transition-transform hover:-translate-y-1"
          >
            {t("home2.ctaButton")}
          </Link>
        </div>
      </section>
    </main>
  );
}
