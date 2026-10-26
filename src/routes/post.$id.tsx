import { useEffect } from "react";
import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowUpRight, Flag, Link2, Play } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/lib/i18n";
import { fetchOutfit, fetchSimilarOutfits } from "@/lib/public-data";
import { styleLabelKey } from "@/lib/styles";
import { absoluteUrl, clip, DEFAULT_OG_IMAGE, outfitPath, profilePath, SITE_NAME } from "@/lib/site";
import { ShareButton } from "@/components/ShareButton";
import { Avatar, OutfitGrid } from "@/components/vitrine/OutfitCard";
import { SaveButton } from "@/components/vitrine/SaveButton";
import { FollowButton } from "@/components/vitrine/FollowButton";
import { MadeWithBanner } from "@/components/vitrine/MadeWith";

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

  const similar = useQuery({
    queryKey: ["similar", id],
    queryFn: () => fetchSimilarOutfits(id, post.styles, 8),
  });

  const pageUrl = absoluteUrl(outfitPath(id));

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(pageUrl);
      toast.success(t("outfit.linkCopied"));
    } catch {
      toast.error(t("card.actionError"));
    }
  }

  const reportHref = `mailto:nannawanted@gmail.com?subject=${encodeURIComponent(`${t("outfit.reportSubject")} ${id}`)}&body=${encodeURIComponent(`${t("outfit.reportBody")}\n\n${pageUrl}`)}`;

  return (
    <main className="mx-auto max-w-6xl px-4 pt-4 md:px-6 md:pt-8">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => (window.history.length > 1 ? router.history.back() : router.navigate({ to: "/" }))}
          className="inline-flex h-11 items-center gap-1.5 rounded-full bg-surface px-4 text-sm font-semibold hover:bg-card"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> {t("outfit.back")}
        </button>
        <ShareButton
          title={post.title}
          text={`@${post.creator_username} sur WantedFashion`}
          url={pageUrl}
          image={post.cover_image}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-surface hover:bg-card"
          iconClassName="h-5 w-5"
        />
      </div>

      <div className="grid gap-8 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:gap-12">
        <div className="fade-up md:sticky md:top-24 md:self-start">
          <div className="relative overflow-hidden rounded-[28px] bg-secondary shadow-xl">
            {post.cover_image ? (
              <img src={post.cover_image} alt={post.title} referrerPolicy="no-referrer" className="max-h-[78vh] w-full object-cover" />
            ) : (
              <div className="aspect-[9/14] w-full" />
            )}
            {post.tiktok_url && (
              <a
                href={post.tiktok_url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="group absolute inset-0 flex items-center justify-center"
                aria-label={t("outfit.watchOn")}
              >
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-surface/90 shadow-lg transition-transform group-hover:scale-110">
                  <Play className="ml-1 h-7 w-7 fill-current text-foreground" aria-hidden="true" />
                </span>
                <span className="absolute bottom-4 left-4 rounded-full bg-ink/90 px-3.5 py-2 text-sm font-bold text-surface">
                  {t("outfit.watchOn")}
                </span>
              </a>
            )}
          </div>
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
            <p className="mt-3 text-xs leading-relaxed text-foreground/65">
              {t("outfit.disclosure")}{" "}
              <a href={reportHref} className="inline-flex items-center gap-1 underline hover:text-primary">
                <Flag className="h-3 w-3" aria-hidden="true" /> {t("outfit.report")}
              </a>
            </p>
          )}

          <div className="mt-6 flex gap-2.5">
            <SaveButton postId={id} variant="wide" />
            <button
              type="button"
              onClick={copyLink}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-ink font-semibold text-surface transition-colors hover:bg-ink/85"
            >
              <Link2 className="h-5 w-5" aria-hidden="true" /> {t("outfit.copyLink")}
            </button>
          </div>
          {products.length === 0 && (
            <p className="mt-3 text-xs text-foreground/65">
              <a href={reportHref} className="underline hover:text-primary">
                {t("outfit.report")}
              </a>
            </p>
          )}
        </div>
      </div>

      {similar.data && similar.data.length > 0 && (
        <section className="mt-14">
          <h2 className="font-display mb-5 text-3xl font-bold">{t("outfit.similar")}</h2>
          <OutfitGrid outfits={similar.data} />
        </section>
      )}

      <div className="mt-10">
        <MadeWithBanner />
      </div>
    </main>
  );
}
