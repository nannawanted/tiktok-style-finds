import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

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

async function trackClick(postId: string, productId: string, creatorUsername: string) {
  await supabase.from("clicks").insert({
    post_id: postId,
    product_id: productId,
    creator_username: creatorUsername,
  });
}

function detectPlatform(url: string): "tiktok" | "instagram" | "youtube" | "other" {
  if (url.includes("tiktok.com")) return "tiktok";
  if (url.includes("instagram.com")) return "instagram";
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  return "other";
}

function PlatformButton({ url, compact }: { url: string; compact?: boolean }) {
  const platform = detectPlatform(url);

  const configs = {
    tiktok: {
      label: "Voir sur TikTok",
      bg: "#000000",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.27 8.27 0 0 0 4.84 1.56V6.79a4.85 4.85 0 0 1-1.07-.1z"/>
        </svg>
      ),
    },
    instagram: {
      label: "Voir sur Instagram",
      bg: "linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      ),
    },
    youtube: {
      label: "Voir sur YouTube",
      bg: "#FF0000",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      ),
    },
    other: {
      label: "Voir la vidéo",
      bg: "#1a1a1a",
      icon: <span style={{ fontSize: 16 }}>▶</span>,
    },
  };

  const config = configs[platform];

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 rounded-full font-semibold text-white shadow-md transition hover:opacity-90 ${
        compact ? "px-4 py-2 text-xs" : "px-6 py-3 text-sm"
      }`}
      style={{ background: config.bg }}
    >
      {config.icon}
      {compact ? "Voir la vidéo" : config.label}
    </a>
  );
}

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

  if (isLoading) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-6">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="mt-2 h-4 w-24" />
        <Skeleton className="mt-6 h-14 w-48 rounded-full" />
      </main>
    );
  }

  if (error || !data) return null;
  const { post, products } = data;

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <Link to="/" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-brand">
        ← Retour au feed
      </Link>

      <div className="grid gap-8 sm:grid-cols-[minmax(0,380px)_1fr]">

        {/* VIDÉO */}
        <div>
          <div
            className="relative aspect-[9/16] w-full overflow-hidden rounded-2xl bg-muted shadow-card"
            style={{ background: "linear-gradient(180deg, #e3d0b5 0%, #6b5240 100%)" }}
          >
            {post.cover_image && (
              <img src={post.cover_image} alt={post.title} className="h-full w-full object-cover" />
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/25 backdrop-blur">
                <span className="ml-1 text-2xl text-white">▶</span>
              </div>
            </div>
            {post.tiktok_url && (
              <div className="absolute bottom-4 left-4">
                <PlatformButton url={post.tiktok_url} compact />
              </div>
            )}
            <div className="absolute bottom-4 right-4 flex gap-2">
              <button className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur transition hover:bg-white/30">
                ♡
              </button>
              <button className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur transition hover:bg-white/30">
                ⤴
              </button>
            </div>
          </div>

          {/* CRÉATEUR (sous la vidéo, desktop) */}
          <div
            style={{ backgroundColor: "#6b5240" }}
            className="mt-3 hidden items-center justify-between rounded-2xl p-4 sm:flex"
          >
            <Link
              to="/creator/$username"
              params={{ username: post.creator_username }}
              className="flex items-center gap-3"
            >
              <div className="h-9 w-9 overflow-hidden rounded-full bg-white/20 text-center text-sm font-black leading-9 text-white">
                {post.creator_username[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold text-white">{post.creator_username}</p>
                <p className="text-xs text-white/60">@{post.creator_username}</p>
              </div>
            </Link>
            <Link
              to="/creator/$username"
              params={{ username: post.creator_username }}
              className="rounded-full border border-white/30 px-4 py-1.5 text-xs font-semibold text-white hover:bg-white/10"
            >
              Voir le profil ↗
            </Link>
          </div>
        </div>

        {/* INFOS + PRODUITS */}
        <div>
          <h1 className="text-2xl font-black sm:text-3xl">{post.title}</h1>
          <Link
            to="/creator/$username"
            params={{ username: post.creator_username }}
            className="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-brand"
          >
            @{post.creator_username} ✓
          </Link>

          <div
            style={{ backgroundColor: "#6b5240" }}
            className="mt-5 flex items-start gap-2.5 rounded-xl p-4 text-sm text-white"
          >
            <span>🏷️</span>
            <span>
              {products.length} pièce{products.length > 1 ? "s" : ""} identifiée{products.length > 1 ? "s" : ""} dans cette vidéo — clique sur une carte pour acheter.
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {products.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
                Aucun produit ajouté.
              </div>
            ) : (
              products.map((p) => (
                <a
                  key={p.id}
                  href={p.affiliate_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackClick(post.id, p.id, post.creator_username)}
                  style={{ backgroundColor: "#f4ead9" }}
                  className="group flex items-center gap-4 rounded-xl border border-black/5 p-3 transition hover:shadow-card cursor-pointer"
                >
                  <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">—</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    {p.brand && <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#c0392b" }}>{p.brand}</p>}
                    <h3 className="truncate text-sm font-semibold leading-snug">{p.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {p.price && <span className="text-sm font-black text-brand">{p.price}</span>}
                      {p.price && " · "}
                      {(() => { try { return new URL(p.affiliate_link).hostname.replace("www.", ""); } catch { return ""; } })()}
                    </p>
                  </div>
                  <span
                    style={{ backgroundColor: "rgba(192,57,43,0.12)" }}
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-brand transition group-hover:bg-brand group-hover:text-white"
                  >
                    ↗
                  </span>
                </a>
              ))
            )}
          </div>

          <Link
            to="/"
            style={{ backgroundColor: "#c0392b" }}
            className="mt-5 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white hover:opacity-90"
          >
            🛍️ Envie de shopper plus de looks ? <span className="underline">Voir le feed</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
