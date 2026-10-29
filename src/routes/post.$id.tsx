import { useEffect } from "react";
import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight, Camera, Info } from "lucide-react";
import { ReportButton } from "@/components/vitrine/ReportButton";
import { VideoSourceIcon, videoPlatform } from "@/components/vitrine/VideoSourceIcon";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/lib/i18n";
import { fetchMoreLikeThis, fetchOutfit } from "@/lib/public-data";
import { styleLabelKey } from "@/lib/styles";
import { absoluteUrl, clip, DEFAULT_OG_IMAGE, outfitPath, profilePath, SITE_NAME } from "@/lib/site";
import { ShareButton } from "@/components/ShareButton";
import { Avatar } from "@/components/vitrine/OutfitCard";
import { SaveButton } from "@/components/vitrine/SaveButton";
import { FollowButton } from "@/components/vitrine/FollowButton";
import { MadeWithBanner } from "@/components/vitrine/MadeWith";
import { DoubleTapLike } from "@/components/vitrine/DoubleTapLike";
import { InfiniteOutfitFeed } from "@/components/vitrine/InfiniteOutfitFeed";
import { AddToCollectionButton } from "@/components/vitrine/AddToCollectionButton";

export const Route = createFileRoute("/post/$id")({
  loader: async ({ params }) => {
    const data = await fetchOutfit(params.id);
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) return { meta: [{ title: `Tenue | ${SITE_NAME}` }, { name: "robots", content: "noindex" }] };
    const { post, products } = loaderData;
    const brands = [...new Set(products.map((p) => p.brand).filter(Boolean))].slice(0, 4).join(", ");
    const pieceNames = products.slice(0, 4).map((p) => p.name).join(", ");
    const title = `${post.title}, par @${post.creator_username} | ${SITE_NAME}`;
    const description = clip(
      `Les ${products.length} pièce${products.length > 1 ? "s" : ""} de la tenue « ${post.title} » de @${post.creator_username}` +
        (pieceNames ? ` : ${pieceNames}` : "") +
        (brands ? ` (${brands})` : "") +
        ", avec le lien de chaque vêtement.",
    );
    const url = absoluteUrl(outfitPath(params.id));
    const image = post.cover_image ?? DEFAULT_OG_IMAGE;
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      name: post.title,
      url,
      image,
      dateCreated: post.created_at ?? undefined,
      author: { "@type": "Person", name: `@${post.creator_username}`, url: absoluteUrl(profilePath(post.creator_username)) },
      hasPart: products.map((p) => ({ "@type": "Product", name: p.name, ...(p.brand ? { brand: { "@type": "Brand", name: p.brand } } : {}), ...(p.image_url ? { image: p.image_url } : {}) })),
    };
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:title", content: `${post.title}, par @${post.creator_username}` },
        { property: "og:description", content: description },
        { property: "og:url", content: url },
        { property: "og:image", content: image },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:image", content: image },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [{ type: "application/ld+json", children: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }],
    };
  },
  component: OutfitPage,
  notFoundComponent: NotFoundOutfit,
});

