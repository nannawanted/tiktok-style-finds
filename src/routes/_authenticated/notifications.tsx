import { useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart, ShieldAlert, Shirt, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation, type TKey } from "@/lib/i18n";

const REASONS: Record<string, TKey> = {
  broken_link: "report.brokenLink",
  scam: "report.scam",
  shocking: "report.shocking",
  stolen_photo: "report.stolen",
};
import { REPORT_ALERT_THRESHOLD, quotaNearlyUsed, useImageQuota, useMarkModerationNoticesRead, useMarkNotificationsRead, useModerationNotices, useModerationQueue, useNotifications } from "@/lib/social";
import { Avatar } from "@/components/vitrine/OutfitCard";
import { FollowButton } from "@/components/vitrine/FollowButton";
import { EmptyBox } from "@/components/vitrine/EmptyBox";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({ meta: [{ title: "Notifications | WantedFashion" }, { name: "robots", content: "noindex" }] }),
  component: NotificationsPage,
});

function timeAgo(iso: string, lang: string) {
  const s = Math.max(1, Math.round((Date.now() - Date.parse(iso)) / 1000));
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: "auto", style: "short" });
  if (s < 3600) return rtf.format(-Math.max(1, Math.round(s / 60)), "minute");
  if (s < 86400) return rtf.format(-Math.round(s / 3600), "hour");
  return rtf.format(-Math.round(s / 86400), "day");
}

