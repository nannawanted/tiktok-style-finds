/**
 * Mot de passe déjà apparu dans une fuite de données ? Même méthode que Supabase (option payante)
 * et 1Password : la base Have I Been Pwned, interrogée par « k-anonymat ». Seuls les 5 premiers
 * caractères de l'empreinte SHA-1 du mot de passe sont envoyés ; le mot de passe ne quitte jamais l'appareil.
 * https://haveibeenpwned.com/API/v3#PwnedPasswords
 * Renvoie true si le mot de passe a fuité, false sinon, null si la vérification n'a pas pu se faire.
 */
export async function isPwnedPassword(password: string): Promise<boolean | null> {
  try {
    const buf = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(password));
    const hash = Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { "Add-Padding": "true" }, // réponses de taille égale : rien ne fuit par la taille
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const body = await res.text();
    return body.split("\n").some((line) => {
      const [suf, count] = line.trim().split(":");
      return suf === suffix && Number(count) > 0;
    });
  } catch {
    return null;
  }
}
