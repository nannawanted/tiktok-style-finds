import { Link } from "@tanstack/react-router";
import { useTranslation } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";

/** Badge « Fait avec WantedFashion » : chaque page partagée fait connaître le site. */
export function MadeWithBadge() {
  const { t } = useTranslation();
  const { user } = useAuth();
  if (user) return null; // déjà inscrit : inutile de lui proposer de créer sa page
  return (
    <Link
      to="/signup"
      className="mx-auto inline-flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-[13px] font-semibold text-foreground/80 shadow-sm transition-colors hover:text-primary"
    >
      <img src="/logo-sm.png" alt="" width={36} height={26} className="h-6 w-auto" />
      {t("madeWith.text")}
    </Link>
  );
}

export function MadeWithBanner({ className = "" }: { className?: string }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  if (user) return null;
  return (
    <div className={`${className} flex items-center gap-3 rounded-3xl bg-secondary p-4 text-secondary-foreground sm:p-5`}>
      <p className="flex-1 text-sm leading-snug sm:text-base">{t("madeWith.short")}</p>
      <Link
        to="/signup"
        className="shrink-0 rounded-full bg-surface px-4 py-3 text-sm font-bold text-foreground transition-transform hover:-translate-y-0.5"
      >
        {t("madeWith.button")}
      </Link>
    </div>
  );
}
