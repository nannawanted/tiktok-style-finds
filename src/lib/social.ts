import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./auth-context";
import { cleanStyles, type StyleKey } from "./styles";
import { fetchMutualSuggestions, type CreatorCard, type SuggestedCreator } from "./public-data";

// « Enregistrer » une tenue et « suivre » un créateur. Les données sont privées :
// la base ne laisse chacun lire et modifier que ses propres lignes.

export function useSavedIds() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["saved-ids", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("saves").select("post_id").eq("user_id", user!.id);
      if (error) throw error;
      return new Set((data ?? []).map((r) => r.post_id));
    },
  });
}

export function useToggleSave() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, saved }: { postId: string; saved: boolean }) => {
      if (!user) throw new Error("not_logged_in");
      const res = saved
        ? await supabase.from("saves").delete().eq("user_id", user.id).eq("post_id", postId)
        : await supabase.from("saves").insert({ user_id: user.id, post_id: postId });
      if (res.error) throw res.error;
    },
    onMutate: async ({ postId, saved }) => {
      const key = ["saved-ids", user?.id];
      const prev = qc.getQueryData<Set<string>>(key);
      const next = new Set(prev ?? []);
      if (saved) next.delete(postId);
      else next.add(postId);
      qc.setQueryData(key, next);
      return { prev, key };
    },
    onError: (_e, _v, ctx) => {
      if (ctx) qc.setQueryData(ctx.key, ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["saved-ids", user?.id] });
      qc.invalidateQueries({ queryKey: ["saved-outfits", user?.id] });
    },
  });
}

export function useFollowedIds() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["followed-ids", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("follows").select("creator_id").eq("follower_id", user!.id);
      if (error) throw error;
      return new Set((data ?? []).map((r) => r.creator_id));
    },
  });
}

/** Qui me suit (pour savoir qui est « ami » = on se suit mutuellement). */
export function useMyFollowerIds() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-follower-ids", user?.id],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from("follows").select("follower_id").eq("creator_id", user!.id).limit(5000);
      if (error) throw error;
      return new Set((data ?? []).map((r) => r.follower_id));
    },
  });
}

/** Amis = personnes que je suis ET qui me suivent. */
export function useFriendIds() {
  const { data: following } = useFollowedIds();
  const { data: followers } = useMyFollowerIds();
  if (!following || !followers) return undefined;
  return new Set([...following].filter((id) => followers.has(id)));
}

export function useToggleFollow() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ creatorId, following }: { creatorId: string; following: boolean }) => {
      if (!user) throw new Error("not_logged_in");
      const res = following
        ? await supabase.from("follows").delete().eq("follower_id", user.id).eq("creator_id", creatorId)
        : await supabase.from("follows").insert({ follower_id: user.id, creator_id: creatorId });
      if (res.error) throw res.error;
    },
    onMutate: async ({ creatorId, following }) => {
      const key = ["followed-ids", user?.id];
      const prev = qc.getQueryData<Set<string>>(key);
      const next = new Set(prev ?? []);
      if (following) next.delete(creatorId);
      else next.add(creatorId);
      qc.setQueryData(key, next);
      return { prev, key };
    },
    onError: (_e, _v, ctx) => {
      if (ctx) qc.setQueryData(ctx.key, ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["followed-ids", user?.id] });
      qc.invalidateQueries({ queryKey: ["following-feed", user?.id] });
      qc.invalidateQueries({ queryKey: ["follow-counts"] });
      // Les listes d'abonnés/abonnements ne sont PAS rechargées tout de suite :
      // comme sur Instagram, la personne reste affichée (bouton « Suivre ») pour
      // pouvoir se réabonner en cas d'erreur. La liste est relue à la prochaine ouverture.
    },
  });
}

// ——— Centres d'intérêt (fil « Pour toi ») ———

export function useMyInterests() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-interests", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("creators").select("interests").eq("id", user!.id).maybeSingle();
      if (error) throw error;
      return cleanStyles(data?.interests);
    },
  });
}

export function useSetInterests() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (interests: StyleKey[]) => {
      if (!user) throw new Error("not_logged_in");
      const { error } = await supabase.from("creators").update({ interests }).eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-interests", user?.id] });
      qc.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}

