import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { PostForm, type PostFormData } from "@/components/PostForm";

export const Route = createFileRoute("/_authenticated/dashboard/settings")({
  head: () => ({ meta: [{ title: "Paramètres — Wanted Fashion" }] }),
  component: Settings,
});

// Note: PostForm import is unused here — left for code-splitting parity. Removing:
// (We won't actually use PostForm here.)
void PostForm; void Textarea; void Input; void Label; void Button; void useNavigate; void useQuery; void useEffect; void useState; void supabase; void useAuth; void toast;
type _ = PostFormData;

function Settings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ username: "", bio: "", profile_image: "", banner_image: "" });

  useEffect(() => {
    if (!user) return;
    supabase.from("creators").select("*").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data) setForm({
        username: data.username,
        bio: data.bio ?? "",
        profile_image: data.profile_image ?? "",
        banner_image: data.banner_image ?? "",
      });
    });
  }, [user]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const clean = form.username.trim().toLowerCase().replace(/^@/, "");
    if (!/^[a-z0-9_.]{3,30}$/.test(clean)) {
      toast.error("Username invalide");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("creators").update({
      username: clean,
      bio: form.bio || null,
      profile_image: form.profile_image || null,
      banner_image: form.banner_image || null,
    }).eq("id", user.id);
    if (!error) {
      // also propagate username on posts
      await supabase.from("posts").update({ creator_username: clean }).eq("creator_id", user.id);
    }
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Paramètres enregistrés");
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-black">Paramètres</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="u">Username</Label>
          <Input id="u" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
        </div>
        <div>
          <Label htmlFor="b">Bio</Label>
          <Textarea id="b" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} />
        </div>
        <div>
          <Label htmlFor="p">URL photo de profil</Label>
          <Input id="p" type="url" value={form.profile_image} onChange={(e) => setForm({ ...form, profile_image: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="bn">URL banner</Label>
          <Input id="bn" type="url" value={form.banner_image} onChange={(e) => setForm({ ...form, banner_image: e.target.value })} />
        </div>
        <Button type="submit" disabled={loading} className="bg-brand text-brand-foreground hover:bg-brand/90">
          {loading ? "Sauvegarde..." : "Sauvegarder"}
        </Button>
      </form>
    </main>
  );
}
