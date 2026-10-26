import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./auth-context";

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
      qc.invalidateQueries({ queryKey: ["follow-list"] });
    },
  });
}
