import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { useFollowedIds } from "@/lib/social";
import { fetchFollowCounts, fetchFollowers, fetchFollowing, fetchSuggestions, type CreatorCard } from "@/lib/public-data";
import type { StyleKey } from "@/lib/styles";
import { Avatar } from "./OutfitCard";
import { FollowButton } from "./FollowButton";
import { CreatorRow } from "./CreatorCard";

type ListKind = "followers" | "following";

function Stat({ value, label, onClick }: { value: number; label: string; onClick?: () => void }) {
  const inner = (
    <>
      <span className="block text-lg font-bold leading-tight text-foreground">{value}</span>
      <span className="block text-[13px] text-foreground/65">{label}</span>
    </>
  );
  return onClick ? (
    <button type="button" onClick={onClick} className="min-w-[84px] rounded-2xl px-3 py-1.5 text-center transition-colors hover:bg-surface">
      {inner}
    </button>
  ) : (
    <div className="min-w-[84px] px-3 py-1.5 text-center">{inner}</div>
  );
}

function PersonRow({ person }: { person: CreatorCard }) {
  return (
    <li className="flex items-center gap-3 py-2">
      <Link to="/@{$username}" params={{ username: person.username }} className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar src={person.profile_image} name={person.username} className="h-11 w-11" />
        <span className="min-w-0">
          <span className="block truncate font-semibold">@{person.username}</span>
          {person.bio && <span className="block truncate text-xs text-foreground/60">{person.bio}</span>}
        </span>
      </Link>
      <FollowButton creatorId={person.id} className="h-9 px-4" />
    </li>
  );
}

/** Chiffres « tenues · abonnés · abonnements » + listes, comme sur Instagram. */
export function ProfileStats({ creatorId, outfitCount }: { creatorId: string; outfitCount: number }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState<ListKind | null>(null);

  const counts = useQuery({ queryKey: ["follow-counts", creatorId], queryFn: () => fetchFollowCounts(creatorId) });
  const list = useQuery({
    queryKey: ["follow-list", creatorId, open],
    enabled: !!open,
    queryFn: () => (open === "followers" ? fetchFollowers(creatorId) : fetchFollowing(creatorId)),
    // Liste figée tant que la fenêtre est ouverte, oubliée dès qu'elle se ferme
    staleTime: Infinity,
    gcTime: 0,
    refetchOnWindowFocus: false,
  });

  const followers = counts.data?.followers ?? 0;
  const following = counts.data?.following ?? 0;

  return (
    <>
      <div className="mt-4 flex justify-center gap-1">
        <Stat value={outfitCount} label={outfitCount > 1 ? t("social.outfits") : t("social.outfit")} />
        <Stat value={followers} label={followers > 1 ? t("social.followers") : t("social.follower")} onClick={() => setOpen("followers")} />
        <Stat value={following} label={t("social.following")} onClick={() => setOpen("following")} />
      </div>

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="w-[calc(100vw-24px)] max-w-md grid-cols-1 rounded-3xl border-border bg-surface p-5 [&>*]:min-w-0">
          <div className="flex gap-1.5 rounded-full bg-background/60 p-1" role="tablist">
            {(["followers", "following"] as const).map((k) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={open === k}
                onClick={() => setOpen(k)}
                className={`flex-1 rounded-full py-2 text-sm font-semibold ${open === k ? "bg-ink text-surface" : "text-foreground/70"}`}
              >
                {k === "followers" ? `${t("social.followersTitle")} · ${followers}` : `${t("social.followingTitle")} · ${following}`}
              </button>
            ))}
          </div>
          <DialogTitle className="sr-only">{open === "followers" ? t("social.followersTitle") : t("social.followingTitle")}</DialogTitle>
          <DialogDescription className="sr-only">@</DialogDescription>
          <div className="max-h-[60vh] overflow-y-auto">
            {list.isLoading ? (
              <p className="py-6 text-center text-sm text-foreground/60">…</p>
            ) : list.data && list.data.length ? (
              <ul className="divide-y divide-border/60">
                {list.data.map((p) => (
                  <PersonRow key={p.id} person={p} />
                ))}
              </ul>
            ) : (
              <p className="py-6 text-center text-sm text-foreground/60">
                {open === "followers" ? t("social.noFollowers") : t("social.noFollowing")}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** « Suggestions pour toi » : créateurs aux styles proches que l'on ne suit pas encore. */
export function FollowSuggestions({ creatorId, styles }: { creatorId: string; styles: StyleKey[] }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: followed } = useFollowedIds();
  const exclude = [creatorId, ...(user ? [user.id] : []), ...(followed ?? [])];
  const { data } = useQuery({
    queryKey: ["suggestions", creatorId, user?.id, exclude.length],
    enabled: !!user && !!followed,
    queryFn: () => fetchSuggestions({ styles, exclude, limit: 10 }),
  });
  if (!user || !data || data.length === 0) return null;
  return (
    <section className="mt-10 px-4 md:px-0">
      <h2 className="font-display mb-4 text-2xl font-bold">{t("social.suggestions")}</h2>
      <CreatorRow creators={data} />
    </section>
  );
}
