// Vérification anti-robot (Cloudflare Turnstile), seulement à l'inscription.
// Le jeton est vérifié par notre serveur (src/lib/create-creator-profile.ts) avec la clé secrète
// TURNSTILE_SECRET_KEY (variable d'environnement Vercel). Ne PAS activer « CAPTCHA protection »
// dans Supabase : elle s'appliquerait aussi à la connexion.
export const CAPTCHA_ENABLED = true;
