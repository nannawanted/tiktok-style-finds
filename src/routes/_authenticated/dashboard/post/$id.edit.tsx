import { indexPostImageLater } from "@/lib/visual-embedding";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { linkErrorKey } from "@/lib/link-safety";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/lib/i18n";
import { PostForm, type PostFormData } from "@/components/PostForm";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cleanStyles } from "@/lib/styles";
import { cleanTags } from "@/lib/tags";

export const Route = createFileRoute("/_authenticated/dashboard/post/$id/edit")({
  head: () => ({ meta: [{ title: "Éditer post — Wanted Fashion" }] }),
  component: EditPost,
});

function EditPost() {
  const { id } = Route.useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["edit-post", id],
    queryFn: async (): Promise<PostFormData | null> => {
      const { data: post } = await supabase.from("posts").select("*").eq("id", id).maybeSingle();
      if (!post) return null;
      const { data: products } = await supabase
        .from("products").select("*").eq("post_id", id).order("position", { ascending: true });
      return {
        title: post.title,
        tiktok_url: post.tiktok_url ?? "",
        cover_image: post.cover_image ?? "",
        styles: cleanStyles(post.styles),
        tags: cleanTags((post as { tags?: string[] }).tags),
        visual_tags: (post as { visual_tags?: string[] }).visual_tags ?? [],
        visual_tags_rejected: (post as { visual_tags_rejected?: string[] }).visual_tags_rejected ?? [],
        products: (products ?? []).map((p) => ({
          id: p.id,
          brand: p.brand ?? "",
          brand_id: p.brand_id ?? null,
          name: p.name,
          price: p.price ?? "",
          image_url: p.image_url ?? "",
          affiliate_link: p.affiliate_link,
        })),
      };
    },
  });

  async function onSubmit(form: PostFormData) {
    setLoading(true);
    const { error } = await supabase.from("posts").update({
      title: form.title,
      tiktok_url: form.tiktok_url || null,
      cover_image: form.cover_image || null,
      styles: form.styles,
      tags: form.tags,
      visual_tags: form.visual_tags,
      visual_tags_rejected: form.visual_tags_rejected,
    }).eq("id", id);
    if (error) {
      setLoading(false);
      toast.error(error.message);
      return;
    }

    // Replace products: delete all then insert
    await supabase.from("products").delete().eq("post_id", id);
    if (form.products.length > 0) {
      const { error: e2 } = await supabase.from("products").insert(
        form.products.map((p, i) => ({
          post_id: id,
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
        toast.error(linkErrorKey(e2.message) ? t(linkErrorKey(e2.message)!) : e2.message);
        return;
      }
    }

    indexPostImageLater(id, form.cover_image);
    setLoading(false);
    toast.success(t("editPost.postUpdated"));
    navigate({ to: "/dashboard" });
  }

  if (isLoading) {
    return <main className="mx-auto max-w-2xl px-4 py-6"><Skeleton className="h-96 w-full" /></main>;
  }
  if (!data) {
    return <main className="mx-auto max-w-2xl px-4 py-6 text-muted-foreground">{t("editPost.postNotFound")}</main>;
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <PostForm initial={data} onSubmit={onSubmit} submitLabel={t("editPost.save")} loading={loading} mode="edit" />
    </main>
  );
}
