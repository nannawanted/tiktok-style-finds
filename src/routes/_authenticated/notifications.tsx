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
  underage: "report.underage",
  off_topic: "report.offTopic",
};
import { REPORT_ALERT_THRESHOLD, quotaNearlyUsed, useCopyrightQueue, useDeleteNotification, useHideModerationNotice, useImageQuota, useMarkModerationNoticesRead, useMarkNotificationsRead, useModerationNotices, useModerationQueue, useNotifications } from "@/lib/social";
import { SwipeToDelete } from "@/components/vitrine/SwipeToDelete";
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
  const deleteNotif = useDeleteNotification();
  const hideNotice = useHideModerationNotice();
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
  const { data: copyright } = useCopyrightQueue();
  return (
    <main className="mx-auto max-w-2xl px-4 pt-6 md:pt-10">
      <h1 className="font-display fade-up mb-6 text-4xl font-bold">{t("engage.notifications")}</h1>
      {/* Messages de la modération (look supprimé, compte bloqué / débloqué) */}
      {notices && notices.length > 0 && (
        <ul className="mb-5 space-y-2">
          {notices.slice(0, 5).map((n) => (
            <li key={n.id}>
              <SwipeToDelete className="rounded-3xl" rowClassName="bg-background" onDelete={() => hideNotice.mutate(n.id)}>
              <div className={`flex gap-3 rounded-3xl p-4 ${n.kind === "account_unblocked" ? "bg-emerald-600/10" : n.kind === "terms_updated" ? "bg-surface" : "bg-destructive/10"}`}>
              <ShieldAlert className={`mt-0.5 h-5 w-5 shrink-0 ${n.kind === "account_unblocked" ? "text-emerald-700" : n.kind === "terms_updated" ? "text-foreground/70" : "text-destructive"}`} aria-hidden="true" />
              <div className="min-w-0 text-sm leading-relaxed">
                {/* Chaque avis contient les éléments de l'art. 17 §3 du DSA : mesure et portée, faits, base, décision humaine, recours */}
                {n.kind === "copyright_removed" ? (
                  <>
                    <p className="font-semibold">{t("copyright.noticeRemoved").replace("{title}", n.data?.title ?? "")}</p>
                    <p className="text-foreground/70">
                      {t((n.data as { type?: string } | null)?.type === "trademark" ? "copyright.tmNoticeWhy" : "copyright.noticeWhy")
                        .replace("{ref}", n.data?.ref ?? "")
                        .replace("{work}", (n.data as { work?: string } | null)?.work ?? "")}
                    </p>
                    {n.data?.note && <p className="text-foreground/70">« {n.data.note} »</p>}
                    <p className="text-foreground/70">
                      {t((n.data as { type?: string } | null)?.type === "trademark" ? "copyright.tmNoticeBasis" : "copyright.noticeBasis")}
                    </p>
                    <p className="text-foreground/70">{t("copyright.noticeStrikes").replace("{n}", String(n.data?.strikes ?? 1))}</p>
                    <Redress />
                  </>
                ) : n.kind === "illegal_removed" ? (
                  <>
                    <p className="font-semibold">{t("copyright.noticeRemoved").replace("{title}", n.data?.title ?? "")}</p>
                    <p className="text-foreground/70">
                      {t("copyright.illegalNoticeWhy")
                        .replace("{ref}", n.data?.ref ?? "")
                        .replace("{category}", t(`copyright.cat_${(n.data as { category?: string } | null)?.category ?? "other"}` as TKey).toLowerCase())}
                    </p>
                    {n.data?.note && <p className="text-foreground/70">« {n.data.note} »</p>}
                    <p className="text-foreground/70">{t("copyright.illegalNoticeBasis")}</p>
                    <Redress />
                  </>
                ) : n.kind === "account_blocked" && n.data?.reason === "copyright" ? (
                  <>
                    <p className="font-semibold">{t("copyright.noticeBlocked")}</p>
                    <p className="text-foreground/70">{t("copyright.noticeBlockedBasis")}</p>
                    <Redress />
                  </>
                ) : n.kind === "post_removed" ? (
                  <>
                    <p className="font-semibold">{t("moderation.noticeRemoved").replace("{title}", n.data?.title ?? "")}</p>
                    {!!n.data?.reasons?.length && (
                      <p className="text-foreground/70">
                        {t("moderation.noticeReasons")} {n.data.reasons.map((r) => (REASONS[r] ? t(REASONS[r]) : r)).join(", ")}
                      </p>
                    )}
                    <p className="text-foreground/70">{t("moderation.noticeBasis")}</p>
                    <Redress />
                  </>
                ) : n.kind === "account_blocked" ? (
                  <>
                    <p className="font-semibold">{t("moderation.noticeBlocked")}</p>
                    <p className="text-foreground/70">{t("moderation.noticeBasis")}</p>
                    <Redress />
                  </>
                ) : n.kind === "image_removed" ? (
                  <>
                    <p className="font-semibold">
                      {t("moderation.imageRemoved").replace("{what}", n.data?.bucket === "banners" ? t("moderation.imageBanner") : t("moderation.imageAvatar"))}
                    </p>
                    <p className="text-foreground/70">{t("moderation.noticeBasis")}</p>
                    <Redress />
                  </>
                ) : n.kind === "terms_updated" ? (
                  <>
                    <p className="font-semibold">{t("moderation.termsUpdated").replace(
                        "{date}",
                        n.data?.date ? new Date(`${n.data.date}T12:00:00`).toLocaleDateString(lang === "en" ? "en-GB" : "fr-BE", { day: "numeric", month: "long", year: "numeric" }) : "",
                      )}</p>
                    <p className="flex flex-wrap gap-x-4">
                      <Link to="/conditions" className="font-semibold text-primary underline">
                        {t("moderation.termsRead")}
                      </Link>
                      <Link to="/confidentialite" className="font-semibold text-primary underline">
                        {t("moderation.privacyRead")}
                      </Link>
                      <Link to="/legal" className="font-semibold text-primary underline">
                        {t("legal.hub")}
                      </Link>
                    </p>
                  </>
                ) : (
                  <p className="font-semibold">{t("moderation.noticeUnblocked")}</p>
                )}
                <p className="mt-0.5 text-xs text-foreground/50">{new Date(n.created_at).toLocaleDateString("fr-BE")}</p>
              </div>
              </div>
              </SwipeToDelete>
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
      {/* Admin : demandes de retrait pour droits d'auteur */}
      {copyright && copyright.length > 0 && (
        <Link to="/dashboard/moderation" hash="droits-auteur" className="mb-5 flex items-center gap-3 rounded-3xl bg-primary/10 p-4 ring-2 ring-primary/40">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <ShieldAlert className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-bold">{copyright.length} {t("copyright.alert")}</span>
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
        <>
        <ul className="divide-y divide-border/60 overflow-hidden rounded-3xl bg-surface">
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
              <li key={n.id}>
                <SwipeToDelete rowClassName={`flex items-center gap-3 bg-surface px-4 py-3.5 ${n.read_at ? "" : "font-semibold"}`} onDelete={() => deleteNotif.mutate(n.id)}>
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
                </SwipeToDelete>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-center text-xs text-foreground/50 [@media(hover:hover)]:hidden">{t("engage.swipeHint")}</p>
        </>
      )}
    </main>
  );
}

/** Décision humaine + voies de recours (art. 17 §3 c et f du règlement (UE) 2022/2065). */
function Redress() {
  const { t } = useTranslation();
  return (
    <>
      <p className="mt-1 text-foreground/70">{t("moderation.redressHuman")}</p>
      <p className="text-foreground/70">{t("moderation.redress")}</p>
    </>
  );
}
