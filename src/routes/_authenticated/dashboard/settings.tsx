import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/i18n";
import { deleteAccount } from "@/lib/delete-account";
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
import { SITE_URL } from "@/lib/site";
import { ArrowLeft, ArrowUpRight, Camera, Download, ImagePlus, Loader2, LogOut, Mail } from "lucide-react";
import { SiInstagram, SiTiktok } from "react-icons/si";

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
  const [loaded, setLoaded] = useState(false);
  const initialRef = useRef("");
  const [pending, setPending] = useState<{ kind: "avatar" | "banner"; file: File } | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [exporting, setExporting] = useState(false);
  // RGPD : télécharger toutes ses données (fichier JSON)
  async function downloadMyData() {
    setExporting(true);
    const { data, error } = await supabase.rpc("export_my_data" as never);
    setExporting(false);
    if (error || !data) {
      toast.error(t("settings.exportError"));
      return;
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wantedfashion-mes-donnees-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    toast.success(t("settings.exportDone"));
  }

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
      if (!data) return;
      const next = {
        username: data.username,
        bio: data.bio ?? "",
        profile_image: data.profile_image ?? "",
        banner_image: data.banner_image ?? "",
        tiktok_url: data.tiktok_url ?? "",
        instagram_url: data.instagram_url ?? "",
        styles: cleanStyles(data.styles),
        interests: cleanStyles(data.interests),
      };
      setForm(next);
      initialRef.current = JSON.stringify(next);
      setLoaded(true);
      setSavedUsername(data.username);
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
      const saved = { ...form, username: clean, tiktok_url: tiktok, instagram_url: insta };
      setForm(saved);
      initialRef.current = JSON.stringify(saved);
      qc.invalidateQueries({ queryKey: ["my-interests"] });
      qc.invalidateQueries({ queryKey: ["feed"] });
    }
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success(t("settings.settingsSaved"));
  }

  const dirty = loaded && JSON.stringify(form) !== initialRef.current;
  const publicUrl = `${SITE_URL.replace(/^https:\/\//, "")}/@${form.username.trim().toLowerCase().replace(/^@/, "") || "…"}`;
  const section = "rounded-[28px] bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6";
  const h2 = "font-display text-xl font-bold";
  const hint = "mt-1 text-[13px] leading-snug text-foreground/60";

  return (
    <main className="mx-auto max-w-2xl px-4 pb-36 pt-4 md:pt-8">
      <div className="mb-5 flex items-center gap-3">
        <Link to="/dashboard" aria-label={t("studio.back")} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface transition-transform active:scale-95">
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </Link>
        <h1 className="font-display text-3xl font-bold">{t("settings.title")}</h1>
      </div>

      <form id="settings-form" onSubmit={onSubmit} className="flex flex-col gap-5">
        {/* EN-TÊTE DU PROFIL : bannière + photo, comme sur la page publique */}
        <section className="overflow-hidden rounded-[28px] bg-surface shadow-[var(--shadow-card)]">
          <div className="relative aspect-[3/1] w-full bg-card">
            {form.banner_image ? (
              <img src={form.banner_image} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-[#6b5240] via-[#8a6a52] to-[#a67c5b]" />
            )}
            <button
              type="button"
              disabled={uploading}
              onClick={() => bannerInputRef.current?.click()}
              className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-surface/90 px-3 py-2 text-[13px] font-semibold backdrop-blur"
            >
              <ImagePlus className="h-3.5 w-3.5" aria-hidden="true" /> {t("settings.chooseBanner")}
            </button>
          </div>
          <div className="flex items-end gap-4 px-5 pb-5">
            <div className="relative -mt-10 shrink-0">
              <span className="block rounded-full bg-surface p-1">
                <span className="block h-20 w-20 overflow-hidden rounded-full bg-card">
                  {form.profile_image ? (
                    <img src={form.profile_image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center font-display text-3xl font-bold text-foreground/60">
                      {form.username[0]?.toUpperCase()}
                    </span>
                  )}
                </span>
              </span>
              <button
                type="button"
                disabled={uploading}
                aria-label={t("settings.choosePicture")}
                onClick={() => avatarInputRef.current?.click()}
                className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-ink text-surface ring-2 ring-surface"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Camera className="h-4 w-4" aria-hidden="true" />}
              </button>
            </div>
            <div className="min-w-0 pb-1">
              <p className="truncate text-lg font-bold">@{form.username || "…"}</p>
              {savedUsername && (
                <Link to="/@{$username}" params={{ username: savedUsername }} className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary">
                  {t("creatorSettings.myPublicPage")} <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              )}
            </div>
          </div>
          <input ref={avatarInputRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) setPending({ kind: "avatar", file: f }); e.target.value = ""; }} />
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
        </section>

        {/* PROFIL */}
        <section className={section}>
          <h2 className={h2}>{t("settings.profileSection")}</h2>
          <div className="mt-4 space-y-4">
            <div>
              <Label htmlFor="u">{t("settings.username")}</Label>
              <div className="mt-1.5 flex items-center rounded-2xl border-[1.5px] border-border bg-background focus-within:border-foreground/50">
                <span className="pl-4 font-semibold text-foreground/50">@</span>
                <input
                  id="u"
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="min-w-0 flex-1 bg-transparent px-1.5 py-3 text-[15px] outline-none"
                />
              </div>
              <p className={hint}>{publicUrl}</p>
            </div>
            <div>
              <Label htmlFor="b">{t("settings.bio")}</Label>
              <Textarea id="b" className="mt-1.5 rounded-2xl border-[1.5px] bg-background text-[15px]" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} placeholder={t("settings.bioPlaceholder")} />
            </div>
          </div>
        </section>

        {/* RÉSEAUX */}
        <section className={section}>
          <h2 className={h2}>{t("settings.socialSection")}</h2>
          <p className={hint}>{t("settings.socialHint")}</p>
          <div className="mt-4 space-y-3">
            <label className="flex items-center gap-3 rounded-2xl border-[1.5px] border-border bg-background px-3 focus-within:border-foreground/50">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink text-surface"><SiTiktok className="h-4 w-4" aria-hidden="true" /></span>
              <span className="sr-only">{t("creatorSettings.tiktok")}</span>
              <input id="tt" type="url" inputMode="url" placeholder="https://www.tiktok.com/@…" value={form.tiktok_url} onChange={(e) => setForm({ ...form, tiktok_url: e.target.value })} className="min-w-0 flex-1 bg-transparent py-3 text-[15px] outline-none" />
            </label>
            <label className="flex items-center gap-3 rounded-2xl border-[1.5px] border-border bg-background px-3 focus-within:border-foreground/50">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink text-surface"><SiInstagram className="h-4 w-4" aria-hidden="true" /></span>
              <span className="sr-only">{t("creatorSettings.instagram")}</span>
              <input id="ig" type="url" inputMode="url" placeholder="https://www.instagram.com/…" value={form.instagram_url} onChange={(e) => setForm({ ...form, instagram_url: e.target.value })} className="min-w-0 flex-1 bg-transparent py-3 text-[15px] outline-none" />
            </label>
          </div>
        </section>

        {/* STYLES */}
        <section className={section}>
          <h2 className={h2}>{t("creatorSettings.stylesTitle")}</h2>
          <p className={`${hint} mb-3`}>{t("creatorSettings.stylesHint")}</p>
          <StylePicker value={form.styles} max={MAX_STYLES} onMax={() => toast(t("creatorSettings.maxStyles"))} onChange={(styles) => setForm({ ...form, styles })} />
        </section>

        {/* STYLES PRÉFÉRÉS (fil « Pour toi ») */}
        <section className={section}>
          <h2 className={h2}>{t("engage.interestsEdit")}</h2>
          <p className={`${hint} mb-3`}>{t("engage.interestsText")}</p>
          <StylePicker value={form.interests} max={MAX_STYLES} onMax={() => toast(t("creatorSettings.maxStyles"))} onChange={(interests) => setForm({ ...form, interests })} />
        </section>

        {/* COMPTE */}
        <section className={section}>
          <h2 className={h2}>{t("settings.accountSection")}</h2>
          {user?.email && (
            <p className="mt-3 flex items-center gap-2 text-[15px]">
              <Mail className="h-4 w-4 text-foreground/50" aria-hidden="true" /> <span className="min-w-0 truncate">{user.email}</span>
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={async () => {
                await supabase.auth.signOut();
                navigate({ to: "/" });
              }}
              className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-border px-4 py-2.5 text-sm font-semibold"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" /> {t("nav.logout")}
            </button>
            <button
              type="button"
              disabled={exporting}
              onClick={downloadMyData}
              className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-border px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
            >
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Download className="h-4 w-4" aria-hidden="true" />}
              {t("settings.exportData")}
            </button>
          </div>
          <div className="mt-6 border-t border-border/70 pt-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button type="button" className="text-sm font-semibold text-destructive underline underline-offset-4">
                  {t("settings.deleteAccount")}
                </button>
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
        </section>
      </form>

      {/* Barre d'enregistrement : apparaît dès qu'on modifie quelque chose */}
      {dirty && (
        <div className="fade-up fixed inset-x-0 bottom-0 z-40 bg-gradient-to-t from-background from-70% to-transparent px-4 pb-[calc(14px+env(safe-area-inset-bottom,0px))] pt-6">
          <div className="mx-auto flex max-w-2xl gap-2">
            <button
              type="button"
              onClick={() => setForm(JSON.parse(initialRef.current))}
              className="h-14 rounded-full border-[1.5px] border-border bg-surface px-5 font-semibold"
            >
              {t("dashboard.cancel")}
            </button>
            <button
              type="submit"
              form="settings-form"
              disabled={loading}
              className="flex h-14 flex-1 items-center justify-center gap-2 rounded-full bg-primary text-base font-bold text-primary-foreground disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {loading ? t("settings.saving") : t("settings.save")}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
