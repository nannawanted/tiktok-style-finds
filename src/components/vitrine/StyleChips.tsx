import { useTranslation } from "@/lib/i18n";
import { STYLE_KEYS, styleLabelKey, type StyleKey } from "@/lib/styles";

/** Rangée de styles cliquables (un seul actif à la fois, ou aucun = tous). */
export function StyleChips({
  value,
  onChange,
  className = "",
}: {
  value: StyleKey | null;
  onChange: (s: StyleKey | null) => void;
  className?: string;
}) {
  const { t } = useTranslation();
  const chip = (active: boolean) =>
    `shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold transition-all active:scale-95 ${
      active ? "bg-ink text-surface shadow-sm" : "border border-border bg-surface text-foreground hover:border-foreground/40"
    }`;
  return (
    <div role="group" aria-label={t("styles.all")} className={`no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 ${className}`}>
      <button type="button" aria-pressed={value === null} className={chip(value === null)} onClick={() => onChange(null)}>
        {t("styles.all")}
      </button>
      {STYLE_KEYS.map((s) => (
        <button key={s} type="button" aria-pressed={value === s} className={chip(value === s)} onClick={() => onChange(value === s ? null : s)}>
          {t(styleLabelKey(s))}
        </button>
      ))}
    </div>
  );
}

/** Sélection de plusieurs styles (formulaires de l'espace créateur). */
export function StylePicker({
  value,
  onChange,
  max = 5,
  onMax,
}: {
  value: StyleKey[];
  onChange: (v: StyleKey[]) => void;
  max?: number;
  onMax?: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-wrap gap-2">
      {STYLE_KEYS.map((s) => {
        const active = value.includes(s);
        return (
          <button
            key={s}
            type="button"
            aria-pressed={active}
            onClick={() => {
              if (active) onChange(value.filter((v) => v !== s));
              else if (value.length >= max) onMax?.();
              else onChange([...value, s]);
            }}
            className={`rounded-full px-3.5 py-2 text-sm font-semibold transition-colors ${
              active ? "bg-ink text-surface" : "border border-border bg-surface text-foreground hover:border-foreground/40"
            }`}
          >
            {t(styleLabelKey(s))}
          </button>
        );
      })}
    </div>
  );
}
