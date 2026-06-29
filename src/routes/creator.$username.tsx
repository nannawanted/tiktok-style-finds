import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/creator/$username")({
  ssr: false,
  head: ({ params }) => ({
    meta: [
      { title: `@${params.username} — Wanted Fashion` },
      { name: "description", content: `Découvre les outfits de @${params.username} sur Wanted Fashion.` },
      { property: "og:title", content: `@${params.username} — Wanted Fashion` },
      { property: "og:url", content: `/creator/${params.username}` },
    ],
    links: [{ rel: "canonical", href: `/creator/${params.username}` }],
  }),
  component: CreatorPage,
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-2xl p-10 text-center text-muted-foreground">{error.message}</div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl p-10 text-center text-muted-foreground">Créateur introuvable.</div>
  ),
});

function CreatorPage() {
  const { username } = Route.useParams();

  const { data, isLoading, error } = useQuery({
    queryKey: ["creator", username],
    queryFn: async () => {
      const { data: creator, error: e1 } = await supabase
        .from("creators")
        .select("*")
        .eq("username", username)
        .maybeSingle();
      if (e1) throw e1;
      if (!creator) throw notFound();

      const { data: posts, error: e2 } = await supabase
        .from("posts")
        .select("id, title, cover_image, creator_username, products(id)")
        .eq("creator_id", creator.id)
        .order("created_at", { ascending: false });
      if (e2) throw e2;
      return { creator, posts: posts ?? [] };
    },
  });

  if (isLoading) {
    return (
      <main className="mx-auto max-w-6xl px-4 pb-10">
        <Skeleton className="aspect-[5/1] w-full rounded-xl" />
        <div className="mt-6 flex items-center gap-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <Skeleton className="h-6 w-40" />
        </div>
      </main>
    );
  }

  if (error || !data) return null;
  const { creator, posts } = data;

  return (
    <main className="mx-auto max-w-6xl px-4 pb-10">
      <div className="relative -mx-4 sm:mx-0 sm:rounded-xl overflow-hidden bg-muted aspect-[5/1.5] sm:aspect-[5/1]">
        {creator.banner_image ? (
          <img src={creator.banner_image} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-muted to-secondary" />
        )}
      </div>

      <div className="-mt-10 flex flex-col items-center gap-3 px-4 text-center sm:-mt-12">
        <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-background bg-muted shadow-card sm:h-28 sm:w-28">
          {creator.profile_image ? (
            <img src={creator.profile_image} alt={creator.username} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-muted-foreground">
              {creator.username[0]?.toUpperCase()}
            </div>
          )}
        </div>
        <h1 className="text-xl font-black sm:text-2xl">@{creator.username}</h1>
        {creator.bio && (
          <p className="max-w-md text-sm text-muted-foreground">{creator.bio}</p>
        )}
      </div>

      <div className="mt-8">
        {posts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
            Ce créateur n'a pas encore publié.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {posts.map((p) => (
              <Link
                key={p.id}
                to="/post/$id"
                params={{ id: p.id }}
                className="group block overflow-hidden rounded-xl border border-border bg-card shadow-card transition hover:shadow-card-hover"
              >
                <div className="aspect-[4/5] w-full overflow-hidden bg-muted">
                  {p.cover_image ? (
                    <img src={p.cover_image} alt={p.title} loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-[1.03]" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">Pas d'image</div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="line-clamp-2 text-sm font-semibold">{p.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{p.products?.length ?? 0} produit{(p.products?.length ?? 0) > 1 ? "s" : ""}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
