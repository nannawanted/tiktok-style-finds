import { Link, useRouterState } from "@tanstack/react-router";
import { useTranslation } from "@/lib/i18n";
import { Logo } from "./Logo";

// Affiché en bas de TOUTES les pages du site (branché dans __root.tsx).
export function Footer() {
  const { t } = useTranslation();
  const path = useRouterState({ select: (s) => s.location.pathname });
  // Pages « appli » (comme Instagram) : pas de pied de page, pas d'espace vide en bas
  if (/^\/(dashboard|notifications|enregistres)(\/|$)/.test(path)) return null;
  const link = "text-foreground/70 hover:text-primary hover:underline";

  return (
    <footer data-no-print className="mt-10 border-t border-border/60">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 md:flex-row md:items-start md:justify-between md:px-6">
        <div className="max-w-sm">
          <Logo className="h-12" />
          <p className="mt-3 text-sm leading-relaxed text-foreground/70">
            {t("footer.partnershipCta")}{" "}
            <a href="mailto:nannawanted@gmail.com" className="font-semibold text-primary hover:underline">
              nannawanted@gmail.com
            </a>
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
          <Link to="/explorer" className={link}>
            {t("nav2.explore")}
          </Link>
          <Link to="/createurs" className={link}>
            {t("nav2.creators")}
          </Link>
          <Link to="/signup" className={link}>
            {t("nav2.createPage")}
          </Link>
          <Link to="/confidentialite" className={link}>
            {t("footer.privacy")}
          </Link>
          <Link to="/conditions" className={link}>
            {t("footer.terms")}
          </Link>
          <a href="mailto:nannawanted@gmail.com" className={link}>
            Contact
          </a>
        </nav>
      </div>
    </footer>
  );
}
