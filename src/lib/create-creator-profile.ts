import { createServerFn } from "@tanstack/react-start";
import { USERNAME_PATTERN, isReservedUsername } from "./username-rules";

type Result = { ok: true } | { ok: false; error: string };

// Le profil doit être créé juste après l'inscription : passé ce délai, cet
// endpoint ne sert plus à rien (et ne doit pas pouvoir être rejoué plus tard).
const MAX_ACCOUNT_AGE_MS = 15 * 60 * 1000;

// Créer la ligne creator via le service role plutôt que le client
// authentifié : au moment de l'inscription, si la confirmation d'email est
// activée, l'utilisateur n'a pas encore de session active (auth.uid() est
// vide), donc un insert classique soumis aux policies RLS échouerait.
//
// Comme cet endpoint est appelable sans session, il ne fait confiance qu'à
// l'identifiant du compte : le username est relu depuis les métadonnées
// enregistrées par Supabase Auth lors de l'inscription (jamais depuis la
// requête), puis re-validé ici — les vérifications faites dans le navigateur
// peuvent être contournées en appelant directement cette fonction.
export const createCreatorProfile = createServerFn({ method: "POST" })
  .inputValidator((data: { userId: string }) => data)
  .handler(async ({ data }): Promise<Result> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(data.userId);
    if (userError || !userData?.user) return { ok: false, error: "invalid_account" };

    const createdAt = new Date(userData.user.created_at).getTime();
    if (!Number.isFinite(createdAt) || Date.now() - createdAt > MAX_ACCOUNT_AGE_MS) {
      return { ok: false, error: "invalid_account" };
    }

    const rawUsername = userData.user.user_metadata?.username;
    const username = typeof rawUsername === "string" ? rawUsername.trim().toLowerCase() : "";
    if (!USERNAME_PATTERN.test(username) || isReservedUsername(username)) {
      return { ok: false, error: "invalid_username" };
    }

    const { error } = await supabaseAdmin.from("creators").insert({
      id: userData.user.id,
      username,
    });

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  });