/** Combien de fois chaque style apparaît dans les tenues que j'ai likées. */
export function useLikedStyles() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["liked-styles", user?.id],
    enabled: !!user,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from("saves").select("posts(styles)").eq("user_id", user!.id).limit(300);
      if (error) throw error;
      const counts: Partial<Record<StyleKey, number>> = {};
      for (const row of data ?? []) {
        const styles = (row as { posts: { styles: string[] | null } | null }).posts?.styles;
        for (const s of cleanStyles(styles)) counts[s] = (counts[s] ?? 0) + 1;
      }
      return counts;
    },
  });
}

// ——— Collections ———

export type Collection = { id: string; name: string; created_at: string };

export function useCollections() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["collections", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("collections").select("id, name, created_at").eq("user_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Collection[];
    },
  });
}

/** Dans quelles collections se trouve cette tenue. */
export function usePostCollections(postId: string | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["post-collections", user?.id, postId],
    enabled: !!user && !!postId,
    queryFn: async () => {
      const { data, error } = await supabase.from("collection_items").select("collection_id").eq("post_id", postId!);
      if (error) throw error;
      return new Set((data ?? []).map((r) => r.collection_id));
    },
  });
}

export function useCollectionActions() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const refresh = (postId?: string) => {
    qc.invalidateQueries({ queryKey: ["collections", user?.id] });
    qc.invalidateQueries({ queryKey: ["collection-items"] });
    if (postId) qc.invalidateQueries({ queryKey: ["post-collections", user?.id, postId] });
  };
  return {
    create: async (name: string) => {
      if (!user) throw new Error("not_logged_in");
      const { data, error } = await supabase.from("collections").insert({ user_id: user.id, name: name.trim().slice(0, 40) }).select("id, name, created_at").single();
      if (error) throw error;
      refresh();
      return data as Collection;
    },
    toggle: async (collectionId: string, postId: string, inside: boolean) => {
      const res = inside
        ? await supabase.from("collection_items").delete().eq("collection_id", collectionId).eq("post_id", postId)
        : await supabase.from("collection_items").insert({ collection_id: collectionId, post_id: postId });
      if (res.error) throw res.error;
      refresh(postId);
    },
    remove: async (collectionId: string) => {
      const { error } = await supabase.from("collections").delete().eq("id", collectionId);
      if (error) throw error;
      refresh();
    },
  };
}

// ——— Notifications ———

export type NotificationRow = {
  id: string;
  type: "new_post" | "new_follower" | "likes_milestone";
  actor_id: string | null;
  post_id: string | null;
  count: number | null;
  created_at: string;
  read_at: string | null;
};

export function useNotifications() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("id, type, actor_id, post_id, count, created_at, read_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(60);
      if (error) throw error;
      return (data ?? []) as NotificationRow[];
    },
  });
}

export function useMarkNotificationsRead() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", user.id).is("read_at", null);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications", user?.id] }),
  });
}

// ——— Suggestions de créateurs à suivre ———

/**
 * Connecté : d'abord les créateurs suivis par des personnes que je suis
 * (« Suivi par @x et 2 autres »), complétés par la liste par défaut.
 * Visiteur : la liste par défaut.
 */
export function useCreatorSuggestions(fallback: CreatorCard[]) {
  const { user } = useAuth();
  const { data: followed } = useFollowedIds();
  const { data: myFollowers } = useMyFollowerIds();
  const followedList = [...(followed ?? [])];
  const { data: mutual } = useQuery({
    queryKey: ["mutual-suggestions", user?.id, followedList.length, myFollowers?.size ?? 0],
    enabled: !!user && !!followed && !!myFollowers,
    queryFn: () => fetchMutualSuggestions(user!.id, followedList, 12, [...(myFollowers ?? [])]),
  });
  if (!user) return { creators: fallback as SuggestedCreator[], personal: false };
  const exclude = new Set([user.id, ...followedList]);
  const list: SuggestedCreator[] = [...(mutual ?? [])];
  for (const c of fallback) if (!exclude.has(c.id) && !list.some((m) => m.id === c.id)) list.push(c);
  return { creators: list.slice(0, 12), personal: (mutual ?? []).length > 0 };
}
