import { createFileRoute, Link, notFound } from "@tanstack/react-router";
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
          <img src={post.cover_image} alt={post.title} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
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
