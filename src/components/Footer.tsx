import { useTranslation } from "@/lib/i18n";

// Affiché en bas de TOUTES les pages du site (branché dans __root.tsx).
export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-border py-6 text-center">
      <p className="text-sm text-muted-foreground">
        {t("footer.partnershipCta")}{" "}
        <a href="mailto:nannawanted@gmail.com" className="font-semibold text-brand hover:underline">
          nannawanted@gmail.com
        </a>
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("footer.suggestBrandCta")}{" "}
        <a href="mailto:nannawanted@gmail.com" className="font-semibold text-brand hover:underline">
          nannawanted@gmail.com
        </a>
      </p>
    </footer>
  );
}
