import { useEffect, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Search, Menu, Heart, LayoutGrid, Users, Compass, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "./Logo";
import { LanguageSwitch } from "./LanguageSwitch";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useQuery } from "@tanstack/react-query";
import { cleanQuery, fetchCreators, searchOutfits } from "@/lib/public-data";
import { Avatar } from "@/components/vitrine/OutfitCard";

function SearchBox({ className = "" }: { className?: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const currentQ = useRouterState({
    select: (s) => (s.location.pathname === "/explorer" ? String((s.location.search as { q?: string }).q ?? "") : ""),
  });
  const [q, setQ] = useState(currentQ);
  const [open, setOpen] = useState(false);
  const [debounced, setDebounced] = useState("");
  useEffect(() => setQ(currentQ), [currentQ]);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(cleanQuery(q)), 250);
    return () => clearTimeout(id);
  }, [q]);

  // Suggestions en direct pendant la frappe (créateurs + tenues)
  const suggestions = useQuery({
    queryKey: ["search-suggest", debounced],
    enabled: debounced.length >= 2,
    staleTime: 30_000,
    queryFn: async () => {
      const [creators, outfits] = await Promise.all([
        fetchCreators({ q: debounced, limit: 4 }),
        searchOutfits(debounced, null, 5),
      ]);
      return { creators, outfits };
    },
  });

  function go() {
    setOpen(false);
    (document.activeElement as HTMLElement | null)?.blur();
    navigate({ to: "/explorer", search: { q: q.trim() || undefined } });
  }

  const data = suggestions.data;
  const show = open && debounced.length >= 2;
  const empty = data && data.creators.length === 0 && data.outfits.length === 0;

  return (
    <form
      role="search"
      className={`relative ${className}`}
      onSubmit={(e) => {
        e.preventDefault();
        go();
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <label className="flex h-11 items-center gap-2.5 rounded-full border border-border bg-surface px-4 transition-colors focus-within:border-foreground/50">
        <Search className="h-[18px] w-[18px] shrink-0 text-secondary" aria-hidden="true" />
        <span className="sr-only">{t("nav2.searchLabel")}</span>
        <input
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
          placeholder={t("nav2.searchPlaceholder")}
          enterKeyHint="search"
          maxLength={60}
          autoComplete="off"
          className="w-full min-w-0 bg-transparent text-[15px] text-foreground outline-none placeholder:text-foreground/50"
        />
      </label>
      {show && (
        <div className="absolute inset-x-0 top-[calc(100%+6px)] z-50 max-h-[70vh] overflow-y-auto rounded-3xl border border-border bg-surface p-2 shadow-[var(--shadow-card-hover)]">
          {suggestions.isLoading && <p className="px-3 py-3 text-sm text-foreground/60">…</p>}
          {empty && <p className="px-3 py-3 text-sm text-foreground/60">{t("explore.noOutfits")}</p>}
          {data && data.creators.length > 0 && (
            <div className="pb-1">
              <p className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wider text-foreground/50">{t("explore.creators")}</p>
              {data.creators.map((c) => (
                <Link
                  key={c.id}
                  to="/@{$username}"
                  params={{ username: c.username }}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-2xl px-3 py-2 hover:bg-card"
                >
                  <Avatar src={c.profile_image} name={c.username} className="h-9 w-9" />
                  <span className="truncate font-semibold">@{c.username}</span>
                </Link>
              ))}
            </div>
          )}
          {data && data.outfits.length > 0 && (
            <div className="pb-1">
              <p className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wider text-foreground/50">{t("explore.outfits")}</p>
              {data.outfits.map((o) => (
                <Link
                  key={o.id}
                  to="/post/$id"
                  params={{ id: o.id }}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-2xl px-3 py-2 hover:bg-card"
                >
                  <span className="h-11 w-9 shrink-0 overflow-hidden rounded-lg bg-card">
                    {o.cover_image && <img src={o.cover_image} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{o.title}</span>
                    <span className="block truncate text-xs text-foreground/60">@{o.creator_username}</span>
                  </span>
                </Link>
              ))}
            </div>
          )}
          <button type="submit" className="mt-1 w-full rounded-2xl px-3 py-2.5 text-left text-sm font-bold text-primary hover:bg-card">
            {t("explore.resultsFor")} « {q.trim()} » →
          </button>
        </div>
      )}
    </form>
  );
}

export function Header() {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  async function signOut() {
    await supabase.auth.signOut();
    toast.success(t("nav2.logout"));
    navigate({ to: "/" });
  }

  const navLink =
    "rounded-full px-3 py-2 text-[15px] font-semibold text-foreground/85 transition-colors hover:bg-surface hover:text-foreground [&.active]:text-primary";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2 md:gap-5 md:px-6">
        <Link to="/" aria-label="WantedFashion" className="shrink-0">
          <Logo className="h-12 md:h-14" />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Link to="/explorer" className={navLink}>
            {t("nav2.explore")}
          </Link>
          <Link to="/createurs" className={navLink}>
            {t("nav2.creators")}
          </Link>
        </nav>

        <SearchBox className="hidden flex-1 md:block" />

        <div className="ml-auto hidden items-center gap-2 md:flex">
          <LanguageSwitch />
          {loading ? null : user ? (
            <>
              <Link to="/enregistres" className={navLink} aria-label={t("nav2.saved")}>
                <Heart className="h-5 w-5" aria-hidden="true" />
              </Link>
              <Link to="/dashboard" className={navLink}>
                {t("nav2.myPage")}
              </Link>
              <button type="button" onClick={signOut} className={navLink} aria-label={t("nav2.logout")}>
                <LogOut className="h-5 w-5" aria-hidden="true" />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={navLink}>
                {t("nav2.login")}
              </Link>
              <Link
                to="/signup"
                className="rounded-full bg-primary px-5 py-2.5 text-[15px] font-bold text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:bg-primary/90"
              >
                {t("nav2.createPage")}
              </Link>
            </>
          )}
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              aria-label={t("nav2.menu")}
              className="ml-auto flex h-11 w-11 items-center justify-center rounded-full bg-surface md:hidden"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[85vw] max-w-sm border-border bg-background">
            <SheetTitle className="sr-only">{t("nav2.menu")}</SheetTitle>
            <div className="mt-6 flex items-center justify-between">
              <Logo className="h-12" />
              <LanguageSwitch />
            </div>
            <nav className="mt-8 flex flex-col gap-1" onClick={() => setOpen(false)}>
              <Link to="/explorer" className="flex items-center gap-3 rounded-2xl px-3 py-3 text-lg font-semibold hover:bg-surface">
                <Compass className="h-5 w-5 text-primary" aria-hidden="true" /> {t("nav2.explore")}
              </Link>
              <Link to="/createurs" className="flex items-center gap-3 rounded-2xl px-3 py-3 text-lg font-semibold hover:bg-surface">
                <Users className="h-5 w-5 text-primary" aria-hidden="true" /> {t("nav2.creators")}
              </Link>
              {user && (
                <>
                  <Link to="/enregistres" className="flex items-center gap-3 rounded-2xl px-3 py-3 text-lg font-semibold hover:bg-surface">
                    <Heart className="h-5 w-5 text-primary" aria-hidden="true" /> {t("nav2.saved")}
                  </Link>
                  <Link to="/dashboard" className="flex items-center gap-3 rounded-2xl px-3 py-3 text-lg font-semibold hover:bg-surface">
                    <LayoutGrid className="h-5 w-5 text-primary" aria-hidden="true" /> {t("nav2.myPage")}
                  </Link>
                </>
              )}
            </nav>
            <div className="mt-8 flex flex-col gap-3">
              {loading ? null : user ? (
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    signOut();
                  }}
                  className="h-12 rounded-full border border-border font-bold"
                >
                  {t("nav2.logout")}
                </button>
              ) : (
                <>
                  <Link to="/signup" onClick={() => setOpen(false)} className="flex h-12 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
                    {t("nav2.createPage")}
                  </Link>
                  <Link to="/login" onClick={() => setOpen(false)} className="flex h-12 items-center justify-center rounded-full border border-border font-bold">
                    {t("nav2.login")}
                  </Link>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
      <div className="px-4 pb-2.5 md:hidden">
        <SearchBox />
      </div>
    </header>
  );
}
