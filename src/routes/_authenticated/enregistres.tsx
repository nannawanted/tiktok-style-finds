import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/i18n";
import { fetchOutfitsByIds } from "@/lib/public-data";
import { OutfitGrid, OutfitGridSkeleton } from "@/components/vitrine/OutfitCard";
import { EmptyBox } from "@/components/vitrine/EmptyBox";

export const Route = createFileRoute("/_authenticated/enregistres")({
  head: () => ({ meta: [{ title: "Mes tenues enregistrées | WantedFashion" }, { name: "robots", content: "noindex" }] }),
  component: SavedPage,
});

function SavedPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["saved-outfits", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("saves")
        .select("post_id")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return fetchOutfitsByIds((rows ?? []).map((r) => r.post_id));
    },
  });

  return (
    <main className="mx-auto max-w-7xl px-4 pt-6 md:px-6 md:pt-10">
      <h1 className="font-display fade-up mb-6 text-4xl font-bold">{t("savedPage.title")}</h1>
      {isLoading || !user ? (
        <OutfitGridSkeleton />
      ) : data && data.length ? (
        <OutfitGrid outfits={data} />
      ) : (
        <EmptyBox text={t("savedPage.empty")} action={{ to: "/explorer", label: t("nav2.explore") }} />
      )}
    </main>
  );
}
