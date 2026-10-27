import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/i18n";
import { deleteAccount } from "@/lib/delete-account";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { StylePicker } from "@/components/vitrine/StyleChips";
import { ImageCropDialog } from "@/components/vitrine/ImageCropDialog";
import { cleanStyles, MAX_STYLES, type StyleKey } from "@/lib/styles";
import { USERNAME_PATTERN, isReservedUsername } from "@/lib/username-rules";

export const Route = createFileRoute("/_authenticated/dashboard/settings")({
  head: () => ({ meta: [{ title: "Paramètres — Wanted Fashion" }] }),
  component: Settings,
});

function Settings() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({ username: "", bio: "", profile_image: "", banner_image: "", tiktok_url: "", instagram_url: "", styles: [] as StyleKey[], interests: [] as StyleKey[] });
  const [savedUsername, setSavedUsername] = useState("");
  const [pending, setPending] = useState<{ kind: "avatar" | "banner"; file: File } | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  async function handleDeleteAccount() {
    setDeleting(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) {
      toast.error(t("settings.deleteAccountError"));
      setDeleting(false);
      return;
    }
    const result = await deleteAccount({ data: { accessToken } });
    if (!result.ok) {
      toast.error(t("settings.deleteAccountError"));
      setDeleting(false);
      return;
    }
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  useEffect(() => {
    if (!user) return;
    supabase.from("creators").select("*").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data) setForm({
        username: data.username,
        bio: data.bio ?? "",
        profile_image: data.profile_image ?? "",
        banner_image: data.banner_image ?? "",
        tiktok_url: data.tiktok_url ?? "",
        instagram_url: data.instagram_url ?? "",
        styles: cleanStyles(data.styles),
        interests: cleanStyles(data.interests),
      });
      if (data) setSavedUsername(data.username);
    });
  }, [user]);

  async function uploadAvatar(file: File) {
    if (!user) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (upErr) { toast.error(t("settings.uploadPhotoError")); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    setForm((f) => ({ ...f, profile_image: urlData.publicUrl }));
    toast.success(t("settings.photoUploaded"));
    setUploading(false);
  }

  async function uploadBanner(file: File) {
    if (!user) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}.${ext}`;
    const { error: upErr } = await supabase.storage.from("banners").upload(path, file, { upsert: true });
    if (upErr) { toast.error(t("settings.uploadBannerError")); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("banners").getPublicUrl(path);
    setForm((f) => ({ ...f, banner_image: urlData.publicUrl }));
    toast.success(t("settings.bannerUploaded"));
    setUploading(false);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const clean = form.username.trim().toLowerCase().replace(/^@/, "");
    if (!USERNAME_PATTERN.test(clean)) {
      toast.error(t("settings.invalidUsername"));
      return;
    }
    if (isReservedUsername(clean)) {
      toast.error(t("auth.usernameReserved"));
      return;
    }
    const tiktok = form.tiktok_url.trim();
    const insta = form.instagram_url.trim();
    if (tiktok && !/^https:\/\/(www\.)?tiktok\.com\//.test(tiktok)) {
      toast.error(t("creatorSettings.invalidTiktok"));
      return;
    }
    if (insta && !/^https:\/\/(www\.)?instagram\.com\//.test(insta)) {
      toast.error(t("creatorSettings.invalidInstagram"));
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("creators").update({
      username: clean,
      bio: form.bio || null,
      profile_image: form.profile_image || null,
      banner_image: form.banner_image || null,
      tiktok_url: tiktok || null,
      instagram_url: insta || null,
      styles: form.styles,
      interests: form.interests,
    }).eq("id", user.id);
    // Les tenues suivent automatiquement le nouveau username (géré par la base).
    if (!error) {
      setSavedUsername(clean);
      qc.invalidateQueries({ queryKey: ["my-interests"] });
      qc.invalidateQueries({ queryKey: ["feed"] });
    }
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success(t("settings.settingsSaved"));
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-black">{t("settings.title")}</h1>
      <form onSubmit={onSubmit} className="space-y-6">

        {/* PHOTO DE PROFIL */}
        <div>
          <Label>{t("settings.profilePicture")}</Label>
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
                {uploading ? t("settings.uploading") : t("settings.choosePicture")}
              </Button>
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) setPending({ kind: "avatar", file: f }); e.target.value = ""; }} />
            </div>
          </div>
        </div>

        {/* BANNIÈRE */}
        <div>
          <Label>{t("settings.banner")}</Label>
          <div className="mt-2 overflow-hidden rounded-xl border border-border bg-muted" style={{ aspectRatio: "5/1" }}>
            {form.banner_image ? (
              <img src={form.banner_image} alt="Banner" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full" style={{ background: "linear-gradient(135deg, #6b5240, #a67c5b)" }} />
            )}
          </div>
          <Button type="button" variant="outline" size="sm" className="mt-2" disabled={uploading} onClick={() => bannerInputRef.current?.click()}>
            {uploading ? t("settings.uploading") : t("settings.chooseBanner")}
          </Button>
          <input ref={bannerInputRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) setPending({ kind: "banner", file: f }); e.target.value = ""; }} />
          <ImageCropDialog
            file={pending?.file ?? null}
            aspect={pending?.kind === "banner" ? 3 : 1}
            round={pending?.kind === "avatar"}
            onCancel={() => setPending(null)}
            onDone={(f) => {
              const kind = pending?.kind;
              setPending(null);
              if (kind === "avatar") uploadAvatar(f);
              else if (kind === "banner") uploadBanner(f);
            }}
          />
        </div>

        {/* USERNAME */}
        <div>
          <Label htmlFor="u">{t("settings.username")}</Label>
          <Input id="u" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
        </div>

        {/* BIO */}
        <div>
          <Label htmlFor="b">{t("settings.bio")}</Label>
          <Textarea id="b" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} placeholder={t("settings.bioPlaceholder")} />
        </div>

        {/* STYLES */}
        <div>
          <Label>{t("creatorSettings.stylesTitle")}</Label>
          <p className="mb-2 mt-1 text-xs text-muted-foreground">{t("creatorSettings.stylesHint")}</p>
          <StylePicker
            value={form.styles}
            max={MAX_STYLES}
            onMax={() => toast(t("creatorSettings.maxStyles"))}
            onChange={(styles) => setForm({ ...form, styles })}
          />
        </div>

        {/* STYLES PRÉFÉRÉS (fil « Pour toi ») */}
        <div>
          <Label>{t("engage.interestsEdit")}</Label>
          <p className="mb-2 mt-1 text-xs text-muted-foreground">{t("engage.interestsText")}</p>
          <StylePicker
            value={form.interests}
            max={MAX_STYLES}
            onMax={() => toast(t("creatorSettings.maxStyles"))}
            onChange={(interests) => setForm({ ...form, interests })}
          />
        </div>

        {/* RÉSEAUX */}
        <div>
          <Label htmlFor="tt">{t("creatorSettings.tiktok")}</Label>
          <Input id="tt" type="url" inputMode="url" placeholder="https://www.tiktok.com/@..." value={form.tiktok_url} onChange={(e) => setForm({ ...form, tiktok_url: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="ig">{t("creatorSettings.instagram")}</Label>
          <Input id="ig" type="url" inputMode="url" placeholder="https://www.instagram.com/..." value={form.instagram_url} onChange={(e) => setForm({ ...form, instagram_url: e.target.value })} />
        </div>

        {savedUsername && (
          <Link to="/@{$username}" params={{ username: savedUsername }} className="block text-sm font-semibold text-primary underline">
            {t("creatorSettings.myPublicPage")}
          </Link>
        )}

        <Button type="submit" disabled={loading} className="w-full bg-brand text-brand-foreground hover:bg-brand/90">
          {loading ? t("settings.saving") : t("settings.save")}
        </Button>
      </form>

      <div className="mt-10">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" className="w-full bg-brand text-white hover:bg-brand/90">
              {t("settings.deleteAccount")}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("settings.deleteAccountTitle")}</AlertDialogTitle>
              <AlertDialogDescription>{t("settings.deleteAccountDesc")}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("dashboard.cancel")}</AlertDialogCancel>
              <AlertDialogAction
                disabled={deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={handleDeleteAccount}
              >
                {deleting ? t("settings.deletingAccount") : t("settings.deleteAccountConfirm")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </main>
  );
}