function NotFoundOutfit() {
  const { t } = useTranslation();
  return (
    <main className="mx-auto flex max-w-md flex-col items-center gap-5 px-4 py-24 text-center">
      <p className="text-lg text-foreground/75">{t("outfit.notFound")}</p>
      <Link to="/" className="rounded-full bg-ink px-6 py-3 font-bold text-surface">
        {t("root.backHome")}
      </Link>
    </main>
  );
}

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function OutfitPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = Route.useParams();
  const { post, products, creator } = Route.useLoaderData();

  // Compteur de vues (une seule fois par navigateur et par tenue)
  useEffect(() => {
    const key = `wf_viewed:${id}`;
    try {
      if (localStorage.getItem(key)) return;
    } catch {
      return;
    }
    supabase.rpc("increment_post_views", { p_id: id }).then(({ error }) => {
      if (!error) {
        try {
          localStorage.setItem(key, "1");
        } catch {
          /* navigation privée : on ignore */
        }
      }
    });
  }, [id]);


  const pageUrl = absoluteUrl(outfitPath(id));


  return (
    <main className="mx-auto max-w-6xl overflow-x-clip px-4 pt-4 md:px-6 md:pt-8">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => (window.history.length > 1 ? router.history.back() : router.navigate({ to: "/" }))}
          className="inline-flex h-11 items-center gap-1.5 rounded-full bg-surface px-4 text-sm font-semibold hover:bg-card"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> {t("outfit.back")}
        </button>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-8 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:gap-12">
        <div className="fade-up md:sticky md:top-24 md:self-start">
          <DoubleTapLike postId={id} className="overflow-hidden rounded-[28px] bg-secondary shadow-xl">
            {post.cover_image ? (
              <img src={post.cover_image} alt={post.title} referrerPolicy="no-referrer" draggable={false} className="max-h-[78vh] w-full object-cover" />
            ) : (
              <div className="aspect-[9/14] w-full" />
            )}
            {post.tiktok_url ? (
              // Toute la photo mène à la vidéo d'origine
              <a
                href={post.tiktok_url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                aria-label={videoPlatform(post.tiktok_url) === "tiktok" ? t("outfit.watchOnTiktok") : videoPlatform(post.tiktok_url) === "instagram" ? t("outfit.watchOnInstagram") : t("outfit.watchOn")}
                className="group absolute inset-0 z-10"
              >
                <span className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full bg-ink/90 py-2 pl-2 pr-4 text-sm font-bold text-surface">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface/90 transition-transform group-hover:scale-110">
                    <VideoSourceIcon url={post.tiktok_url} className="h-4 w-4 text-foreground" />
                  </span>
                  {videoPlatform(post.tiktok_url) === "tiktok" ? t("outfit.watchOnTiktok") : videoPlatform(post.tiktok_url) === "instagram" ? t("outfit.watchOnInstagram") : t("outfit.watchOn")}
                </span>
              </a>
            ) : (
              <span className="pointer-events-none absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full bg-ink/90 py-2 pl-2 pr-4 text-sm font-bold text-surface">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface/90">
                  <Camera className="h-4 w-4 text-foreground" aria-hidden="true" />
                </span>
                {t("card.photo")}
              </span>
            )}
          </DoubleTapLike>
        </div>

        <div className="fade-up" style={{ animationDelay: "120ms" }}>
          <h1 className="font-display text-3xl font-bold leading-tight md:text-[44px]">{post.title}</h1>

          <div className="mt-4 flex items-center gap-3">
            <Link to="/@{$username}" params={{ username: post.creator_username }} className="flex min-w-0 flex-1 items-center gap-3">
              <span className="rounded-full p-[2px] ring-2 ring-primary">
                <Avatar src={creator?.profile_image ?? null} name={post.creator_username} className="h-10 w-10" />
              </span>
              <span className="truncate font-bold hover:text-primary">@{post.creator_username}</span>
            </Link>
            {creator && <FollowButton creatorId={creator.id} tone="brand" />}
          </div>

          {post.styles.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2">
              {post.styles.map((s) => (
                <li key={s}>
                  <Link to="/" search={{ style: s }} hash="tenues" className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-foreground/80 hover:border-foreground/50">
                    {t(styleLabelKey(s))}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {post.tags.length > 0 && (
            <p className="mt-3 flex flex-wrap gap-x-2.5 gap-y-1 text-sm font-semibold">
              {post.tags.map((tag) => (
                <Link key={tag} to="/explorer" search={{ q: `#${tag}` }} className="text-primary hover:underline">
                  #{tag}
                </Link>
              ))}
            </p>
          )}

          <h2 className="mt-8 text-lg font-bold">{t("outfit.pieces")}</h2>
          <div className="mt-3 flex flex-col gap-2.5">
            {products.length === 0 && <p className="text-foreground/70">{t("outfit.noPieces")}</p>}
            {products.map((p, i) => (
              <a
                key={p.id}
                href={`/go/${p.id}`}
                target="_blank"
                rel="noopener noreferrer nofollow sponsored"
                className="fade-up group flex items-center gap-3.5 rounded-2xl bg-surface p-2.5 pr-3 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)]"
                style={{ animationDelay: `${200 + i * 60}ms` }}
              >
                <span className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl bg-card">
                  {p.image_url && <img src={p.image_url} alt={p.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  {p.brand && <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">{p.brand}</span>}
                  <span className="truncate font-semibold">{p.name}</span>
                  <span className="text-sm">
                    {p.price && <span className="font-bold text-primary">{p.price}</span>}
                    {hostOf(p.affiliate_link) && <span className="text-foreground/55"> · {hostOf(p.affiliate_link)}</span>}
                  </span>
                </span>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-surface transition-colors group-hover:bg-primary">
                  <ArrowUpRight className="h-4 w-4" aria-label={t("outfit.view")} />
                </span>
              </a>
            ))}
          </div>

          {products.length > 0 && (
            <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-foreground/50">
              <span className="inline-flex items-center gap-1">
                <Info className="h-3 w-3" aria-hidden="true" /> {t("outfit.disclosure")}
              </span>
              <ReportButton postId={id} />
            </p>
          )}

          <div className="mt-6 flex gap-2">
            <SaveButton postId={id} variant="wide" />
            <AddToCollectionButton postId={id} />
            <ShareButton
              title={post.title}
              text={`@${post.creator_username} sur WantedFashion`}
              url={pageUrl}
              image={post.cover_image}
              label={t("outfit.share")}
              className="flex h-12 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full bg-ink px-3 text-[15px] font-semibold sm:gap-2 sm:text-base text-surface transition-colors hover:bg-ink/85"
              iconClassName="h-5 w-5"
            />
          </div>
          {products.length === 0 && (
            <p className="mt-3 text-xs text-foreground/65">
              <ReportButton postId={id} />
            </p>
          )}
        </div>
      </div>

      <MadeWithBanner className="mt-10" />

      <section className="mt-14">
        <h2 className="font-display mb-5 text-3xl font-bold">{t("engage.moreLikeThis")}</h2>
        <InfiniteOutfitFeed
          key={id}
          queryKey={["more-like-this", id]}
          fetchPage={(page) => fetchMoreLikeThis(id, post.styles, page)}
          excludeIds={[id]}
        />
      </section>

    </main>
  );
}
