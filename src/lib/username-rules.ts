// Règles de username partagées entre le formulaire d'inscription (retour
// immédiat à l'utilisateur) et la création du profil côté serveur (seule
// vérification qui compte réellement, car celle du navigateur est contournable).

export const USERNAME_PATTERN = /^[a-z0-9_.]{3,30}$/;

// Noms pouvant faire passer quelqu'un pour le site ou son équipe.
const RESERVED_USERNAMES = new Set([
  "admin",
  "administrator",
  "wantedfashion",
  "wanted",
  "wanted.fashion",
  "support",
  "contact",
  "moderator",
  "staff",
  "official",
  "team",
]);

export function isReservedUsername(username: string): boolean {
  return RESERVED_USERNAMES.has(username);
}
