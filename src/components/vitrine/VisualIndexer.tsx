import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/i18n";
import { indexPostImage, VISUAL_MODEL } from "@/lib/visual-embedding";

type Missing = { id: string; cover_image: string | null };

/**
 * Rattrapage des « empreintes visuelles » manquantes.
 * Créateur : ses propres tenues, en silence. Admin : toutes les tenues, avec un bouton et la progression.
 */
export function VisualIndexer() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [progress, setProgress] = useState<{ done: number; total: number; failed: number } | null>(null);
  const autoStarted = useRef(false);

  const { data: isAdmin } = useQuery({
    queryKey: ["is-admin", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("creators").select("is_admin").eq("id", user!.id).maybeSingle();
      return !!(data as { is_admin?: boolean } | null)?.is_admin;
    },
  });

  const { data: missing } = useQuery({
    queryKey: ["missing-embeddings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("posts_missing_embedding" as never, { p_model: VISUAL_MODEL, p_limit: 300 } as never);
      if (error) throw error;
      return (data ?? []) as Missing[];
    },
  });

  async function run(list: Missing[]) {
    let done = 0;
    let failed = 0;
    setProgress({ done, total: list.length, failed });
    for (const p of list) {
      const ok = await indexPostImage(p.id, p.cover_image);
      done += 1;
      if (!ok) failed += 1;
      setProgress({ done, total: list.length, failed });
    }
    qc.invalidateQueries({ queryKey: ["missing-embeddings", user?.id] });
    qc.invalidateQueries({ queryKey: ["more-like-this"] });
  }

  // Créateur (non admin) : rattrapage automatique et invisible de ses tenues
  useEffect(() => {
    if (isAdmin !== false || !missing?.length || autoStarted.current) return;
    autoStarted.current = true;
    void run(missing);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, missing]);

  if (!isAdmin) return null;
  const running = progress && progress.done < progress.total;
  const count = missing?.length ?? 0;
  if (!count && !progress) return null;

  return (
    <div className="mb-6 rounded-2xl border border-border bg-card p-4">
      <p className="flex items-center gap-2 font-semibold">
        <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" /> {t("visual.title")}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">{t("visual.text")}</p>
      {progress ? (
        <p className="mt-3 text-sm font-medium" aria-live="polite">
          {running ? `${t("visual.running")} ${progress.done}/${progress.total}` : `${t("visual.done")} ${progress.done - progress.failed}/${progress.total}`}
          {progress.failed > 0 && ` · ${t("visual.failed")} ${progress.failed}`}
        </p>
      ) : null}
      {!running && count > 0 && (
        <button
          type="button"
          onClick={() => missing && run(missing)}
          className="mt-3 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-surface hover:bg-ink/85"
        >
          {t("visual.button")} ({count})
        </button>
      )}
    </div>
  );
}
