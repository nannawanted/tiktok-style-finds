import { Share2, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ShareButtonProps {
  /** Titre partagé (ex: le titre du post) */
  title: string;
  /** Texte descriptif optionnel partagé avec le lien */
  text?: string;
  /** URL absolue à partager. Par défaut : l'URL actuelle de la page. */
  url?: string;
  className?: string;
  iconClassName?: string;
}

/**
 * Bouton de partage réutilisable : utilise l'API Web Share native sur mobile
 * (partage vers Messages, WhatsApp, Instagram, etc.), et copie le lien dans
 * le presse-papiers en fallback (desktop / navigateurs non compatibles).
 *
 * A utiliser sur toute nouvelle page qui a besoin d'une fonction de partage.
 */
export function ShareButton({ title, text, url, className = "", iconClassName = "w-4 h-4" }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleShare(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    const shareUrl = url ?? (typeof window !== "undefined" ? window.location.href : "");

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text, url: shareUrl });
        return;
      } catch (err) {
        // L'utilisateur a annulé le partage natif, ou l'API a échoué : on retombe sur la copie.
        if ((err as Error)?.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Lien copié dans le presse-papiers");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Impossible de copier le lien");
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label="Partager"
      className={className || "w-9 h-9 rounded-full bg-background/30 backdrop-blur-sm flex items-center justify-center text-primary-foreground hover:bg-background/50 transition-colors duration-300"}
    >
      {copied ? <Check className={iconClassName} /> : <Share2 className={iconClassName} />}
    </button>
  );
}
