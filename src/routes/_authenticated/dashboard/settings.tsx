import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/settings")({
  head: () => ({ meta: [{ title: "Paramètres — Wanted Fashion" }] }),
  component: Settings,
});

function Settings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ username: "", bio: "", profile_image: "", banner_image: "" });
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

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

  async function uploadAvatar(file: File) {
    if (!user) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (upErr) { toast.error("Erreur upload photo"); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    setForm((f) => ({ ...f, profile_image: urlData.publicUrl }));
    toast.success("Photo chargée !");
    setUploading(false);
  }

  async function uploadBanner(file: File) {
    if (!user) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}.${ext}`;
    const { error: upErr } = await supabase.storage.from("banners").upload(path, file, { upsert: true });
    if (upErr) { toast.error("Erreur upload bannière"); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("banners").getPublicUrl(path);
    setForm((f) => ({ ...f, banner_image: urlData.publicUrl }));
    toast.success("Bannière chargée !");
    setUploading(false);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const clean = form.username.trim().toLowerCase().replace(/^@/, "");
    if (!/^[a-z0-9_.]{3,30}$/.test(clean)) {
      toast.error("Username invalide (3-30 caractères : lettres, chiffres, _ ou .)");
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
      await supabase.from("posts").update({ creator_username: clean }).eq("creator_id", user.id);
    }
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Paramètres enregistrés !");
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-black">Paramètres</h1>
      <form onSubmit={onSubmit} className="space-y-6">

        {/* PHOTO DE PROFIL */}
        <div>
          <Label>Photo de profil</Label>
          <div className="mt-2 flex items-center gap-4">
            <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-border bg-muted">
              {form.profile_image ? (
                <img src={form.profile_image} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xl font-bold text-muted-foreground">
                  {form.username[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => avatarInputRef.current?.click()}>
                {uploading ? "Upload..." : "Choisir une photo"}
              </Button>
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAvatar(f); }} />
            </div>
          </div>
        </div>

        {/* BANNIÈRE */}
        <div>
          <Label>Bannière</Label>
          <div className="mt-2 overflow-hidden rounded-xl border border-border bg-muted" style={{ aspectRatio: "5/1" }}>
            {form.banner_image ? (
              <img src={form.banner_image} alt="Banner" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full" style={{ background: "linear-gradient(135deg, #6b5240, #a67c5b)" }} />
            )}
          </div>
          <Button type="button" variant="outline" size="sm" className="mt-2" disabled={uploading} onClick={() => bannerInputRef.current?.click()}>
            {uploading ? "Upload..." : "Choisir une bannière"}
          </Button>
          <input ref={bannerInputRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadBanner(f); }} />
        </div>

        {/* USERNAME */}
        <div>
          <Label htmlFor="u">Username</Label>
          <Input id="u" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
        </div>

        {/* BIO */}
        <div>
          <Label htmlFor="b">Bio</Label>
          <Textarea id="b" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} placeholder="Parle-toi en quelques mots..." />
        </div>

        <Button type="submit" disabled={loading} className="w-full bg-brand text-brand-foreground hover:bg-brand/90">
          {loading ? "Sauvegarde..." : "Sauvegarder"}
        </Button>
      </form>
    </main>
  );
}
