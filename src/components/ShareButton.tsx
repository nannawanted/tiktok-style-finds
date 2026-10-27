import { useState, type ReactNode } from "react";
import { Share, Check, Link2, Mail } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from "@/lib/i18n";

interface ShareButtonProps {
  /** Titre partagé (ex: le titre du post) */
  title: string;
  /** Texte descriptif optionnel partagé avec le lien */
  text?: string;
  /** URL absolue à partager. Par défaut : l'URL actuelle de la page. */
  url?: string;
  /** Image (absolue) utilisée par Pinterest */
  image?: string | null;
  className?: string;
  iconClassName?: string;
  /** Texte affiché à côté de l'icône (bouton large). Sans texte : icône seule. */
  label?: string;
}

// Icônes des réseaux, dessinées simplement (pas de dépendance en plus)
const ICONS: Record<string, ReactNode> = {
  whatsapp: (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.6.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3a.4.4 0 0 0 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.1.7a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.3c0-.2-.2-.2-.4-.3Z" />
    </svg>
  ),
  snapchat: (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true">
      <path d="M12 2.5c2.9 0 5 2.3 5 5.2v2.1c.4.2.9.1 1.3-.1.6-.2 1.1.4.7.9-.4.4-1.2.6-1.6.8-.4.2-.3.6-.1 1 .8 1.6 2 2.8 3.6 3.3.4.1.4.6 0 .8-.7.3-1.5.4-2.1.6-.3.1-.3.8-.6 1-.5.2-1.3-.1-2.1 0-1.2.2-1.9 1.6-4.1 1.6s-2.9-1.4-4.1-1.6c-.8-.1-1.6.2-2.1 0-.3-.2-.3-.9-.6-1-.6-.2-1.4-.3-2.1-.6-.4-.2-.4-.7 0-.8 1.6-.5 2.8-1.7 3.6-3.3.2-.4.3-.8-.1-1-.4-.2-1.2-.4-1.6-.8-.4-.5.1-1.1.7-.9.4.2.9.3 1.3.1V7.7c0-2.9 2.1-5.2 5-5.2Z" />
    </svg>
  ),
  pinterest: (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-3.6 19.3c-.1-.8-.2-2 0-2.9l1.2-5s-.3-.6-.3-1.5c0-1.4.8-2.5 1.8-2.5.9 0 1.3.7 1.3 1.4 0 .9-.6 2.2-.9 3.4-.2 1 .5 1.9 1.6 1.9 1.9 0 3.3-2 3.3-4.9 0-2.5-1.8-4.3-4.4-4.3a4.6 4.6 0 0 0-4.8 4.6c0 .9.3 1.9.8 2.4.1.1.1.2.1.3l-.3 1.2c0 .2-.2.3-.4.2-1.4-.7-2.2-2.7-2.2-4.3 0-3.5 2.5-6.7 7.3-6.7 3.8 0 6.8 2.7 6.8 6.4 0 3.8-2.4 6.9-5.8 6.9-1.1 0-2.2-.6-2.5-1.3l-.7 2.6c-.3 1-1 2.2-1.4 2.9A10 10 0 1 0 12 2Z" />
    </svg>
  ),
  facebook: (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true">
      <path d="M13.5 21v-7.5h2.5l.4-3h-2.9V8.6c0-.9.3-1.5 1.5-1.5h1.5V4.4a20 20 0 0 0-2.2-.1c-2.2 0-3.7 1.3-3.7 3.8v2.4H8v3h2.6V21h2.9Z" />
    </svg>
  ),
  x: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M17.8 3h3.1l-6.8 7.7L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.3-8.3L2 3h6.4l4.4 5.8L17.8 3Zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5Z" />
    </svg>
  ),
  telegram: (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true">
      <path d="M21.5 4.3 18.4 19c-.2 1-.9 1.3-1.7.8l-4.7-3.5-2.3 2.2c-.3.3-.5.5-1 .5l.3-4.8 8.8-7.9c.4-.3-.1-.5-.6-.2L6.3 13 1.7 11.6c-1-.3-1-1 .2-1.5L20.2 3c.8-.3 1.6.2 1.3 1.3Z" />
    </svg>
  ),
};

/**
 * Bouton de partage réutilisable : ouvre une fenêtre avec les réseaux
 * (WhatsApp, Snapchat, Pinterest, Facebook, X, Telegram, e-mail), la copie du
 * lien et, sur téléphone, le partage natif (Instagram, Messages…).
 *
 * A utiliser sur toute nouvelle page qui a besoin d'une fonction de partage.
 */
