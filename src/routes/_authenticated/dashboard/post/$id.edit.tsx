import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/lib/i18n";
import { PostForm, type PostFormData } from "@/components/PostForm";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

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
        products: (products ?? []).map((p) => ({
          id: p.id,
          brand: p.brand ?? "",
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
          name: p.name,
          price: p.price || null,
          image_url: p.image_url || null,
          affiliate_link: p.affiliate_link,
          position: i,
        }))
      );
      if (e2) {
        setLoading(false);
        toast.error(e2.message);
        return;
      }
    }

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
      <h1 className="mb-6 text-2xl font-black">{t("editPost.title")}</h1>
      <PostForm initial={data} onSubmit={onSubmit} submitLabel={t("editPost.save")} loading={loading} />
    </main>
  );
}
