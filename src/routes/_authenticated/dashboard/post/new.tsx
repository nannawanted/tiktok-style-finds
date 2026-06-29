import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { PostForm, type PostFormData } from "@/components/PostForm";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/post/new")({
  head: () => ({ meta: [{ title: "Nouveau post — Wanted Fashion" }] }),
  component: NewPost,
});

function NewPost() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  async function onSubmit(data: PostFormData) {
    if (!user) return;
    setLoading(true);

    // Get current creator username
    const { data: creator } = await supabase.from("creators").select("username").eq("id", user.id).maybeSingle();
    if (!creator) {
      setLoading(false);
      toast.error("Profil créateur introuvable");
      return;
    }

    const { data: post, error } = await supabase.from("posts").insert({
      creator_id: user.id,
      creator_username: creator.username,
      title: data.title,
      tiktok_url: data.tiktok_url || null,
      cover_image: data.cover_image || null,
    }).select("id").single();

    if (error || !post) {
      setLoading(false);
      toast.error(error?.message ?? "Erreur");
      return;
    }

    if (data.products.length > 0) {
      const { error: e2 } = await supabase.from("products").insert(
        data.products.map((p, i) => ({
          post_id: post.id,
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
        toast.error("Post créé mais produits échoués : " + e2.message);
        return;
      }
    }

    setLoading(false);
    toast.success("Post publié !");
    navigate({ to: "/dashboard" });
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-black">Nouveau post</h1>
      <PostForm onSubmit={onSubmit} submitLabel="Publier" loading={loading} />
    </main>
  );
}
