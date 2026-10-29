import { useEffect, useMemo, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useTranslation } from "@/lib/i18n";
import { FEED_PAGE, type OutfitCard } from "@/lib/public-data";
import { RotateCw, WifiOff } from "lucide-react";
import { OutfitGrid, OutfitGridSkeleton } from "./OutfitCard";

/**
 * Fil de tenues sans fin (comme Pinterest / Instagram) : la page suivante se
 * charge toute seule quand on approche du bas.
 */
export function InfiniteOutfitFeed({
  queryKey,
  fetchPage,
  initial,
  showCreator = true,
  empty,
  excludeIds,
}: {
  queryKey: readonly unknown[];
  fetchPage: (page: number) => Promise<OutfitCard[]>;
  initial?: OutfitCard[];
  showCreator?: boolean;
  empty?: React.ReactNode;
  excludeIds?: string[];
}) {
  const { t } = useTranslation();
  const sentinel = useRef<HTMLDivElement>(null);

  const query = useInfiniteQuery({
    queryKey: ["feed", ...queryKey],
    queryFn: ({ pageParam }) => fetchPage(pageParam),
    initialPageParam: 0,
    getNextPageParam: (last, all) => (last.length < FEED_PAGE ? undefined : all.length),
    ...(initial ? { initialData: { pages: [initial], pageParams: [0] } } : {}),
    staleTime: 60_000,
  });

  // Une tenue n'apparaît qu'une fois, même si deux pages se chevauchent
  const outfits = useMemo(() => {
    const seen = new Set(excludeIds ?? []);
    const out: OutfitCard[] = [];
    for (const page of query.data?.pages ?? [])
      for (const o of page)
        if (!seen.has(o.id)) {
          seen.add(o.id);
          out.push(o);
        }
    return out;
  }, [query.data, excludeIds]);

  const { hasNextPage, isFetchingNextPage, fetchNextPage } = query;
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasNextPage) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isFetchingNextPage) fetchNextPage();
      },
      { rootMargin: "900px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, outfits.length]);

  if (query.isLoading) return <OutfitGridSkeleton />;
  // Échec du chargement : on le dit (au lieu d'un faux « aucun look ») et on propose de réessayer
  if (query.isError && !outfits.length) return <RetryBox onRetry={() => void query.refetch()} busy={query.isFetching} />;
  if (!outfits.length) return <>{empty ?? null}</>;

  return (
    <>
      <OutfitGrid outfits={outfits} showCreator={showCreator} />
      <div ref={sentinel} aria-hidden="true" className="h-1" />
      {isFetchingNextPage && (
        <p className="py-6 text-center text-sm font-semibold text-foreground/60" role="status">
          {t("engage.loadingMore")}
        </p>
      )}
      {query.isFetchNextPageError && !isFetchingNextPage && (
        <div className="flex justify-center py-6">
          <button type="button" onClick={() => void fetchNextPage()} className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-surface">
            <RotateCw className="h-4 w-4" aria-hidden="true" /> {t("net.retry")}
          </button>
        </div>
      )}
      {!hasNextPage && !query.isFetchNextPageError && outfits.length > FEED_PAGE && (
        <p className="py-8 text-center text-sm text-foreground/60">{t("engage.endOfFeed")}</p>
      )}
    </>
  );
}

/** Message « pas de connexion » + bouton Réessayer (comme Instagram). */
export function RetryBox({ onRetry, busy = false }: { onRetry: () => void; busy?: boolean }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-surface">
        <WifiOff className="h-6 w-6 text-foreground/70" aria-hidden="true" />
      </span>
      <p className="font-display text-2xl font-bold">{t("net.errorTitle")}</p>
      <p className="max-w-xs text-sm text-foreground/60">{t("net.errorText")}</p>
      <button type="button" onClick={onRetry} disabled={busy} className="mt-1 inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-surface disabled:opacity-50">
        <RotateCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} aria-hidden="true" /> {t("net.retry")}
      </button>
    </div>
  );
}
