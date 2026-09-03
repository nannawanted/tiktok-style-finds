import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/i18n";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { Play, Camera, Instagram, Youtube, Music2, Video, Users, Grid3x3, BadgeCheck, Heart, Sparkles, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/creator/$username")({
  ssr: false,
  head: ({ params }) => ({
    meta: [
      { title: `@${params.username} — Wanted Fashion` },
      { name: "description", content: `Découvre les outfits de @${params.username} sur Wanted Fashion.` },
      { property: "og:title", content: `@${params.username} — Wanted Fashion` },
      { property: "og:url", content: `/creator/${params.username}` },
    ],
    links: [{ rel: "canonical", href: `/creator/${params.username}` }],
  }),
  component: CreatorPage,
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-2xl p-10 text-center text-muted-foreground">{error.message}</div>
  ),
  notFoundComponent: () => {
    const { t } = useTranslation();
    return <div className="mx-auto max-w-2xl p-10 text-center text-muted-foreground">{t("creatorPage.notFound")}</div>;
  },
});

function platformButtonClass(url: string | null) {
  if (!url) return "bg-foreground text-background";
  if (url.includes("tiktok")) return "bg-foreground text-background";
  if (url.includes("instagram")) return "bg-gradient-to-r from-accent via-primary to-secondary text-primary-foreground";
  if (url.includes("youtube")) return "bg-destructive text-destructive-foreground";
  return "bg-foreground text-background";
}

