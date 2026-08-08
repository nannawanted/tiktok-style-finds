import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Wanted Fashion — Feed" },
      { name: "description", content: "Découvre les outfits shoppables des créateurs francophones." },
      { property: "og:title", content: "Wanted Fashion" },
      { property: "og:description", content: "Découvre les outfits shoppables." },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Feed,
});

function Feed() {
  const { data, isLoading } = useQuery({
    queryKey: ["feed"],
    queryFn: async () => {
      const { data: posts, error } = await supabase
        .from("posts")
        .select("id, title, cover_image, creator_username, created_at, products(id)")
        .order("created_at", { ascending: false })
        .limit(60);
      if (error) throw error;
      return posts ?? [];
    },
  });

  return (
    <main>
      {/* HERO SECTION */}
      <section
        style={{ background: "linear-gradient(135deg, #6b5240 0%, #8b6b52 50%, #a67c5b 100%)" }}
        className="px-4 py-16 text-center"
      >
        <h1 className="mb-3 text-3xl font-black tracking-tight text-white sm:text-4xl md:text-5xl">
          Trouve les pièces de tes créateurs
        </h1>
        <p className="mb-8 text-base text-white/70">
          Vidéo → références → achat en 1 clic
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <a
            href="#feed"
            style={{ backgroundColor: "#c0392b" }}
            className="rounded-full px-7 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Explorer les looks
          </a>
          <Link
            to="/signup"
            className="rounded-full border border-white/60 px-7 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Devenir créateur
          </Link>
        </div>
      </section>

      {/* FEED */}
      <div id="feed" className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-black sm:text-2xl">Les derniers outfits</h2>
          <p className="text-sm text-muted-foreground">Shop les looks de tes créateurs préférés.</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[4/5] w-full rounded-xl" />
            ))}
          </div>
        ) : !data || data.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
            Aucun post pour le moment.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {data.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function PostCard({ post }: { post: { id: string; title: string; cover_image: string | null; creator_username: string; products: { id: string }[] } }) {
  return (
    <div className="group overflow-hidden rounded-xl border border-border bg-card shadow-card transition hover:shadow-card-hover">
      <Link to="/post/$id" params={{ id: post.id }} className="block">
        <div className="aspect-[4/5] w-full overflow-hidden bg-muted">
          {post.cover_image ? (
            <img
              src={post.cover_image}
              alt={post.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
              Pas d'image
            </div>
          )}
        </div>
      </Link>
      <div className="space-y-1 p-3">
        <Link to="/post/$id" params={{ id: post.id }} className="block">
          <h3 className="line-clamp-2 text-sm font-semibold leading-tight">{post.title}</h3>
        </Link>
        <div className="flex items-center justify-between text-xs">
          <Link
            to="/creator/$username"
            params={{ username: post.creator_username }}
            className="text-muted-foreground hover:text-brand"
          >
            @{post.creator_username}
          </Link>
          <span className="text-muted-foreground">
            {post.products?.length ?? 0} produit{(post.products?.length ?? 0) > 1 ? "s" : ""}
          </span>
        </div>
      </div>
    </div>
  );
}
