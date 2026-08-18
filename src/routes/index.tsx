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
        .select("id, title, cover_image, creator_username, tiktok_url, created_at, products(id)")
        .order("created_at", { ascending: false })
        .limit(60);
      if (error) throw error;
      return posts ?? [];
    },
  });

  const { data: topCreators } = useQuery({
    queryKey: ["top-creators"],
    queryFn: async () => {
      // Récupère directement tous les créateurs avec leur photo
      const { data: creators, error } = await supabase
        .from("creators")
        .select("username, profile_image")
        .limit(6);
      if (error) throw error;
      return creators ?? [];
    },
  });

  return (
    <main>
      {/* HERO */}
      <section
        style={{ background: "linear-gradient(160deg, #8b6b52 0%, #6b5240 55%, #2b211a 100%)" }}
        className="px-4 py-20 text-center sm:py-28"
      >
        <span
          style={{ backgroundColor: "rgba(255,255,255,0.1)", borderColor: "rgba(255,255,255,0.2)" }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium text-white/90"
        >
          ✨ Le social shopping made in France
        </span>
        <h1 className="mx-auto mb-4 max-w-3xl text-4xl font-black leading-[1.1] tracking-tight text-white sm:text-5xl">
          Trouve les pièces{" "}
          <span style={{ color: "#e3d0b5" }}>de tes</span>{" "}
          <span style={{ color: "#c98a7d" }}>créateurs</span>
        </h1>
        <p className="mb-8 text-sm text-white/70 sm:text-base">
          Vidéo <span className="mx-1">→</span> références <span className="mx-1">→</span> achat en 1 clic
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <a
            href="#feed"
            style={{ backgroundColor: "#c0392b" }}
            className="rounded-full px-7 py-3 text-sm font-semibold text-white shadow-lg transition hover:opacity-90"
          >
            Explorer les looks →
          </a>
          <Link
            to="/signup"
            style={{ backgroundColor: "rgba(0,0,0,0.25)", borderColor: "rgba(255,255,255,0.3)" }}
            className="rounded-full border px-7 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Devenir créateur
          </Link>
        </div>
      </section>

      {/* COMMENT ÇA MARCHE */}
      <section style={{ backgroundColor: "#e3d0b5" }} className="px-4 py-16 text-center">
        <h2 className="text-2xl font-black sm:text-3xl">Comment ça marche</h2>
        <p className="mt-2 text-sm text-muted-foreground">Trois étapes, zéro friction.</p>
        <div className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-3">
          {[
            { icon: "🎥", title: "La vidéo", desc: "Le créateur poste sa tenue en vidéo sur TikTok, Instagram ou YouTube." },
            { icon: "🏷️", title: "Les références", desc: "Chaque pièce portée est identifiée et listée sur la page du post." },
            { icon: "🛍️", title: "L'achat", desc: "Un clic sur la carte produit et tu es redirigé chez le vendeur." },
          ].map((step) => (
            <div
              key={step.title}
              style={{ backgroundColor: "rgba(255,255,255,0.4)" }}
              className="rounded-2xl p-6 text-left"
            >
              <div
                style={{ backgroundColor: "rgba(192,57,43,0.12)" }}
                className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl text-lg"
              >
                {step.icon}
              </div>
              <h3 className="mb-1.5 text-base font-bold">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-8">

        {/* CRÉATEURS */}
        {topCreators && topCreators.length > 0 && (
          <section className="mb-12">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-black">
                <span style={{ color: "#c0392b" }}>↗</span> Créateurs populaires
              </h2>
              <a href="/#feed" className="text-sm font-semibold" style={{ color: "#c0392b" }}>
                Voir tous →
              </a>
            </div>
            <div className="flex gap-5 overflow-x-auto pb-2">
              {topCreators.map((c, i) => (
                <Link
                  key={c.username}
                  to="/creator/$username"
                  params={{ username: c.username }}
                  className="flex flex-shrink-0 flex-col items-center gap-2 text-center"
                >
                  <div className="relative">
                    <div className="h-16 w-16 overflow-hidden rounded-full ring-[3px] ring-brand ring-offset-2 ring-offset-background">
                      {c.profile_image ? (
                        <img src={c.profile_image} alt={c.username} className="h-full w-full object-cover" />
                      ) : (
                        <div
                          style={{ background: "linear-gradient(135deg, #8b6b52, #c0392b)" }}
                          className="flex h-full w-full items-center justify-center text-lg font-black text-white"
                        >
                          {c.username[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    {i === 0 && (
                      <span
                        style={{ backgroundColor: "#c0392b" }}
                        className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] text-white"
                      >
                        👑
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-semibold">@{c.username}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* FEED */}
        <div id="feed">
          <div className="mb-4">
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
      </div>
    </main>
  );
}

function PostCard({ post }: {
  post: {
    id: string;
    title: string;
    cover_image: string | null;
    creator_username: string;
    tiktok_url: string | null;
    products: { id: string }[];
  }
}) {
  return (
    <div
      style={{ backgroundColor: "#f4ead9" }}
      className="group overflow-hidden rounded-2xl border border-black/5 transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <Link to="/post/$id" params={{ id: post.id }} className="relative block">
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
        {post.tiktok_url && (
          <div className="absolute bottom-3 left-3">
            <span
              style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
              className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm"
            >
              ▶ Voir la vidéo
            </span>
          </div>
        )}
      </Link>
      <div className="space-y-1.5 border-t border-black/5 p-3">
        <Link to="/post/$id" params={{ id: post.id }} className="block">
          <h3 className="line-clamp-2 text-sm font-bold leading-tight">{post.title}</h3>
        </Link>
        <div className="flex items-center justify-between text-xs">
          <Link
            to="/creator/$username"
            params={{ username: post.creator_username }}
            className="font-medium text-muted-foreground hover:text-brand"
          >
            @{post.creator_username}
          </Link>
          <span
            style={{ backgroundColor: "rgba(0,0,0,0.05)" }}
            className="rounded-full px-2 py-0.5 text-muted-foreground"
          >
            {post.products?.length ?? 0} produit{(post.products?.length ?? 0) > 1 ? "s" : ""}
          </span>
        </div>
      </div>
    </div>
  );
}
