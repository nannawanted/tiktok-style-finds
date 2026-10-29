import { useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { useFollowedIds, useMyFollowerIds } from "@/lib/social";
import { supabase } from "@/integrations/supabase/client";
import { Search } from "lucide-react";
import { fetchCreatorsByIds, fetchFollowCounts, fetchFollowers, fetchFollowing, fetchMutualSuggestions, fetchSuggestions, type CreatorCard } from "@/lib/public-data";
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

function PersonRow({ person, friend, followsYou }: { person: CreatorCard; friend: boolean; followsYou: boolean }) {
  const { t } = useTranslation();
  return (
    <li className="flex items-center gap-3 py-2">
      <Link to="/@{$username}" params={{ username: person.username }} className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar src={person.profile_image} name={person.username} className="h-11 w-11" />
        <span className="min-w-0">
          <span className="flex items-center gap-1.5">
            <span className="truncate font-semibold">@{person.username}</span>
            {friend ? (
              <span className="shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">{t("social.friend")}</span>
            ) : followsYou ? (
              <span className="shrink-0 rounded-full bg-card px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-foreground/60">{t("social.followsYou")}</span>
            ) : null}
          </span>
          {person.bio && <span className="block truncate text-xs text-foreground/60">{person.bio}</span>}
        </span>
      </Link>
      <FollowButton creatorId={person.id} className="h-9 px-4" />
    </li>
  );
}

/** « Suivi par @a, @b et 3 autres » : les comptes que je suis qui suivent ce créateur (comme Instagram). */
export function FollowedByLine({ creatorId }: { creatorId: string }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: following } = useFollowedIds();
  const ids = [...(following ?? [])].filter((id) => id !== creatorId);
  const { data } = useQuery({
    queryKey: ["followed-by-line", creatorId, user?.id, ids.length],
    enabled: !!user && user.id !== creatorId && ids.length > 0,
    queryFn: async () => {
      const { data: rows } = await supabase.from("follows").select("follower_id").eq("creator_id", creatorId).in("follower_id", ids.slice(0, 500));
      const list = (rows ?? []).map((r) => r.follower_id);
      const people = await fetchCreatorsByIds(list.slice(0, 3));
      return { count: list.length, people };
    },
  });
  if (!data || data.count === 0) return null;
  const names = data.people.slice(0, 2).map((p) => `@${p.username}`).join(", ");
  const rest = data.count - Math.min(2, data.people.length);
  return (
    <div className="mt-3 flex items-center justify-center gap-2 text-[13px] text-foreground/70">
      <span className="flex -space-x-2">
        {data.people.slice(0, 3).map((p) => (
          <Avatar key={p.id} src={p.profile_image} name={p.username} className="h-6 w-6 ring-2 ring-background" />
        ))}
      </span>
      <span>
        {t("social.followedBy")} <b className="font-semibold text-foreground">{names}</b>
        {rest > 0 && ` ${t("social.andOthers")} ${rest}`}
      </span>
    </div>
  );
}

