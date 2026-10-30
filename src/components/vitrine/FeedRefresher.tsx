import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowUp, RotateCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/lib/i18n";

const PULL_TRIGGER = 72; // px à tirer pour rafraîchir
const POLL_MS = 60_000;

/**
 * Deux réflexes des grandes applis sur le fil :
 *  - « Tirer vers le bas pour rafraîchir » (Instagram, TikTok) quand on est tout en haut ;
 *  - la pastille « Nouveaux looks ↑ » (Instagram, X) quand des looks ont été publiés
 *    pendant qu'on fait défiler : un toucher remonte en haut et recharge, sans saut imposé.
 */
export function FeedRefresher({ scope }: { scope: string }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [hasNew, setHasNew] = useState(false);
  const baseline = useRef<string | null>(null);
  const startY = useRef<number | null>(null);
  const pullRef = useRef(0);

  const latest = useCallback(async () => {
    const { data } = await supabase.rpc("latest_post_at" as never);
    return (data as string | null) ?? null;
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setHasNew(false);
    baseline.current = await latest().catch(() => baseline.current);
    await qc.invalidateQueries({ queryKey: ["feed", scope] });
    setRefreshing(false);
  }, [qc, scope, latest]);

  // Pastille « Nouveaux looks »
  useEffect(() => {
    let alive = true;
    void latest().then((d) => {
      if (alive) baseline.current = d;
    });
    const check = async () => {
      if (document.hidden) return;
      const d = await latest().catch(() => null);
      if (alive && d && baseline.current && d > baseline.current) setHasNew(true);
    };
    const id = setInterval(check, POLL_MS);
    document.addEventListener("visibilitychange", check);
    return () => {
      alive = false;
      clearInterval(id);
      document.removeEventListener("visibilitychange", check);
    };
  }, [latest]);

  // Tirer vers le bas pour rafraîchir (téléphone)
  useEffect(() => {
    const onStart = (e: TouchEvent) => {
      startY.current = window.scrollY <= 0 && !refreshing ? e.touches[0].clientY : null;
    };
    const onMove = (e: TouchEvent) => {
      if (startY.current === null) return;
      const dy = e.touches[0].clientY - startY.current;
      pullRef.current = dy <= 0 || window.scrollY > 0 ? 0 : Math.min(dy * 0.5, 110); // résistance, comme sur Instagram
      setPull(pullRef.current);
    };
    const onEnd = () => {
      if (startY.current === null) return;
      startY.current = null;
      if (pullRef.current >= PULL_TRIGGER) void refresh();
      pullRef.current = 0;
      setPull(0);
    };
    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onEnd);
    window.addEventListener("touchcancel", onEnd);
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onEnd);
    };
  }, [refresh, refreshing]);

  const showSpinner = pull > 8 || refreshing;
  return (
    <>
      {showSpinner && (
        <div
          aria-hidden={!refreshing}
          role={refreshing ? "status" : undefined}
          className="pointer-events-none fixed inset-x-0 z-[45] flex justify-center"
          style={{ top: `calc(var(--sticky-top, 118px) + ${refreshing ? 14 : Math.max(pull - 30, 4)}px)` }}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface shadow-lg ring-1 ring-border">
            <RotateCw
              className={`h-5 w-5 text-foreground/80 ${refreshing ? "animate-spin" : ""}`}
              style={refreshing ? undefined : { transform: `rotate(${pull * 3}deg)`, opacity: Math.min(pull / PULL_TRIGGER, 1) }}
              aria-hidden="true"
            />
            {refreshing && <span className="sr-only">{t("feed.refreshing")}</span>}
          </span>
        </div>
      )}
      {hasNew && !refreshing && (
        <div className="pointer-events-none fixed inset-x-0 z-[45] flex justify-center" style={{ top: "calc(var(--sticky-top, 118px) + 120px)" }}>
          <button
            type="button"
            onClick={() => {
              window.scrollTo({ top: document.getElementById("tenues")?.offsetTop ?? 0, behavior: "smooth" });
              void refresh();
            }}
            className="fade-up pointer-events-auto inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-[13px] font-bold text-primary-foreground shadow-[0_10px_30px_-8px_rgba(150,30,30,.6)]"
          >
            <ArrowUp className="h-4 w-4" aria-hidden="true" /> {t("feed.newLooks")}
          </button>
        </div>
      )}
    </>
  );
}