function CreatorPage() {
  const { t } = useTranslation();
  const { username } = Route.useParams();
  const { user } = useAuth();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["creator", username],
    queryFn: async () => {
      const { data: creator, error: e1 } = await supabase
        .from("creators")
        .select("*")
        .eq("username", username)
        .maybeSingle();
      if (e1) throw e1;
      if (!creator) throw notFound();

      const { data: posts, error: e2 } = await supabase
        .from("posts")
        .select("id, title, cover_image, creator_username, tiktok_url, products(id)")
        .eq("creator_id", creator.id)
        .order("created_at", { ascending: false });
      if (e2) throw e2;
      return { creator, posts: posts ?? [] };
    },
  });

  const isOwner = user && data?.creator && user.id === data.creator.id;

  async function uploadAvatar(file: File) {
    if (!data?.creator?.id) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${data.creator.id}.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (upErr) { toast.error(t("creatorPage.uploadError")); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const { error: dbErr } = await supabase.from("creators").update({ profile_image: urlData.publicUrl }).eq("id", data.creator.id);
    if (dbErr) { toast.error(t("creatorPage.saveError")); setUploading(false); return; }
    toast.success(t("creatorPage.avatarUpdated"));
    setUploading(false);
    refetch();
  }

  async function uploadBanner(file: File) {
    if (!data?.creator?.id) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${data.creator.id}.${ext}`;
    const { error: upErr } = await supabase.storage.from("banners").upload(path, file, { upsert: true });
    if (upErr) { toast.error(t("creatorPage.uploadError")); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("banners").getPublicUrl(path);
    const { error: dbErr } = await supabase.from("creators").update({ banner_image: urlData.publicUrl }).eq("id", data.creator.id);
    if (dbErr) { toast.error(t("creatorPage.saveError")); setUploading(false); return; }
    toast.success(t("creatorPage.bannerUpdated"));
    setUploading(false);
    refetch();
  }

  if (isLoading) {
    return (
      <main>
        <Skeleton className="h-52 sm:h-64 w-full" />
        <div className="max-w-5xl mx-auto px-6 -mt-16 flex items-center gap-4">
          <Skeleton className="h-32 w-32 rounded-full" />
          <Skeleton className="h-6 w-40" />
        </div>
      </main>
    );
  }

  if (error || !data) return null;
  const { creator, posts } = data;
  const productsCount = posts.reduce((n, p) => n + (p.products?.length ?? 0), 0);

  return (
    <div>
      {/* HERO / BANNIÈRE + AVATAR */}
      <section className="relative">
        <div
          className="relative w-full h-52 sm:h-64 bg-cover bg-center bg-secondary group"
          style={{ backgroundImage: creator.banner_image ? `url('${creator.banner_image}')` : undefined }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-foreground/10 to-transparent" />
          <Link
            to="/"
            className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-2 rounded-full bg-background/80 backdrop-blur-sm text-xs font-medium text-foreground hover:bg-background transition-colors duration-300"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> {t("creatorPage.home")}
          </Link>
          {isOwner && (
            <>
              <button
                onClick={() => bannerInputRef.current?.click()}
                disabled={uploading}
                className="absolute top-4 right-4 flex items-center gap-2 px-3 py-2 rounded-full bg-background/80 backdrop-blur-sm text-xs font-medium text-foreground hover:bg-background transition-colors duration-300"
              >
                <Camera className="w-3.5 h-3.5" /> {uploading ? t("creatorPage.uploading") : t("creatorPage.changeBanner")}
              </button>
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadBanner(f); }}
              />
            </>
          )}
        </div>

        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="relative -mt-16 sm:-mt-20 flex flex-col sm:flex-row sm:items-end gap-5 pb-8"
          >
            <div className="relative group shrink-0 mx-auto sm:mx-0">
              <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full p-1.5 bg-gradient-to-br from-primary via-accent to-secondary shadow-xl">
                <div className="w-full h-full rounded-full border-4 border-background overflow-hidden bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground">
                  {creator.profile_image ? (
                    <img src={creator.profile_image} alt={creator.username} className="w-full h-full object-cover" />
                  ) : (
                    creator.username[0]?.toUpperCase()
                  )}
                </div>
              </div>
              {isOwner && (
                <>
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploading}
                    className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors duration-300"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAvatar(f); }}
                  />
                </>
              )}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{creator.username}</h1>
                <BadgeCheck className="w-5 h-5 text-primary" />
              </div>
              <p className="text-primary font-medium">@{creator.username}</p>
              {creator.bio && <p className="text-muted-foreground mt-2 max-w-md">{creator.bio}</p>}
            </div>
            {!isOwner && (
              <div className="flex sm:flex-col gap-3 justify-center">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6">{t("creatorPage.follow")}</Button>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* STATS */}
      <section className="bg-secondary py-10">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-3 gap-4">
          <div className="rounded-2xl bg-secondary-foreground/5 backdrop-blur-sm p-5 text-center hover:-translate-y-1 transition-all duration-300">
            <Grid3x3 className="w-5 h-5 text-primary-foreground/80 mx-auto mb-2" />
            <div className="text-xl font-bold text-primary-foreground">{posts.length}</div>
            <div className="text-xs text-secondary-foreground/70">{t("creatorPage.posts")}</div>
          </div>
          <div className="rounded-2xl bg-secondary-foreground/5 backdrop-blur-sm p-5 text-center hover:-translate-y-1 transition-all duration-300">
            <Users className="w-5 h-5 text-primary-foreground/80 mx-auto mb-2" />
            <div className="text-xl font-bold text-primary-foreground">{productsCount}</div>
            <div className="text-xs text-secondary-foreground/70">{t("creatorPage.productsTagged")}</div>
          </div>
          <div className="rounded-2xl bg-secondary-foreground/5 backdrop-blur-sm p-5 text-center hover:-translate-y-1 transition-all duration-300">
            <Heart className="w-5 h-5 text-primary-foreground/80 mx-auto mb-2" />
            <div className="text-xl font-bold text-primary-foreground">{t("creatorPage.shoppable")}</div>
            <div className="text-xs text-secondary-foreground/70">{t("creatorPage.allLooks")}</div>
          </div>
        </div>
      </section>

      {/* POSTS */}
      <section className="relative bg-background py-16 sm:py-20">
        <div className="relative max-w-5xl mx-auto px-6">
          <div className="mb-10 flex items-center gap-2">
            <Grid3x3 className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">{t("creatorPage.looksOf")} @{creator.username}</h2>
          </div>
          {posts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
              {t("creatorPage.notPublishedYet")}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  to="/post/$id"
                  params={{ id: post.id }}
                  className="group block rounded-2xl overflow-hidden bg-card border border-border shadow-sm hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-500"
                >
                  <div className="relative w-full aspect-[4/5] overflow-hidden bg-muted">
                    {post.cover_image && (
                      <img
                        src={post.cover_image}
                        alt={post.title}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/50 via-transparent to-transparent" />
                    {post.tiktok_url && (
                      <span
                        className={`absolute bottom-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${platformButtonClass(
                          post.tiktok_url
                        )}`}
                      >
                        <Play className="w-3 h-3 fill-current" /> {t("creatorPage.watchVideo")}
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-card-foreground truncate">{post.title}</h3>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">@{creator.username}</span>
                      <span className="text-xs text-muted-foreground">
                        {post.products?.length ?? 0} {(post.products?.length ?? 0) > 1 ? t("creatorPage.products") : t("creatorPage.product")}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA DEVENIR CRÉATEUR */}
      {!isOwner && (
        <section className="relative bg-muted py-16 overflow-hidden">
          <div className="relative max-w-2xl mx-auto px-6 text-center">
            <Sparkles className="w-8 h-8 text-primary mx-auto mb-4" />
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">
              {t("creatorPage.ctaTitle")}
            </h2>
            <Link to="/signup">
              <Button className="mt-6 bg-accent text-accent-foreground hover:bg-accent/90 rounded-full px-8 h-11">
                {t("creatorPage.ctaButton")}
              </Button>
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
