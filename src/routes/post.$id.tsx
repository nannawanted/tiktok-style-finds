import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/post/$id")({
  ssr: false,
  head: ({ params }) => ({
    meta: [
      { title: `Outfit — Wanted Fashion` },
      { name: "description", content: `Shop tous les produits de cet outfit sur Wanted Fashion.` },
      { property: "og:url", content: `/post/${params.id}` },
    ],
    links: [{ rel: "canonical", href: `/post/${params.id}` }],
  }),
  component: PostPage,
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl p-10 text-center text-muted-foreground">Post introuvable.</div>
  ),
});

function PostPage() {
  const { id } = Route.useParams();

  const { data, isLoading, error } = useQuery({
    queryKey: ["post", id],
    queryFn: async () => {
      const { data: post, error: e1 } = await supabase
        .from("posts")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (e1) throw e1;
      if (!post) throw notFound();

      const { data: products, error: e2 } = await supabase
        .from("products")
        .select("*")
        .eq("post_id", id)
        .order("position", { ascending: true });
      if (e2) throw e2;
      return { post, products: products ?? [] };
    },
  });

  // Load TikTok embed script when post has a tiktok_url
  useEffect(() => {
    if (!data?.post.tiktok_url) return;
    const existing = document.querySelector('script[src="https://www.tiktok.com/embed.js"]');
    if (existing) {
      // re-trigger embed parsing
      (window as unknown as { tiktokEmbedLoad?: () => void }).tiktokEmbedLoad?.();
      return;
    }
    const s = document.createElement("script");
    s.src = "https://www.tiktok.com/embed.js";
    s.async = true;
    document.body.appendChild(s);
  }, [data?.post.tiktok_url]);

  if (isLoading) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-6">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="mt-2 h-4 w-24" />
        <Skeleton className="mt-6 aspect-[9/16] w-full max-w-sm rounded-xl" />
      </main>
    );
  }

  if (error || !data) return null;
  const { post, products } = data;

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-4">
        <h1 className="text-2xl font-black sm:text-3xl">{post.title}</h1>
        <Link
          to="/creator/$username"
          params={{ username: post.creator_username }}
          className="text-sm text-muted-foreground hover:text-brand"
        >
          @{post.creator_username}
        </Link>
      </div>

      {post.tiktok_url && (
        <div className="mb-8 flex justify-center">
          <TikTokEmbed url={post.tiktok_url} />
        </div>
      )}

      <h2 className="mb-3 text-lg font-bold">Les produits</h2>
      {products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
          Aucun produit ajouté.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {products.map((p) => (
            <article key={p.id} className="overflow-hidden rounded-xl border border-border bg-card shadow-card transition hover:shadow-card-hover">
              <div className="aspect-square w-full overflow-hidden bg-muted">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">Pas d'image</div>
                )}
              </div>
              <div className="space-y-1 p-3">
                {p.brand && <p className="text-xs uppercase tracking-wide text-muted-foreground">{p.brand}</p>}
                <h3 className="line-clamp-2 text-sm font-semibold">{p.name}</h3>
                {p.price && <p className="font-bold">{p.price}</p>}
                <a
                  href={p.affiliate_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 block w-full rounded-md bg-brand py-2 text-center text-xs font-semibold text-brand-foreground transition hover:bg-brand/90"
                >
                  Voir le produit →
                </a>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}

function TikTokEmbed({ url }: { url: string }) {
  // Extract video id from URL like https://www.tiktok.com/@user/video/1234567890
  const m = url.match(/\/video\/(\d+)/);
  const videoId = m?.[1];
  if (!videoId) {
    return (
      <Button asChild variant="outline">
        <a href={url} target="_blank" rel="noopener noreferrer">Voir la vidéo TikTok</a>
      </Button>
    );
  }
  return (
    <blockquote
      className="tiktok-embed"
      cite={url}
      data-video-id={videoId}
      style={{ maxWidth: 605, minWidth: 280 }}
    >
      <section>
        <a href={url} target="_blank" rel="noopener noreferrer">Voir la vidéo TikTok</a>
      </section>
    </blockquote>
  );
}
