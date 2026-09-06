import { createServerFn } from "@tanstack/react-start";

type DeleteAccountResult =
  | { ok: true }
  | { ok: false; reason: "unauthorized" };

// Le client envoie son propre access token (récupéré via supabase.auth.getSession()) ;
// on ne fait jamais confiance à un userId fourni tel quel par le client.
export const deleteAccount = createServerFn({ method: "POST" })
  .inputValidator((data: { accessToken: string }) => data)
  .handler(async ({ data }): Promise<DeleteAccountResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: userData, error } = await supabaseAdmin.auth.getUser(data.accessToken);
    if (error || !userData?.user) return { ok: false, reason: "unauthorized" };

    const userId = userData.user.id;

    // Supprime la ligne creator : cascade automatiquement sur posts → products
    // → clicks/sales (contraintes déjà en place en base).
    await supabaseAdmin.from("creators").delete().eq("id", userId);
    await supabaseAdmin.auth.admin.deleteUser(userId);

    return { ok: true };
  });
