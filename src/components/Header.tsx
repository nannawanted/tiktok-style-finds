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

function SearchBox({ className = "" }: { className?: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const currentQ = useRouterState({
    select: (s) => (s.location.pathname === "/explorer" ? String((s.location.search as { q?: string }).q ?? "") : ""),
  });
  const [q, setQ] = useState(currentQ);
  useEffect(() => setQ(currentQ), [currentQ]);

  return (
    <form
      role="search"
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        navigate({ to: "/explorer", search: { q: q.trim() || undefined } });
      }}
    >
      <label className="flex h-11 items-center gap-2.5 rounded-full border border-border bg-surface px-4 transition-colors focus-within:border-foreground/50">
        <Search className="h-[18px] w-[18px] shrink-0 text-secondary" aria-hidden="true" />
        <span className="sr-only">{t("nav2.searchLabel")}</span>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("nav2.searchPlaceholder")}
          enterKeyHint="search"
          maxLength={60}
          className="w-full min-w-0 bg-transparent text-[15px] text-foreground outline-none placeholder:text-foreground/50"
        />
      </label>
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
