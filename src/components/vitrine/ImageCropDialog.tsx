import { useCallback, useEffect, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from "@/lib/i18n";

const MAX_OUTPUT = 1600; // px, côté le plus long de l'image recadrée

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function cropToBlob(src: string, area: Area): Promise<Blob> {
  const img = await loadImage(src);
  const scale = Math.min(1, MAX_OUTPUT / Math.max(area.width, area.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(area.width * scale);
  canvas.height = Math.round(area.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("blob"))), "image/jpeg", 0.9),
  );
}

/**
 * Fenêtre de recadrage affichée après le choix d'une image (photo de profil,
 * bannière, couverture). Renvoie un fichier JPEG recadré, ou le fichier
 * d'origine si on choisit « Garder l'original ».
 */
export function ImageCropDialog({
  file,
  aspect,
  round = false,
  onCancel,
  onDone,
}: {
  file: File | null;
  aspect: number;
  round?: boolean;
  onCancel: () => void;
  onDone: (file: File) => void;
}) {
  const { t } = useTranslation();
  const [src, setSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!file) {
      setSrc(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setSrc(url);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const onComplete = useCallback((_a: Area, pixels: Area) => setArea(pixels), []);

  async function confirm() {
    if (!src || !area) return;
    setBusy(true);
    try {
      const blob = await cropToBlob(src, area);
      onDone(new File([blob], "image.jpg", { type: "image/jpeg" }));
    } catch {
      if (file) onDone(file);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={!!file} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="w-[calc(100vw-24px)] max-w-lg grid-cols-1 rounded-3xl border-border bg-surface p-5 [&>*]:min-w-0">
        <DialogTitle className="font-display text-2xl">{t("crop.title")}</DialogTitle>
        <DialogDescription className="text-foreground/70">{t("crop.hint")}</DialogDescription>
        <div className="relative mt-2 h-[min(60vh,420px)] w-full overflow-hidden rounded-2xl bg-ink">
          {src && (
            <Cropper
              image={src}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              cropShape={round ? "round" : "rect"}
              showGrid={!round}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onComplete}
            />
          )}
        </div>
        <label className="mt-3 flex items-center gap-3 text-sm font-semibold">
          {t("crop.zoom")}
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-[var(--color-primary)]"
          />
        </label>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button type="button" onClick={onCancel} className="h-11 rounded-full px-4 text-sm font-semibold hover:bg-card">
            {t("crop.cancel")}
          </button>
          {file && (
            <button type="button" onClick={() => onDone(file)} className="h-11 rounded-full border border-border px-4 text-sm font-semibold hover:bg-card">
              {t("crop.original")}
            </button>
          )}
          <button
            type="button"
            disabled={busy || !area}
            onClick={confirm}
            className="h-11 rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground disabled:opacity-60"
          >
            {t("crop.confirm")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
