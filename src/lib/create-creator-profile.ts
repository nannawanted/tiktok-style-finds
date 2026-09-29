import { createServerFn } from "@tanstack/react-start";

type Result = { ok: true } | { ok: false; error: string };

// Créer la ligne creator via le service role plutôt que le client
// authentifié : au moment de l'inscription, si la confirmation d'email est
// activée, l'utilisateur n'a pas encore de session active (auth.uid() est
// vide), donc un insert classique soumis aux policies RLS échouerait.
export const createCreatorProfile = createServerFn({ method: "POST" })
  .inputValidator((data: { userId: string; username: string }) => data)
  .handler(async ({ data }): Promise<Result> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin.from("creators").insert({
      id: data.userId,
      username: data.username,
    });

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  });
