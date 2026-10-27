import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { useFollowedIds, useLikedStyles, useMyInterests } from "@/lib/social";
import { fetchFeedPage, type FeedKind, type OutfitCard } from "@/lib/public-data";
import type { StyleKey } from "@/lib/styles";
import { StyleChips } from "./StyleChips";
import { EmptyBox } from "./EmptyBox";
import { InfiniteOutfitFeed } from "./InfiniteOutfitFeed";

/**
 * Fil de tenues avec onglets (Pour toi / Tendances / Récent / Abonnements)
 * puis filtres de style, et défilement sans fin. Utilisé sur l'accueil et Explorer.
 */
export function FeedSection({
  title,
  titleAs = "h2",
  tab: tabParam,
  style,
  onChange,
  firstPage,
  scope,
}: {
  title: string;
  titleAs?: "h1" | "h2";
  tab?: FeedKind;
  style?: StyleKey;
  onChange: (next: { tab?: FeedKind; style?: StyleKey }) => void;
  firstPage?: OutfitCard[];
  scope: string;
}) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: followedIds } = useFollowedIds();
  const { data: interests } = useMyInterests();
  const { data: likedStyles } = useLikedStyles();

  // Connecté : « Pour toi » par défaut. Visiteur : « Tendances ».
  const tab: FeedKind = tabParam ?? (user ? "foryou" : "trending");
  const tabs: { key: FeedKind; label: string }[] = [
    ...(user ? [{ key: "foryou" as FeedKind, label: t("engage.forYou") }] : []),
    { key: "trending", label: t("home2.trending") },
    { key: "latest", label: t("home2.latest") },
    { key: "following", label: t("home2.following") },
  ];

  const followed = [...(followedIds ?? [])];
  const signals = { interests: interests ?? [], followedIds: followed, likedStyles: likedStyles ?? {} };
  const signalsKey = `${signals.interests.join(",")}|${followed.length}|${Object.values(signals.likedStyles).join(",")}`;
  const Title = titleAs;

  return (
    <section id="tenues" className="mx-auto max-w-7xl scroll-mt-28 px-4 md:px-6">
      <Title className="font-display text-3xl font-bold md:text-4xl">{title}</Title>

      <div className="sticky top-[var(--sticky-top,118px)] z-30 -mx-4 mt-3 bg-background/90 px-4 py-2.5 backdrop-blur-md transition-[top] duration-300 md:-mx-6 md:px-6">
        <div className="no-scrollbar -mx-4 flex overflow-x-auto px-4">
          <div className="flex shrink-0 gap-1 rounded-full bg-surface p-1" role="tablist">
            {tabs.map((tb) => (
              <button
                key={tb.key}
                type="button"
                role="tab"
                aria-selected={tab === tb.key}
                onClick={() => onChange({ tab: tb.key })}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  tab === tb.key ? "bg-ink text-surface" : "text-foreground/75 hover:text-foreground"
                }`}
              >
                {tb.label}
              </button>
            ))}
          </div>
        </div>
        <StyleChips className="mt-2" value={style ?? null} onChange={(s) => onChange({ style: s ?? undefined })} />
      </div>

      <div className="mt-5">
        {tab === "following" && !user ? (
          <EmptyBox text={t("home2.loginToFollow")} action={{ to: "/login", label: t("nav2.login") }} />
        ) : (
          <>
            {tab === "foryou" && user && interests && interests.length === 0 && (
              <Link
                to="/dashboard/settings"
                className="mb-5 flex items-center gap-3 rounded-2xl border border-dashed border-border bg-surface/60 px-4 py-3 text-sm font-semibold hover:bg-surface"
              >
                <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" /> {t("engage.personalize")} →
              </Link>
            )}
            <InfiniteOutfitFeed
              key={`${scope}-${tab}-${style ?? "all"}`}
              queryKey={[scope, tab, style ?? null, tab === "foryou" ? signalsKey : "", tab === "following" ? followed.join(",") : ""]}
              fetchPage={(page) => fetchFeedPage({ kind: tab, style, page, creatorIds: followed, signals })}
              initial={tab === "trending" ? firstPage : undefined}
              empty={<EmptyBox text={tab === "following" ? t("home2.followingEmpty") : style ? t("home2.noResult") : t("home2.empty")} />}
            />
          </>
        )}
      </div>
    </section>
  );
}
