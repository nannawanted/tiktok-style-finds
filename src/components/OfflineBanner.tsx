import { useEffect, useState } from "react";
import { Wifi, WifiOff } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

/**
 * Bandeau « Tu es hors ligne » en haut de l'écran (comme Instagram / YouTube),
 * puis « De retour en ligne » quelques secondes quand la connexion revient.
 * Les données se rechargent toutes seules au retour de la connexion.
 */
export function OfflineBanner() {
  const { t } = useTranslation();
  const [state, setState] = useState<"online" | "offline" | "back">("online");
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const off = () => {
      clearTimeout(timer);
      setState("offline");
    };
    const on = () => {
      setState("back");
      timer = setTimeout(() => setState("online"), 2500);
    };
    if (!navigator.onLine) setState("offline");
    window.addEventListener("offline", off);
    window.addEventListener("online", on);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("offline", off);
      window.removeEventListener("online", on);
    };
  }, []);
  if (state === "online") return null;
  const offline = state === "offline";
  return (
    <div role="status" className="pointer-events-none fixed inset-x-0 top-[calc(10px+env(safe-area-inset-top,0px))] z-[60] flex justify-center px-4">
      <span className={`fade-up inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold shadow-lg ${offline ? "bg-ink text-surface" : "bg-emerald-600 text-white"}`}>
        {offline ? <WifiOff className="h-4 w-4" aria-hidden="true" /> : <Wifi className="h-4 w-4" aria-hidden="true" />}
        {offline ? t("net.offline") : t("net.backOnline")}
      </span>
    </div>
  );
}
