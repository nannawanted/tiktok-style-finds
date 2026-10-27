import { createContext, useContext, useState, type ReactNode } from "react";
import { Check, FolderPlus, Plus } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from "@/lib/i18n";
import { useCollectionActions, useCollections, usePostCollections } from "@/lib/social";

type PickerCtx = { open: (postId: string) => void };
const Ctx = createContext<PickerCtx>({ open: () => {} });

/** Ouvre la fenêtre « Ajouter à une collection » depuis n'importe où. */
export function useCollectionPicker() {
  return useContext(Ctx);
}

export function CollectionPickerProvider({ children }: { children: ReactNode }) {
  const [postId, setPostId] = useState<string | null>(null);
  return (
    <Ctx.Provider value={{ open: setPostId }}>
      {children}
      <CollectionPickerDialog postId={postId} onClose={() => setPostId(null)} />
    </Ctx.Provider>
  );
}

function CollectionPickerDialog({ postId, onClose }: { postId: string | null; onClose: () => void }) {
  const { t } = useTranslation();
  const { data: collections } = useCollections();
  const { data: inside } = usePostCollections(postId);
  const actions = useCollectionActions();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function create() {
    if (!postId || !name.trim()) return;
    setBusy(true);
    try {
      const c = await actions.create(name);
      await actions.toggle(c.id, postId, false);
      setName("");
    } catch {
      toast.error(t("card.actionError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={!!postId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-[calc(100vw-24px)] max-w-md grid-cols-1 rounded-3xl border-border bg-surface p-5 [&>*]:min-w-0">
        <DialogTitle className="font-display text-2xl">{t("engage.addToCollection")}</DialogTitle>
        <DialogDescription className="sr-only">{t("engage.collections")}</DialogDescription>

        <ul className="max-h-[45vh] overflow-y-auto">
          {(collections ?? []).length === 0 && <li className="py-3 text-sm text-foreground/60">{t("engage.noCollections")}</li>}
          {(collections ?? []).map((c) => {
            const isIn = !!inside?.has(c.id);
            return (
              <li key={c.id}>
                <button
                  type="button"
                  aria-pressed={isIn}
                  onClick={() => postId && actions.toggle(c.id, postId, isIn).catch(() => toast.error(t("card.actionError")))}
                  className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left font-semibold hover:bg-card"
                >
                  <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${isIn ? "bg-primary text-primary-foreground" : "bg-card text-foreground/70"}`}>
                    {isIn ? <Check className="h-4 w-4" aria-hidden="true" /> : <FolderPlus className="h-4 w-4" aria-hidden="true" />}
                  </span>
                  <span className="truncate">{c.name}</span>
                </button>
              </li>
            );
          })}
        </ul>

        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            create();
          }}
        >
          <label className="sr-only" htmlFor="new-collection">
            {t("engage.newCollection")}
          </label>
          <input
            id="new-collection"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            placeholder={t("engage.collectionName")}
            className="h-11 min-w-0 flex-1 rounded-full border border-border bg-background/60 px-4 text-sm outline-none focus:border-foreground/50"
          />
          <button type="submit" disabled={busy || !name.trim()} className="inline-flex h-11 items-center gap-1 rounded-full bg-ink px-4 text-sm font-bold text-surface disabled:opacity-50">
            <Plus className="h-4 w-4" aria-hidden="true" /> {t("engage.create")}
          </button>
        </form>
        <button type="button" onClick={onClose} className="h-11 rounded-full border border-border text-sm font-bold">
          {t("engage.done")}
        </button>
      </DialogContent>
    </Dialog>
  );
}
