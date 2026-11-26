import { supabase } from "@/integrations/supabase/client";

/** RGPD (droit d'accès et à la portabilité) : télécharge toutes ses données dans un fichier JSON. */
export async function downloadMyData(): Promise<boolean> {
  const { data, error } = await supabase.rpc("export_my_data" as never);
  if (error || !data) return false;
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `wantedfashion-mes-donnees-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return true;
}
