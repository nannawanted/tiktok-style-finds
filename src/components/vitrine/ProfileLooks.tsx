import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Search, X } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import type { OutfitCard } from "@/lib/public-data";
import { styleLabelKey, type StyleKey } from "@/lib/styles";
import {
  buildIndex,
  completions,
  fetchCreatorBuzz,
  fetchProfileIndex,
  searchLooks,
  topBrands,
  topItems,
} from "@/lib/profile-search";
import { OutfitGrid } from "./OutfitCard";
import { EmptyBox } from "./EmptyBox";

const PAGE = 24;

type HeroKind = "buzz" | "pinned" | "latest";

/**
 * Les looks d'un créateur, pensés pour quelqu'un qui arrive depuis le lien en bio TikTok/Insta :
 * 1. « Tu viens de voir… » : le look le plus ouvert en ce moment, les épinglés, le dernier ;
 * 2. tous les autres, du plus récent au plus ancien ;
 * 3. une barre de recherche qui fouille marques, pièces, couleurs, hashtags et styles.
 */
export function ProfileLooks({
  creatorId,
  outfits,
  isOwner,
}: {
  creatorId: string;
  outfits: OutfitCard[];
  isOwner: boolean;
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [filter, setFilter] = useState<StyleKey | null>(null);
  const [sort, setSort] = useState<"recent" | "popular">("recent");
  const [visible, setVisible] = useState(PAGE);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: index = [] } = useQuery({
    queryKey: ["profile-index", creatorId],
    queryFn: () => fetchProfileIndex(creatorId),
    staleTime: 5 * 60_000,
  });
  const { data: buzzId = null } = useQuery({
    queryKey: ["creator-buzz", creatorId],
    queryFn: () => fetchCreatorBuzz(creatorId),
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  const docs = useMemo(
    () =>
      buildIndex(
        outfits.map((o) => ({
          id: o.id,
          title: o.title,
          styles: o.styles,
          styleLabels: o.styles.map((s) => t(styleLabelKey(s))),
        })),
        index,
      ),
    [outfits, index, t],
  );

  const outfitStyles = useMemo(() => {
    const s = new Set<StyleKey>();
    outfits.forEach((o) => o.styles.forEach((x) => s.add(x)));
    return [...s];
  }, [outfits]);
  const activeFilter = filter && outfitStyles.includes(filter) ? filter : null;
  const byId = useMemo(() => new Map(outfits.map((o) => [o.id, o])), [outfits]);

  const trimmed = query.trim();
  const search = useMemo(() => (trimmed ? searchLooks(docs, trimmed) : null), [docs, trimmed]);
  const searching = !!search;

  // ——— « Tu viens de voir… » : buzz, épinglés, dernier (sans doublon) ———
  const hero = useMemo(() => {
    if (outfits.length < 2) return [] as { o: OutfitCard; kind: HeroKind }[];
    const list: { o: OutfitCard; kind: HeroKind }[] = [];
    const add = (o: OutfitCard | undefined, kind: HeroKind) => {
      if (o && !list.some((x) => x.o.id === o.id)) list.push({ o, kind });
    };
    add(buzzId ? byId.get(buzzId) : undefined, "buzz");
    [...outfits]
      .filter((o) => o.pinned_at)
      .sort((a, b) => (b.pinned_at ?? "").localeCompare(a.pinned_at ?? ""))
      .forEach((o) => add(o, "pinned"));
    add(outfits[0], "latest");
    return list;
  }, [outfits, buzzId, byId]);
  const showHero = !searching && !activeFilter && sort === "recent" && hero.length > 0;

  // ——— Liste affichée ———
  const filtered = activeFilter ? outfits.filter((o) => o.styles.includes(activeFilter)) : outfits;
  const notes = new Map<string, string>();
  let shown: OutfitCard[];
  if (search) {
    shown = search.results
      .map((r) => byId.get(r.id))
      .filter((o): o is OutfitCard => !!o && (!activeFilter || o.styles.includes(activeFilter)));
    for (const r of search.results) if (r.note) notes.set(r.id, r.note);
  } else if (sort === "popular") {
    shown = filtered
      .map((o, i) => ({ o, i }))
      .sort((a, b) => b.o.likes - a.o.likes || a.i - b.i)
      .map(({ o }) => o);
  } else if (showHero) {
    const heroIds = new Set(hero.map((h) => h.o.id));
    shown = filtered.filter((o) => !heroIds.has(o.id));
  } else {
    shown = filtered;
  }

  useEffect(() => setVisible(PAGE), [trimmed, activeFilter, sort]);

  // Chargement progressif quand on arrive en bas (comme un fil Instagram)
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el || visible >= shown.length) return;
    const io = new IntersectionObserver(
      (entries) => entries[0]?.isIntersecting && setVisible((v) => v + PAGE),
      { rootMargin: "600px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible, shown.length]);

  const brands = useMemo(() => topBrands(index), [index]);
  const items = useMemo(() => topItems(index), [index]);
  const typed = useMemo(() => (trimmed ? completions(index, trimmed) : []), [index, trimmed]);

  const chip = (active: boolean) =>
    `shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
      active
        ? "bg-ink text-surface"
        : "border border-border bg-surface text-foreground hover:border-foreground/40"
    }`;
  const suggestion =
    "shrink-0 rounded-full border border-border bg-surface px-3.5 py-1.5 text-[13px] font-semibold text-foreground hover:border-foreground/40";

  function pick(v: string) {
    setQuery(v);
    inputRef.current?.blur();
  }

  if (!outfits.length) {
    return isOwner ? (
      <EmptyBox
        text={t("profile.emptyOwner")}
        action={{ to: "/dashboard/post/new", label: t("profile.publish") }}
      />
    ) : (
      <EmptyBox text={t("profile.empty")} />
    );
  }

  return (
    <div>
      {/* Barre de recherche (dès le premier look, comme « Rechercher tes épingles » sur un profil Pinterest) */}
      {outfits.length > 0 && (
        <div className="mb-4">
          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              inputRef.current?.blur();
            }}
            className="relative"
          >
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground/50"
              aria-hidden="true"
            />
            <input
              ref={inputRef}
              type="search"
              inputMode="search"
              enterKeyHint="search"
              autoComplete="off"
              value={query}
              onChange={(e) => setQuery(e.target.value.slice(0, 60))}
              onFocus={() => setFocused(true)}
              onBlur={() => setTimeout(() => setFocused(false), 150)}
              placeholder={t("profile.searchPlaceholder")}
              aria-label={t("profile.searchLabel")}
              className="h-13 w-full rounded-full border border-border bg-surface py-3.5 pl-12 pr-12 text-[16px] outline-none transition-shadow placeholder:text-foreground/45 focus:border-foreground/40 focus:shadow-[0_0_0_4px_rgba(0,0,0,0.05)] [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  inputRef.current?.focus();
                }}
                aria-label={t("profile.searchClear")}
                className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-foreground/60 hover:bg-card"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            )}
          </form>

          {/* Propositions : ses marques et ses pièces (avant de taper), ou la suite de ce qu'on tape */}
          {!trimmed && focused && (brands.length > 0 || items.length > 0) && (
            <div className="fade-up mt-3 space-y-2.5">
              {brands.length > 0 && (
                <div>
                  <p className="mb-1.5 px-1 text-xs font-bold uppercase tracking-wide text-foreground/55">
                    {t("profile.searchBrands")}
                  </p>
                  <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
                    {brands.map((b) => (
                      <button
                        key={b.label}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => pick(b.label)}
                        className={suggestion}
                      >
                        {b.label} <span className="text-foreground/50">· {b.count}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {items.length > 0 && (
                <div>
                  <p className="mb-1.5 px-1 text-xs font-bold uppercase tracking-wide text-foreground/55">
                    {t("profile.searchItems")}
                  </p>
                  <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
                    {items.map((it) => (
                      <button
                        key={it.label}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => pick(it.label)}
                        className={suggestion}
                      >
                        {it.label} <span className="text-foreground/50">· {it.count}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {trimmed && typed.length > 0 && (
            <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
              {typed.map((w) => (
                <button
                  key={w}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(w)}
                  className={suggestion}
                >
                  <Search
                    className="mr-1 inline h-3.5 w-3.5 -translate-y-px text-foreground/50"
                    aria-hidden="true"
                  />
                  {w}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tu viens de voir… */}
      {showHero && (
        <section aria-labelledby="hero-title" className="mb-7">
          <h2 id="hero-title" className="font-display mb-3 text-2xl font-bold">
            {t("profile.heroTitle")}
          </h2>
          <ul className="grid gap-3 md:grid-cols-2">
            {hero.map(({ o, kind }, i) => (
              <li key={o.id} className="fade-up" style={{ animationDelay: `${i * 70}ms` }}>
                <HeroCard outfit={o} kind={kind} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Titre + tri */}
      {!searching && outfits.length > 1 && (shown.length > 0 || !showHero) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl font-bold">
            {showHero ? t("profile.allLooks") : t("profile.looks")}
          </h2>
          <div
            className="flex shrink-0 gap-1 rounded-full bg-surface p-1"
            role="tablist"
            aria-label={t("profile.sortLabel")}
          >
            {(["recent", "popular"] as const).map((k) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={sort === k}
                onClick={() => setSort(k)}
                className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${sort === k ? "bg-ink text-surface" : "text-foreground/70"}`}
              >
                {k === "recent" ? t("profile.sortRecent") : t("profile.sortPopular")}
              </button>
            ))}
          </div>
        </div>
      )}

      {outfitStyles.length > 0 && !searching && (
        <div
          className="no-scrollbar sticky top-[var(--sticky-top,118px)] z-30 -mx-4 mb-5 flex gap-2 overflow-x-auto bg-background/90 px-4 py-2.5 backdrop-blur-md transition-[top] duration-300 md:mx-0 md:px-0"
          role="group"
        >
          <button
            type="button"
            aria-pressed={!activeFilter}
            className={chip(!activeFilter)}
            onClick={() => setFilter(null)}
          >
            {t("profile.all")} · {outfits.length}
          </button>
          {outfitStyles.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={activeFilter === s}
              className={chip(activeFilter === s)}
              onClick={() => setFilter(activeFilter === s ? null : s)}
            >
              {t(styleLabelKey(s))}
            </button>
          ))}
        </div>
      )}

      {search && (
        <p className="mb-3 px-1 text-sm font-semibold text-foreground/70" aria-live="polite">
          {search.partial
            ? t("profile.searchNear")
            : shown.length === 1
              ? t("profile.searchCountOne")
              : shown.length > 1
                ? t("profile.searchCount").replace("{n}", String(shown.length))
                : ""}
        </p>
      )}

      {shown.length ? (
        <>
          <OutfitGrid
            outfits={shown.slice(0, visible)}
            showCreator={false}
            showPinned={sort === "recent" && !searching}
            notes={notes}
          />
          {visible < shown.length && (
            <div ref={sentinel} className="flex justify-center py-4">
              <button
                type="button"
                onClick={() => setVisible((v) => v + PAGE)}
                className="rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-bold"
              >
                {t("profile.showMore")}
              </button>
            </div>
          )}
        </>
      ) : search ? (
        <EmptyBox text={t("profile.searchNone")} />
      ) : null}
    </div>
  );
}

function HeroCard({ outfit, kind }: { outfit: OutfitCard; kind: HeroKind }) {
  const { t } = useTranslation();
  const tag =
    kind === "buzz"
      ? t("profile.heroBuzz")
      : kind === "pinned"
        ? t("profile.heroPinned")
        : t("profile.heroLatest");
  const sub =
    kind === "buzz"
      ? t("profile.heroBuzzSub")
      : kind === "pinned"
        ? t("profile.heroPinnedSub")
        : t("profile.heroLatestSub");
  const tagColor = kind === "buzz" ? "bg-primary text-primary-foreground" : "bg-ink text-surface";
  const pieces = `${outfit.pieceCount} ${outfit.pieceCount > 1 ? t("card.pieces") : t("card.piece")}`;
  const img = outfit.cover_thumb || outfit.cover_image;
  return (
    <Link
      to="/post/$id"
      params={{ id: outfit.id }}
      preload="intent"
      preloadDelay={0}
      className={`group flex items-center gap-3.5 rounded-[22px] bg-surface p-2.5 pr-3 shadow-sm transition-transform active:scale-[0.98] ${
        kind === "buzz" ? "ring-2 ring-primary" : "ring-1 ring-border"
      }`}
    >
      <span
        className="relative block aspect-[9/16] w-[88px] shrink-0 overflow-hidden rounded-2xl bg-card"
        style={outfit.cover_color ? { background: outfit.cover_color } : undefined}
      >
        {img && (
          <img
            src={img}
            alt=""
            loading="eager"
            decoding="async"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-bold ${tagColor}`}>
          {tag}
        </span>
        <span className="mt-1.5 line-clamp-2 block text-[15px] font-bold leading-snug">
          {outfit.title}
        </span>
        <span className="mt-1 block text-[12px] text-foreground/60">
          {sub}
          {outfit.pieceCount > 0 && ` · ${pieces}`}
        </span>
      </span>
      <ChevronRight
        className="h-5 w-5 shrink-0 text-foreground/40 transition-transform group-hover:translate-x-0.5"
        aria-hidden="true"
      />
    </Link>
  );
}