function NotificationsPage() {
  const { t, lang } = useTranslation();
  const { data: notifications, isLoading } = useNotifications();
  const markRead = useMarkNotificationsRead();
  const { data: notices } = useModerationNotices();
  const markNoticesRead = useMarkModerationNoticesRead();
  const unreadNotices = notices?.some((n) => !n.read_at);
  useEffect(() => {
    if (unreadNotices) markNoticesRead.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unreadNotices]);

  // Les notifications sont marquées comme lues en ouvrant la page
  const hasUnread = !!notifications?.some((n) => !n.read_at);
  useEffect(() => {
    if (hasUnread) markRead.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasUnread]);

  // Noms des personnes et tenues mentionnées
  const actorIds = [...new Set((notifications ?? []).map((n) => n.actor_id).filter((x): x is string => !!x))];
  const postIds = [...new Set((notifications ?? []).map((n) => n.post_id).filter((x): x is string => !!x))];
  const { data: extra } = useQuery({
    queryKey: ["notif-extra", actorIds.join(","), postIds.join(",")],
    enabled: actorIds.length + postIds.length > 0,
    queryFn: async () => {
      const [actors, posts] = await Promise.all([
        actorIds.length ? supabase.from("creators_public").select("id, username, profile_image").in("id", actorIds) : Promise.resolve({ data: [] }),
        postIds.length ? supabase.from("posts").select("id, title, cover_image").in("id", postIds) : Promise.resolve({ data: [] }),
      ]);
      return {
        actors: new Map((actors.data ?? []).map((a) => [a.id as string, a])),
        posts: new Map((posts.data ?? []).map((p) => [p.id as string, p])),
      };
    },
  });

  const { data: alerts } = useModerationQueue(REPORT_ALERT_THRESHOLD);
  const { data: quota } = useImageQuota();
  return (
    <main className="mx-auto max-w-2xl px-4 pt-6 md:pt-10">
      <h1 className="font-display fade-up mb-6 text-4xl font-bold">{t("engage.notifications")}</h1>
      {/* Messages de la modération (look supprimé, compte bloqué / débloqué) */}
      {notices && notices.length > 0 && (
        <ul className="mb-5 space-y-2">
          {notices.slice(0, 5).map((n) => (
            <li key={n.id} className={`flex gap-3 rounded-3xl p-4 ${n.kind === "account_unblocked" ? "bg-emerald-600/10" : "bg-destructive/10"}`}>
              <ShieldAlert className={`mt-0.5 h-5 w-5 shrink-0 ${n.kind === "account_unblocked" ? "text-emerald-700" : "text-destructive"}`} aria-hidden="true" />
              <div className="min-w-0 text-sm leading-relaxed">
                {n.kind === "post_removed" ? (
                  <>
                    <p className="font-semibold">{t("moderation.noticeRemoved").replace("{title}", n.data?.title ?? "")}</p>
                    {!!n.data?.reasons?.length && (
                      <p className="text-foreground/70">
                        {t("moderation.noticeReasons")} {n.data.reasons.map((r) => (REASONS[r] ? t(REASONS[r]) : r)).join(", ")}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="font-semibold">{n.kind === "account_blocked" ? t("moderation.noticeBlocked") : t("moderation.noticeUnblocked")}</p>
                )}
                <p className="mt-0.5 text-xs text-foreground/50">{new Date(n.created_at).toLocaleDateString("fr-BE")}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
      {/* Admin : alerte de modération (look signalé 3 fois ou plus) */}
      {alerts && alerts.length > 0 && (
        <Link to="/dashboard/moderation" className="mb-5 flex items-center gap-3 rounded-3xl bg-primary/10 p-4 ring-2 ring-primary/40">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <ShieldAlert className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-bold">{alerts.length} {t("moderation.alert")}</span>
            <span className="block text-sm text-foreground/65">{t("moderation.alertCta")} →</span>
          </span>
        </Link>
      )}
      {/* Admin : vérifications de photos bientôt épuisées (formule gratuite Sightengine) */}
      {quota && quotaNearlyUsed(quota) && (
        <div className="mb-5 flex items-center gap-3 rounded-3xl bg-amber-500/15 p-4 ring-2 ring-amber-500/40">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white">
            <ShieldAlert className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1 text-sm">
            <span className="block font-bold">{t("imageCheck.quotaTitle")}</span>
            <span className="block text-foreground/70">
              {t("imageCheck.quotaText").replace("{month}", `${quota.month_used}/${quota.month_limit}`).replace("{day}", `${quota.day_used}/${quota.day_limit}`)}
            </span>
          </span>
        </div>
      )}
      {/* Admin : looks dont la photo n'a pas pu être vérifiée */}
      {!!quota?.unverified_open && (
        <Link to="/dashboard/moderation" className="mb-5 flex items-center gap-3 rounded-3xl bg-surface p-4 ring-2 ring-border">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink text-surface">
            <ShieldAlert className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-bold">{quota.unverified_open} {t("imageCheck.unverifiedAlert")}</span>
            <span className="block text-sm text-foreground/65">{t("moderation.alertCta")} →</span>
          </span>
        </Link>
      )}
      {isLoading ? (
        <p className="text-foreground/60">…</p>
      ) : !notifications?.length ? (
        <EmptyBox text={t("engage.noNotifications")} action={{ to: "/explorer", label: t("nav2.explore") }} />
      ) : (
        <ul className="divide-y divide-border/60 rounded-3xl bg-surface px-4">
          {notifications.map((n) => {
            const actor = n.actor_id ? extra?.actors.get(n.actor_id) : undefined;
            const post = n.post_id ? extra?.posts.get(n.post_id) : undefined;
            const name = actor?.username ? `@${actor.username}` : t("engage.someone");
            const Icon = n.type === "new_follower" ? UserPlus : n.type === "new_post" ? Shirt : Heart;
            const text =
              n.type === "new_follower"
                ? `${name} ${t("engage.notifNewFollower")}`
                : n.type === "new_post"
                  ? `${name} ${t("engage.notifNewPost")}`
                  : n.count === 1
                    ? t("engage.notifMilestoneOne")
                    : `${t("engage.notifMilestone")} ${n.count} ${t("engage.notifMilestoneSuffix")}`;
            return (
              <li key={n.id} className={`flex items-center gap-3 py-3.5 ${n.read_at ? "" : "font-semibold"}`}>
                <span className="relative shrink-0">
                  {actor ? (
                    <Avatar src={actor.profile_image ?? null} name={actor.username ?? "?"} className="h-11 w-11" />
                  ) : (
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
                      <Heart className="h-5 w-5 fill-current text-primary" aria-hidden="true" />
                    </span>
                  )}
                  <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-surface">
                    <Icon className="h-3 w-3" aria-hidden="true" />
                  </span>
                </span>
                <div className="min-w-0 flex-1">
                  {n.type === "new_follower" && actor?.username ? (
                    <Link to="/@{$username}" params={{ username: actor.username }} className="block text-[15px] leading-snug hover:underline">
                      {text}
                    </Link>
                  ) : n.post_id ? (
                    <Link to="/post/$id" params={{ id: n.post_id }} className="block text-[15px] leading-snug hover:underline">
                      {text}
                      {post?.title && <span className="font-normal text-foreground/70"> · {post.title}</span>}
                    </Link>
                  ) : (
                    <p className="text-[15px] leading-snug">{text}</p>
                  )}
                  <p className="mt-0.5 text-xs font-normal text-foreground/55">
                    {timeAgo(n.created_at, lang)}
                    {!n.read_at && <span className="ml-2 inline-block h-2 w-2 rounded-full bg-primary align-middle" aria-hidden="true" />}
                  </p>
                </div>
                {n.type === "new_follower" && n.actor_id ? (
                  <FollowButton creatorId={n.actor_id} className="h-9 px-4" />
                ) : post?.cover_image && n.post_id ? (
                  <Link to="/post/$id" params={{ id: n.post_id }} className="h-14 w-11 shrink-0 overflow-hidden rounded-lg bg-card">
                    <img src={post.cover_image} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                  </Link>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
