import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/i18n";
import { recordCreatorIp } from "@/lib/record-creator-ip";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { VisualIndexer } from "@/components/vitrine/VisualIndexer";
import { REPORT_ALERT_THRESHOLD, useModerationQueue, useMyAccountStatus, usePinPost } from "@/lib/social";
import { ArrowUpRight, BarChart3, ShieldAlert, ExternalLink, Eye, Heart, Link2, MoreHorizontal, MousePointerClick, Pencil, Pin, PinOff, Plus, Settings, Shirt, Trash2 } from "lucide-react";
import { Avatar } from "@/components/vitrine/OutfitCard";
import { absoluteUrl, outfitPath, profilePath } from "@/lib/site";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  head: () => ({ meta: [{ title: "Dashboard — Wanted Fashion" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [toDelete, setToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    supabase.auth.getSession().then(({ data: sessionData }) => {
      const accessToken = sessionData.session?.access_token;
      if (accessToken) recordCreatorIp({ data: { accessToken } });
    });
  }, [user?.id]);

  const { data, isLoading } = useQuery({
    queryKey: ["my-posts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("id, title, cover_image, created_at, views, pinned_at, products(id)")
        .eq("creator_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const postIds = (data ?? []).map((p) => p.id);
  const { data: clickCounts } = useQuery({
    queryKey: ["my-posts-clicks", postIds.join(",")],
    enabled: postIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.from("clicks").select("post_id").in("post_id", postIds);
      if (error) throw error;
      const counts: Record<string, number> = {};
      for (const row of data ?? []) {
        if (!row.post_id) continue;
        counts[row.post_id] = (counts[row.post_id] ?? 0) + 1;
      }
      return counts;
    },
  });

  const { data: likeCounts } = useQuery({
    queryKey: ["my-posts-likes", postIds.join(",")],
    enabled: postIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase.rpc("post_like_counts", { p_ids: postIds });
      const counts: Record<string, number> = {};
      for (const l of data ?? []) counts[l.post_id] = Number(l.likes);
      return counts;
    },
  });

  const { data: me } = useQuery({
    queryKey: ["my-profile-mini", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("creators").select("username, profile_image").eq("id", user!.id).maybeSingle();
      return data ?? null;
    },
  });
  const myUsername = me?.username ?? null;
  const { data: modQueue } = useModerationQueue(REPORT_ALERT_THRESHOLD);
  const { data: accountStatus } = useMyAccountStatus();
  const { data: isAdminUser } = useQuery({
    queryKey: ["is-admin", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("creators").select("is_admin").eq("id", user!.id).maybeSingle();
      return !!(data as { is_admin?: boolean } | null)?.is_admin;
    },
  });

  const pin = usePinPost();
  function togglePin(id: string, pinned: boolean) {
    pin.mutate(
      { postId: id, pinned },
      {
        onSuccess: (r) => {
          if (r === "max_pins") toast(t("profile.maxPins"));
          else toast.success(pinned ? t("profile.pinned") : t("profile.unpin"));
        },
        onError: () => toast.error(t("newPost.genericError")),
      },
    );
  }

  const del = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("products").delete().eq("post_id", id);
      const { error } = await supabase.from("posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("dashboard.postDeleted"));
      qc.invalidateQueries({ queryKey: ["my-posts"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Looks épinglés tout en haut de la liste (comme Instagram)
  const posts = [...(data ?? [])].sort((a, b) => (b.pinned_at ?? "").localeCompare(a.pinned_at ?? ""));
  const totals = {
    looks: posts.length,
    views: posts.reduce((n, p) => n + (p.views ?? 0), 0),
    clicks: posts.reduce((n, p) => n + (clickCounts?.[p.id] ?? 0), 0),
    likes: posts.reduce((n, p) => n + (likeCounts?.[p.id] ?? 0), 0),
  };
  const profileUrl = myUsername ? absoluteUrl(profilePath(myUsername)) : "";
  const fmt = (n: number) => new Intl.NumberFormat("fr-BE", { notation: "compact", maximumFractionDigits: 1 }).format(n);

  async function copy(text: string, ok: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(ok);
    } catch {
      toast(text);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 pb-8 pt-4 md:pt-8">
      {/* EN-TÊTE : profil + raccourcis */}
      <header className="flex items-center gap-3">
        <span className="shrink-0 rounded-full p-[2px] ring-2 ring-primary">
          <Avatar src={me?.profile_image ?? null} name={myUsername ?? "?"} className="h-12 w-12" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="font-display truncate text-2xl font-bold leading-none sm:text-3xl">{t("dashboard.myPosts")}</h1>
          {myUsername && <p className="mt-1 truncate text-sm text-foreground/60">@{myUsername}</p>}
        </div>
        {isAdminUser && (
          <Link to="/dashboard/moderation" aria-label={t("moderation.title")} className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface transition-transform active:scale-95">
            <ShieldAlert className="h-5 w-5" aria-hidden="true" />
            {(modQueue?.length ?? 0) > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground">
                {modQueue?.length}
              </span>
            )}
          </Link>
        )}
        <Link to="/dashboard/stats-marques" aria-label={t("brandStats.title")} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface transition-transform active:scale-95">
          <BarChart3 className="h-5 w-5" aria-hidden="true" />
        </Link>
        <Link to="/dashboard/settings" aria-label={t("dashboard.settings")} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface transition-transform active:scale-95">
          <Settings className="h-5 w-5" aria-hidden="true" />
        </Link>
      </header>

      {accountStatus?.blocked && (
        <p className="mt-4 rounded-3xl bg-destructive/10 p-4 text-sm font-semibold leading-relaxed text-destructive">{t("moderation.blockedBanner")}</p>
      )}

      {/* CHIFFRES */}
      <dl className="mt-5 grid grid-cols-4 gap-2">
        {[
          { k: "looks", label: t("dashboard.statLooks"), icon: Shirt },
          { k: "views", label: t("dashboard.statViews"), icon: Eye },
          { k: "clicks", label: t("dashboard.statClicks"), icon: MousePointerClick },
          { k: "likes", label: t("dashboard.statLikes"), icon: Heart },
        ].map(({ k, label, icon: Icon }) => (
          <div key={k} className="rounded-2xl bg-surface px-2 py-3 text-center">
            <dd className="text-xl font-bold tabular-nums leading-tight">{fmt(totals[k as keyof typeof totals])}</dd>
            <dt className="mt-0.5 flex items-center justify-center gap-1 text-[11px] font-semibold text-foreground/60">
              <Icon className="h-3 w-3" aria-hidden="true" /> {label}
            </dt>
          </div>
        ))}
      </dl>

      {/* ACTIONS PRINCIPALES */}
      <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
        <Link to="/dashboard/post/new" className="flex h-14 items-center justify-center gap-2 rounded-full bg-primary text-base font-bold text-primary-foreground transition-transform active:scale-[.98]">
          <Plus className="h-5 w-5" aria-hidden="true" /> {t("dashboard.newLook")}
        </Link>
        {myUsername && (
          <div className="flex items-center gap-2 rounded-full bg-surface py-1.5 pl-4 pr-1.5">
            <span className="min-w-0 flex-1 truncate text-sm font-semibold">{profileUrl.replace(/^https:\/\//, "")}</span>
            <button type="button" onClick={() => copy(profileUrl, t("studio.copied"))} className="shrink-0 rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-surface">
              {t("dashboard.copyBioLink")}
            </button>
          </div>
        )}
      </div>

      <div className="mt-6">
        <VisualIndexer />
      </div>

      {/* LOOKS */}
      <div className="mt-2 flex items-baseline justify-between">
        <h2 className="font-display text-2xl font-bold">{t("dashboard.myLooks")}</h2>
        {myUsername && (
          <Link to="/@{$username}" params={{ username: myUsername }} className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
            {t("creatorSettings.myPublicPage")} <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="aspect-[3/4] w-full rounded-2xl" />)}
        </div>
      ) : posts.length === 0 ? (
        <div className="mt-4 flex flex-col items-center gap-3 rounded-[28px] border-[1.5px] border-dashed border-border px-6 py-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface"><Shirt className="h-6 w-6" aria-hidden="true" /></span>
          <p className="font-display text-2xl font-bold">{t("dashboard.emptyTitle")}</p>
          <Link to="/dashboard/post/new" className="mt-2 inline-flex h-12 items-center gap-2 rounded-full bg-ink px-6 font-bold text-surface">
            <Plus className="h-4 w-4" aria-hidden="true" /> {t("dashboard.createFirstPost")}
          </Link>
        </div>
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {posts.map((p, i) => {
            const pieces = p.products?.length ?? 0;
            return (
              <li key={p.id} className="fade-up flex flex-col" style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}>
                <Link to="/dashboard/post/$id/edit" params={{ id: p.id }} className="group relative block aspect-[3/4] overflow-hidden rounded-2xl bg-card">
                  {p.cover_image && <img src={p.cover_image} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />}
                  <span className="absolute left-2 top-2 rounded-full bg-surface/95 px-2.5 py-1 text-[11px] font-bold">
                    {pieces} {pieces > 1 ? t("card.pieces") : t("card.piece")}
                  </span>
                  {p.pinned_at && (
                    <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-ink text-surface" aria-label={t("profile.pinned")}>
                      <Pin className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                  )}
                  <span className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-gradient-to-t from-black/60 to-transparent px-2.5 pb-2 pt-8 text-[12px] font-semibold text-white">
                    <span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" aria-hidden="true" />{fmt(p.views ?? 0)}</span>
                    <span className="inline-flex items-center gap-1"><MousePointerClick className="h-3.5 w-3.5" aria-hidden="true" />{fmt(clickCounts?.[p.id] ?? 0)}</span>
                    <span className="inline-flex items-center gap-1"><Heart className="h-3.5 w-3.5" aria-hidden="true" />{fmt(likeCounts?.[p.id] ?? 0)}</span>
                  </span>
                </Link>
                <h3 className="mt-2 line-clamp-1 px-0.5 text-[15px] font-semibold">{p.title}</h3>
                <div className="mt-1.5 flex gap-1.5">
                  <Link to="/dashboard/post/$id/edit" params={{ id: p.id }} className="flex h-10 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full bg-ink px-3 text-[13px] font-semibold text-surface">
                    <Pencil className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span className="truncate">{t("dashboard.edit")}</span>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button type="button" aria-label={t("dashboard.more")} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface">
                        <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52 rounded-2xl border-border bg-surface p-1.5">
                      <DropdownMenuItem asChild className="rounded-xl py-2.5">
                        <Link to="/post/$id" params={{ id: p.id }}>
                          <ExternalLink className="h-4 w-4" aria-hidden="true" /> {t("dashboard.preview")}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="rounded-xl py-2.5" onSelect={() => togglePin(p.id, !p.pinned_at)}>
                        {p.pinned_at ? <PinOff className="h-4 w-4" aria-hidden="true" /> : <Pin className="h-4 w-4" aria-hidden="true" />}
                        {p.pinned_at ? t("profile.unpin") : t("profile.pin")}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="rounded-xl py-2.5" onSelect={() => copy(absoluteUrl(outfitPath(p.id)), t("dashboard.urlCopied"))}>
                        <Link2 className="h-4 w-4" aria-hidden="true" /> {t("dashboard.copyUrl")}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="rounded-xl py-2.5 text-destructive focus:text-destructive" onSelect={() => setToDelete(p.id)}>
                        <Trash2 className="h-4 w-4" aria-hidden="true" /> {t("dashboard.delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dashboard.deletePostTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("dashboard.deletePostDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("dashboard.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (toDelete) del.mutate(toDelete);
                setToDelete(null);
              }}
            >
              {t("dashboard.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
