import { useTranslation } from "../lib/i18n";

export function LanguageSwitch({ className = "" }: { className?: string }) {
  const { lang, setLang } = useTranslation();

  return (
    <div className={`flex items-center rounded-full border border-border bg-card p-0.5 text-xs font-bold ${className}`}>
      <button
        onClick={() => setLang("fr")}
        className={`px-2.5 py-1 rounded-full transition-colors ${
          lang === "fr" ? "bg-primary text-primary-foreground" : "text-foreground/60 hover:text-foreground"
        }`}
        aria-pressed={lang === "fr"}
      >
        FR
      </button>
      <button
        onClick={() => setLang("en")}
        className={`px-2.5 py-1 rounded-full transition-colors ${
          lang === "en" ? "bg-primary text-primary-foreground" : "text-foreground/60 hover:text-foreground"
        }`}
        aria-pressed={lang === "en"}
      >
        EN
      </button>
    </div>
  );
}