export function ShareButton({ title, text, url, image, className = "", iconClassName = "w-4 h-4", label }: ShareButtonProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = url ?? (typeof window !== "undefined" ? window.location.href : "");
  const message = text ? `${title} — ${text}` : title;
  const e = encodeURIComponent;
  const canNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  const targets = [
    { key: "whatsapp", label: "WhatsApp", color: "#25D366", href: `https://wa.me/?text=${e(`${message} ${shareUrl}`)}` },
    { key: "snapchat", label: "Snapchat", color: "#FFFC00", fg: "#111", href: `https://www.snapchat.com/scan?attachmentUrl=${e(shareUrl)}` },
    {
      key: "pinterest",
      label: "Pinterest",
      color: "#E60023",
      href: `https://pinterest.com/pin/create/button/?url=${e(shareUrl)}&description=${e(message)}${image ? `&media=${e(image)}` : ""}`,
    },
    { key: "facebook", label: "Facebook", color: "#1877F2", href: `https://www.facebook.com/sharer/sharer.php?u=${e(shareUrl)}` },
    { key: "x", label: "X", color: "#111111", href: `https://twitter.com/intent/tweet?text=${e(message)}&url=${e(shareUrl)}` },
    { key: "telegram", label: "Telegram", color: "#229ED9", href: `https://t.me/share/url?url=${e(shareUrl)}&text=${e(message)}` },
  ];

  async function copy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success(t("outfit.linkCopied"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("card.actionError"));
    }
  }

  const tile = "flex flex-col items-center gap-2 rounded-2xl p-2 text-xs font-semibold text-foreground transition-colors hover:bg-card";
  const bubble = "flex h-14 w-14 items-center justify-center rounded-full";

  return (
    <>
      <button
        type="button"
        onClick={async (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          // Sur téléphone : feuille de partage native (comme sur iPhone).
          // Sur ordinateur (pas de partage natif) : fenêtre avec les réseaux.
          if (canNativeShare) {
            try {
              await navigator.share({ title, text, url: shareUrl });
            } catch (err) {
              if ((err as Error)?.name !== "AbortError") setOpen(true);
            }
            return;
          }
          setOpen(true);
        }}
        aria-label={label ? undefined : t("outfit.share")}
        className={className || "w-9 h-9 rounded-full bg-background/30 backdrop-blur-sm flex items-center justify-center text-primary-foreground hover:bg-background/50 transition-colors duration-300"}
      >
        <Share className={iconClassName} aria-hidden="true" />
        {label}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[calc(100vw-24px)] max-w-md grid-cols-1 rounded-3xl border-border bg-surface p-5 sm:p-6 [&>*]:min-w-0">
          <DialogTitle className="font-display text-2xl">{t("outfit.share")}</DialogTitle>
          <DialogDescription className="line-clamp-2 text-foreground/70">{title}</DialogDescription>

          <div className="mt-2 grid grid-cols-4 gap-1">
            {targets.map((tg) => (
              <a key={tg.key} href={tg.href} target="_blank" rel="noopener noreferrer" className={tile} onClick={() => setOpen(false)}>
                <span className={bubble} style={{ background: tg.color, color: tg.fg ?? "#fff" }}>
                  {ICONS[tg.key]}
                </span>
                {tg.label}
              </a>
            ))}
            <a
              href={`mailto:?subject=${e(title)}&body=${e(`${message}\n\n${shareUrl}`)}`}
              className={tile}
              onClick={() => setOpen(false)}
            >
              <span className={`${bubble} bg-secondary text-secondary-foreground`}>
                <Mail className="h-6 w-6" aria-hidden="true" />
              </span>
              E-mail
            </a>
          </div>

          <div className="mt-3 flex items-center gap-2 rounded-full border border-border bg-background/60 p-1.5 pl-4">
            <span className="min-w-0 flex-1 truncate text-sm text-foreground/70">{shareUrl.replace(/^https?:\/\//, "")}</span>
            <button
              type="button"
              onClick={copy}
              className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-ink px-4 text-sm font-bold text-surface"
            >
              {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Link2 className="h-4 w-4" aria-hidden="true" />}
              {t("outfit.copyLink")}
            </button>
          </div>
          <p className="text-xs text-foreground/60">{t("share.instagramHint")}</p>
        </DialogContent>
      </Dialog>
    </>
  );
}
