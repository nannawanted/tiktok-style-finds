import { indexPostImageLater } from "@/lib/visual-embedding";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/i18n";
import { PostForm, clearPostDraft, type PostFormData } from "@/components/PostForm";
import { ShareButton } from "@/components/ShareButton";
import { absoluteUrl, outfitPath, profilePath } from "@/lib/site";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/post/new")({
  head: () => ({ meta: [{ title: "Nouveau look — Wanted Fashion" }] }),
  component: NewPost,
});

type Published = { id: string; title: string; cover: string; username: string };

function NewPost() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [published, setPublished] = useState<Published | null>(null);
  const [formKey, setFormKey] = useState(0);
  const draftKey = user ? `wf_post_draft:${user.id}` : undefined;

  async function onSubmit(data: PostFormData) {
    if (!user) return;
    setLoading(true);

    const { data: creator } = await supabase.from("creators").select("username").eq("id", user.id).maybeSingle();
    if (!creator) {
      setLoading(false);
      toast.error(t("newPost.creatorProfileNotFound"));
      return;
    }

    const { data: post, error } = await supabase.from("posts").insert({
      creator_id: user.id,
      creator_username: creator.username,
      title: data.title,
      tiktok_url: data.tiktok_url || null,
      cover_image: data.cover_image || null,
      styles: data.styles,
    }).select("id").single();

    if (error || !post) {
      setLoading(false);
      toast.error(error?.message ?? t("newPost.genericError"));
      return;
    }

    if (data.products.length > 0) {
      const { error: e2 } = await supabase.from("products").insert(
        data.products.map((p, i) => ({
          post_id: post.id,
          brand: p.brand || null,
          brand_id: p.brand_id || null,
          name: p.name,
          price: p.price || null,
          image_url: p.image_url || null,
          affiliate_link: p.affiliate_link,
          position: i,
        }))
      );
      if (e2) {
        setLoading(false);
        toast.error(t("newPost.postCreatedProductsFailed") + " " + e2.message);
        return;
      }
    }

    // Empreinte visuelle pour « Plus comme ça » (en arrière-plan)
    indexPostImageLater(post.id, data.cover_image);
    if (draftKey) clearPostDraft(draftKey);
    qc.invalidateQueries({ queryKey: ["my-posts"] });
    qc.invalidateQueries({ queryKey: ["feed"] });
    setLoading(false);
    setPublished({ id: post.id, title: data.title, cover: data.cover_image, username: creator.username });
    window.scrollTo({ top: 0 });
  }

  if (published) {
    return (
      <PublishedScreen
        published={published}
        onAnother={() => {
          setPublished(null);
          setFormKey((k) => k + 1);
        }}
      />
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <PostForm key={formKey} mode="new" draftKey={draftKey} onSubmit={onSubmit} submitLabel={t("studio.publish")} loading={loading} />
    </main>
  );
}

function PublishedScreen({ published, onAnother }: { published: Published; onAnother: () => void }) {
  const { t } = useTranslation();
  const profileUrl = absoluteUrl(profilePath(published.username));
  const postUrl = absoluteUrl(outfitPath(published.id));

  async function copy() {
    try {
      await navigator.clipboard.writeText(profileUrl);
      toast(t("studio.copied"));
    } catch {
      toast(profileUrl);
    }
  }

  return (
    <main className="mx-auto flex max-w-md flex-col items-center gap-5 px-4 pb-16 pt-8 text-center">
      <div className="relative w-full max-w-[250px] -rotate-3 overflow-hidden rounded-[28px] bg-card shadow-[0_20px_40px_-24px_rgba(40,20,10,.75)]">
        {published.cover ? (
          <img src={published.cover} alt={published.title} referrerPolicy="no-referrer" className="block w-full" />
        ) : (
          <div className="aspect-[3/4]" />
        )}
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <Heart className="heart-burst h-24 w-24 fill-surface text-surface drop-shadow-lg" aria-hidden="true" />
        </span>
      </div>
      <h1 className="font-display text-4xl font-bold">{t("studio.published")}</h1>
      <p className="text-base leading-relaxed text-foreground/70">{t("studio.publishedLead")}</p>
      <div className="flex w-full items-center gap-2 rounded-full bg-surface py-1.5 pl-4 pr-1.5">
        <span className="min-w-0 flex-1 truncate text-left text-sm font-semibold">{profileUrl.replace(/^https:\/\//, "")}</span>
        <button type="button" onClick={copy} className="rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-surface">
          {t("studio.copy")}
        </button>
      </div>
      <div className="grid w-full grid-cols-2 gap-2.5">
        <ShareButton
          title={published.title}
          text={`@${published.username} sur WantedFashion`}
          url={postUrl}
          image={published.cover || undefined}
          label={t("outfit.share")}
          className="flex h-12 min-w-0 items-center justify-center gap-2 rounded-full border-[1.5px] border-border bg-surface px-3 font-semibold"
          iconClassName="h-4 w-4"
        />
        <Link to="/post/$id" params={{ id: published.id }} className="flex h-12 items-center justify-center rounded-full border-[1.5px] border-border bg-surface px-3 font-semibold">
          {t("studio.seeLook")}
        </Link>
      </div>
      <button type="button" onClick={onAnother} className="h-14 w-full rounded-full bg-ink text-base font-bold text-surface">
        {t("studio.another")}
      </button>
      <Link to="/dashboard" className="text-sm font-semibold underline underline-offset-4">
        {t("studio.myPosts")}
      </Link>
    </main>
  );
}
