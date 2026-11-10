import { useEffect, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";

/**
 * Fine barre de chargement en haut de l'écran pendant qu'une page se charge, comme sur YouTube ou GitHub :
 * dès le clic, on voit que la demande est prise en compte, même si la page met un moment à arriver.
 */
export function NavProgress() {
  const loading = useRouterState({ select: (s) => s.status === "pending" || s.isLoading });
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (loading) {
      setVisible(true);
      setWidth(12);
      // Avance vite au début puis ralentit, sans jamais atteindre la fin tant que la page n'est pas là
      timer.current = setInterval(() => setWidth((w) => (w < 90 ? w + (90 - w) * 0.12 : w)), 180);
      return () => {
        if (timer.current) clearInterval(timer.current);
      };
    }
    if (!visible) return;
    setWidth(100);
    const hide = setTimeout(() => {
      setVisible(false);
      setWidth(0);
    }, 260);
    return () => clearTimeout(hide);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px]"
      style={{ opacity: visible ? 1 : 0, transition: "opacity 200ms" }}
    >
      <div className="h-full rounded-r-full bg-primary shadow-[0_0_8px_var(--primary)]" style={{ width: `${width}%`, transition: "width 200ms ease-out" }} />
    </div>
  );
}
