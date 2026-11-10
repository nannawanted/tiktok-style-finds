// Vérification anti-robot (Cloudflare Turnstile) sur l'inscription et la connexion.
// Elle n'est vraiment obligatoire qu'une fois « Enable CAPTCHA protection » activé dans Supabase
// (Authentication > Attack Protection, fournisseur Turnstile, avec la clé secrète).
// Tant que ce n'est pas fait, le jeton est envoyé mais pas vérifié : rien ne peut bloquer la connexion.
export const CAPTCHA_ENABLED = true;
