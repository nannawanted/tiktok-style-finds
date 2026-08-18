import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/post/$id")({
  ssr: false,import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Play,
  Instagram,
  Youtube,
  Music2,
  Video,
  Heart,
  Share2,
  BadgeCheck,
  ShoppingBag,
  ArrowLeft,
  ArrowUpRight,
  Tag,
  ExternalLink,
} from "lucide-react";

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

function detectPlatform(url: string | null): "tiktok" | "instagram" | "youtube" | "other" {
  if (!url) return "other";
  if (url.includes("tiktok.com")) return "tiktok";
  if (url.includes("instagram.com")) return "instagram";
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  return "other";
}

function platformButtonClass(platform: string) {
  if (platform === "tiktok") return "bg-foreground text-background hover:bg-foreground/90";
  if (platform === "instagram")
    return "bg-gradient-to-r from-accent via-primary to-secondary text-primary-foreground hover:opacity-90";
  if (platform === "youtube") return "bg-destructive text-destructive-foreground hover:bg-destructive/90";
  return "bg-foreground text-background";
}

function PlatformIcon({ platform, className }: { platform: string; className?: string }) {
  if (platform === "tiktok") return <Music2 className={className} />;
  if (platform === "instagram") return <Instagram className={className} />;
  if (platform === "youtube") return <Youtube className={className} />;
  return <Video className={className} />;
}

function VideoColumn({ post }: {
  post: { title: string; cover_image: string | null; tiktok_url: string | null; creator_username: string };
}) {
  const platform = detectPlatform(post.tiktok_url);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="relative"
    >
      <div className="relative w-full aspect-[9/16] max-h-[70vh] mx-auto rounded-3xl overflow-hidden bg-muted shadow-xl">
        {post.cover_image && (
          <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-transparent to-foreground/10" />
        {post.tiktok_url && (
          <a
            href={post.tiktok_url}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 flex items-center justify-center group"
            aria-label="Voir la vidéo"
          >
            <span className="w-16 h-16 rounded-full bg-background/30 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-primary-foreground/40">
              <Play className="w-6 h-6 text-primary-foreground fill-current" />
            </span>
          </a>
        )}
        <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between">
          {post.tiktok_url && (
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${platformButtonClass(
                platform
              )}`}
            >
              <PlatformIcon platform={platform} className="w-3 h-3" /> Voir la vidéo
            </span>
          )}
          <div className="flex items-center gap-2">
            <button className="w-9 h-9 rounded-full bg-background/30 backdrop-blur-sm flex items-center justify-center text-primary-foreground hover:bg-background/50 transition-colors duration-300">
              <Heart className="w-4 h-4" />
            </button>
            <button className="w-9 h-9 rounded-full bg-background/30 backdrop-blur-sm flex items-center justify-center text-primary-foreground hover:bg-background/50 transition-colors duration-300">
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ProductRow({
  product,
  onNavigate,
}: {
  product: { id: string; name: string; brand: string | null; price: string | null; image_url: string | null; affiliate_link: string };
  onNavigate: () => void;
}) {
  let hostname = "";
  try {
    hostname = new URL(product.affiliate_link).hostname.replace("www.", "");
  } catch {
    hostname = "";
  }

  return (
    <a
      href={product.affiliate_link}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onNavigate}
      className="group flex items-center gap-4 p-4 rounded-2xl bg-card border border-border shadow-sm hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 hover:border-primary/40 transition-all duration-300"
    >
      <div className="w-20 h-20 rounded-xl overflow-hidden bg-muted shrink-0">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">—</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        {product.brand && <p className="text-xs text-muted-foreground uppercase tracking-wide">{product.brand}</p>}
        <h4 className="font-semibold text-card-foreground truncate">{product.name}</h4>
        <div className="flex items-center gap-2 mt-1">
          {product.price && <span className="text-primary font-bold">{product.price}</span>}
          {hostname && <span className="text-xs text-muted-foreground">· {hostname}</span>}
        </div>
      </div>
      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary transition-colors duration-300">
        <ArrowUpRight className="w-4 h-4 text-primary group-hover:text-primary-foreground" />
      </div>
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

      const { data: creator } = await supabase
        .from("creators")
        .select("username, profile_image")
        .eq("username", post.creator_username)
        .maybeSingle();

      return { post, products: products ?? [], creator };
    },
  });

  if (isLoading) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="mt-4 aspect-[9/16] max-h-[70vh] w-full max-w-sm rounded-3xl" />
      </main>
    );
  }

  if (error || !data) return null;
  const { post, products, creator } = data;

  return (
    <div>
      <section className="relative bg-background py-10 sm:py-16">
        <div className="relative max-w-5xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-10">
          <VideoColumn post={post} />

          <div className="flex flex-col gap-6">
            <div>
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors duration-300 mb-2"
              >
                <ArrowLeft className="w-4 h-4" /> Retour au feed
              </Link>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{post.title}</h1>
              <Link to="/creator/$username" params={{ username: post.creator_username }} className="mt-3 inline-flex items-center gap-2 group">
                <div className="w-9 h-9 rounded-full object-cover ring-2 ring-primary/30 overflow-hidden bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                  {creator?.profile_image ? (
                    <img src={creator.profile_image} alt={post.creator_username} className="w-full h-full object-cover" />
                  ) : (
                    post.creator_username[0]?.toUpperCase()
                  )}
                </div>
                <span className="text-sm font-medium text-primary group-hover:underline">@{post.creator_username}</span>
                <BadgeCheck className="w-4 h-4 text-primary" />
              </Link>
            </div>

            <div className="flex items-center gap-2 p-4 rounded-2xl bg-secondary text-secondary-foreground">
              <Tag className="w-4 h-4" />
              <p className="text-sm">
                <span className="font-semibold">{products.length}</span> pièce{products.length > 1 ? "s" : ""}{" "}
                identifiée{products.length > 1 ? "s" : ""} dans cette vidéo — clique sur une carte pour acheter.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {products.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
                  Aucun produit ajouté.
                </div>
              ) : (
                products.map((p) => (
                  <ProductRow key={p.id} product={p} onNavigate={() => trackClick(post.id, p.id, post.creator_username)} />
                ))
              )}
            </div>

            <div className="p-5 rounded-2xl bg-muted flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-primary" />
                </div>
                <p className="text-sm text-foreground font-medium">Envie de shopper plus de looks ?</p>
              </div>
              <Link to="/">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full">Voir le feed</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="relative bg-secondary py-14 overflow-hidden">
        <div className="relative max-w-4xl mx-auto px-6 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full overflow-hidden bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground ring-2 ring-primary-foreground/30">
              {creator?.profile_image ? (
                <img src={creator.profile_image} alt={post.creator_username} className="w-full h-full object-cover" />
              ) : (
                post.creator_username[0]?.toUpperCase()
              )}
            </div>
            <div>
              <p className="text-primary-foreground font-semibold">{post.creator_username}</p>
              <p className="text-secondary-foreground/70 text-sm">@{post.creator_username}</p>
            </div>
          </div>
          <Link to="/creator/$username" params={{ username: post.creator_username }}>
            <Button
              variant="outline"
              className="rounded-full border-primary-foreground/40 text-primary-foreground bg-transparent hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              Voir le profil <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

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
