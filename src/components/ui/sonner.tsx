import { Toaster as Sonner } from "sonner";
import { CircleAlert, CircleCheck, Info, Loader2 } from "lucide-react";

type ToasterProps = React.ComponentProps<typeof Sonner>;

/**
 * Petites notifications, façon Instagram : une pastille sombre et arrondie en bas
 * de l'écran, une icône, un texte court. Disparaît toute seule.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      position="bottom-center"
      offset={20}
      mobileOffset={{ bottom: "calc(16px + env(safe-area-inset-bottom, 0px))" }}
      gap={8}
      duration={3200}
      icons={{
        success: <CircleCheck className="h-5 w-5 text-emerald-400" aria-hidden="true" />,
        error: <CircleAlert className="h-5 w-5 text-[#ff8a80]" aria-hidden="true" />,
        info: <Info className="h-5 w-5 text-surface/80" aria-hidden="true" />,
        warning: <CircleAlert className="h-5 w-5 text-amber-300" aria-hidden="true" />,
        loading: <Loader2 className="h-5 w-5 animate-spin text-surface/80" aria-hidden="true" />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "flex w-full items-center gap-3 rounded-[22px] bg-ink/95 px-4 py-3.5 text-surface shadow-[0_18px_40px_-12px_rgba(30,15,8,.55)] ring-1 ring-white/5 backdrop-blur-md sm:w-[380px]",
          title: "text-[14.5px] font-semibold leading-snug",
          description: "mt-0.5 text-[13px] leading-snug text-surface/70",
          icon: "flex shrink-0 items-center",
          content: "min-w-0 flex-1",
          actionButton: "shrink-0 rounded-full bg-surface px-3.5 py-2 text-[13px] font-bold text-ink",
          cancelButton: "shrink-0 rounded-full px-3 py-2 text-[13px] font-semibold text-surface/70",
          closeButton: "hidden",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
