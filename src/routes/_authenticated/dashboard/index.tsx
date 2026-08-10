import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  head: () => ({ meta: [{ title: "Dashboard — Wanted Fashion" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["my-posts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("id, title, cover_image, created_at, products(id)")
        .eq("creator_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("products").delete().eq("post_id", id);
      const { error } = await supabase.from("posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Post supprimé");
      qc.invalidateQueries({ queryKey: ["my-posts"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      {/* HEADER */}
      <div className="mb-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black sm:text-3xl">Mes posts</h1>
            <p className="text-sm text-muted-foreground">Gère tes outfits Wanted Fashion.</p>
          </div>
          <div className="flex gap-2">
            <Link to="/dashboard/settings">
              <Button variant="outline" size="sm">Paramètres</Button>
            </Link>
            <Link to="/dashboard/post/new">
              <Button size="sm" className="bg-brand text-brand-foreground hover:bg-brand/90">+ Nouveau post</Button>
            </Link>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : !data || data.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <p className="text-muted-foreground">Aucun post pour le moment.</p>
          <Link to="/dashboard/post/new" className="mt-4 inline-block">
            <Button className="bg-brand text-brand-foreground hover:bg-brand/90">Créer mon premier post</Button>
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {data.map((p) => (
            <li key={p.id} className="rounded-xl border border-border bg-card p-3 shadow-card">
              <div className="flex items-center gap-3">
                {/* IMAGE */}
                <div className="h-16 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
                  {p.cover_image ? (
                    <img src={p.cover_image} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                {/* TITRE + PRODUITS */}
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold">{p.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {p.products?.length ?? 0} produit{(p.products?.length ?? 0) > 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              {/* ACTIONS sur une ligne séparée sur mobile */}
              <div className="mt-2 flex flex-wrap gap-1 border-t border-border pt-2">
                <Link to="/post/$id" params={{ id: p.id }}>
                  <Button variant="ghost" size="sm">Aperçu</Button>
                </Link>
                <Link to="/dashboard/post/$id/edit" params={{ id: p.id }}>
                  <Button variant="ghost" size="sm">Éditer</Button>
                </Link>
                <Button
                  variant="ghost" size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/post/${p.id}`);
                    toast.success("URL copiée");
                  }}
                >
                  Copier URL
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-destructive">Supprimer</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Supprimer ce post ?</AlertDialogTitle>
                      <AlertDialogDescription>Cette action est définitive.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction onClick={() => del.mutate(p.id)}>Supprimer</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
