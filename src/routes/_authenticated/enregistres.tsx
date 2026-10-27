import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/i18n";
import { fetchOutfitsByIds } from "@/lib/public-data";
import { useCollectionActions, useCollections } from "@/lib/social";
import { OutfitGrid, OutfitGridSkeleton } from "@/components/vitrine/OutfitCard";
import { EmptyBox } from "@/components/vitrine/EmptyBox";

type Search = { collection?: string };

export const Route = createFileRoute("/_authenticated/enregistres")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    collection: typeof s.collection === "string" && /^[0-9a-f-]{36}$/i.test(s.collection) ? s.collection : undefined,
  }),
  head: () => ({ meta: [{ title: "Mes tenues enregistrées | WantedFashion" }, { name: "robots", content: "noindex" }] }),
  component: SavedPage,
});

function SavedPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate({ from: "/enregistres" });
  const { collection } = Route.useSearch();
  const { data: collections } = useCollections();
  const actions = useCollectionActions();
  const current = collections?.find((c) => c.id === collection) ?? null;

  const { data, isLoading } = useQuery({
    queryKey: collection ? ["collection-items", collection] : ["saved-outfits", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: rows, error } = collection
        ? await supabase.from("collection_items").select("post_id").eq("collection_id", collection).order("created_at", { ascending: false })
        : await supabase.from("saves").select("post_id").eq("user_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return fetchOutfitsByIds((rows ?? []).map((r) => r.post_id));
    },
  });

  const chip = (active: boolean) =>
    `shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors ${
      active ? "bg-ink text-surface" : "border border-border bg-surface text-foreground hover:border-foreground/40"
    }`;

  return (
    <main className="mx-auto max-w-7xl px-4 pt-6 md:px-6 md:pt-10">
      <h1 className="font-display fade-up mb-5 text-4xl font-bold">{current ? current.name : t("savedPage.title")}</h1>

      <div className="no-scrollbar -mx-4 mb-6 flex gap-2 overflow-x-auto px-4" role="group" aria-label={t("engage.collections")}>
        <button type="button" aria-pressed={!collection} className={chip(!collection)} onClick={() => navigate({ search: {} })}>
          {t("engage.allSaved")}
        </button>
        {(collections ?? []).map((c) => (
          <button key={c.id} type="button" aria-pressed={collection === c.id} className={chip(collection === c.id)} onClick={() => navigate({ search: { collection: c.id } })}>
            {c.name}
          </button>
        ))}
      </div>

      {current && (
        <button
          type="button"
          onClick={async () => {
            if (!window.confirm(t("engage.deleteCollectionConfirm"))) return;
            try {
              await actions.remove(current.id);
              navigate({ search: {} });
            } catch {
              toast.error(t("card.actionError"));
            }
          }}
          className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-foreground/65 hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" /> {t("engage.deleteCollection")}
        </button>
      )}

      {isLoading || !user ? (
        <OutfitGridSkeleton />
      ) : data && data.length ? (
        <OutfitGrid outfits={data} />
      ) : (
        <EmptyBox text={collection ? t("engage.emptyCollection") : t("savedPage.empty")} action={{ to: "/explorer", label: t("nav2.explore") }} />
      )}
    </main>
  );
}