/** Chiffres « tenues · abonnés · abonnements » + listes, comme sur Instagram. */
export function ProfileStats({ creatorId, outfitCount }: { creatorId: string; outfitCount: number }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState<ListKind | null>(null);
  const [search, setSearch] = useState("");
  const [onlyCommon, setOnlyCommon] = useState(false);
  const { user } = useAuth();
  const { data: myFollowing } = useFollowedIds();
  const { data: myFollowers } = useMyFollowerIds();

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

  // Les comptes que je suis apparaissent en premier (amis d'abord), puis les autres
  const q = search.trim().toLowerCase().replace(/^@/, "");
  const all = list.data ?? [];
  const commonCount = all.filter((p) => myFollowing?.has(p.id)).length;
  // Ordre calculé une seule fois à l'ouverture : suivre quelqu'un ne le fait pas remonter (comme Instagram)
  const rankSnap = useRef<{ data: CreatorCard[] | undefined; ranks: Map<string, number> }>({ data: undefined, ranks: new Map() });
  if (list.data && rankSnap.current.data !== list.data && myFollowing) {
    rankSnap.current = {
      data: list.data,
      ranks: new Map(list.data.map((p) => [p.id, myFollowing.has(p.id) && myFollowers?.has(p.id) ? 0 : myFollowing.has(p.id) ? 1 : 2])),
    };
  }
  const rank = (p: CreatorCard) => rankSnap.current.ranks.get(p.id) ?? 2;
  const visible = all
    .filter((p) => !q || p.username.includes(q))
    .filter((p) => !onlyCommon || !!q || myFollowing?.has(p.id))
    .map((p, i) => ({ p, i }))
    .sort((a, b) => rank(a.p) - rank(b.p) || a.i - b.i)
    .map(({ p }) => p);
  const followers = counts.data?.followers ?? 0;
  const following = counts.data?.following ?? 0;

  return (
    <>
      <div className="mt-4 flex justify-center gap-1">
        <Stat value={outfitCount} label={outfitCount > 1 ? t("social.outfits") : t("social.outfit")} />
        <Stat value={followers} label={followers > 1 ? t("social.followers") : t("social.follower")} onClick={() => { setSearch(""); setOnlyCommon(false); setOpen("followers"); }} />
        <Stat value={following} label={t("social.following")} onClick={() => { setSearch(""); setOnlyCommon(false); setOpen("following"); }} />
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
          {/* Recherche dans la liste + « En commun » (comptes que je suis aussi), comme Instagram */}
          <label className="flex items-center gap-2 rounded-full border border-border bg-background px-4">
            <Search className="h-4 w-4 shrink-0 text-foreground/45" aria-hidden="true" />
            <span className="sr-only">{t("social.searchList")}</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("social.searchList")}
              autoCapitalize="none"
              autoCorrect="off"
              className="min-w-0 flex-1 bg-transparent py-2.5 text-[15px] outline-none"
            />
          </label>
          {user && commonCount > 0 && !q && (
            <div className="flex gap-2">
              <button type="button" onClick={() => setOnlyCommon(false)} className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold ${!onlyCommon ? "bg-ink text-surface" : "border border-border"}`}>
                {t("social.all")}
              </button>
              <button type="button" onClick={() => setOnlyCommon(true)} className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold ${onlyCommon ? "bg-ink text-surface" : "border border-border"}`}>
                {t("social.inCommon")} · {commonCount}
              </button>
            </div>
          )}
          <div className="max-h-[55vh] overflow-y-auto">
            {list.isLoading ? (
              <p className="py-6 text-center text-sm text-foreground/60">…</p>
            ) : visible.length ? (
              <ul className="divide-y divide-border/60">
                {visible.map((p) => (
                  <PersonRow
                    key={p.id}
                    person={p}
                    friend={!!myFollowing?.has(p.id) && !!myFollowers?.has(p.id)}
                    followsYou={!!myFollowers?.has(p.id)}
                  />
                ))}
              </ul>
            ) : list.data && list.data.length ? (
              <p className="py-6 text-center text-sm text-foreground/60">{t("social.noMatch")}</p>
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
  const { data: myFollowersForSuggest } = useMyFollowerIds();
  const exclude = [creatorId, ...(user ? [user.id] : []), ...(followed ?? [])];
  const { data } = useQuery({
    // Liste figée jusqu'au rafraîchissement : suivre quelqu'un ne le fait pas disparaître (comme Instagram)
    queryKey: ["suggestions", creatorId, user?.id],
    enabled: !!user && !!followed,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      // D'abord les abonnements en commun, puis les styles proches
      const mutual = await fetchMutualSuggestions(user!.id, [...(followed ?? [])], 10, [...(myFollowersForSuggest ?? [])]);
      const more = await fetchSuggestions({ styles, exclude: [...exclude, ...mutual.map((m) => m.id)], limit: 10 });
      return [...mutual, ...more].filter((c) => c.id !== creatorId).slice(0, 10);
    },
  });
  if (!user || !data || data.length === 0) return null;
  return (
    <section className="mt-10 px-4 md:px-0">
      <h2 className="font-display mb-4 text-2xl font-bold">{t("social.suggestions")}</h2>
      <CreatorRow creators={data} />
    </section>
  );
}
