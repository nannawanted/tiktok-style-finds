// Vérification anti-bot (Cloudflare Turnstile) sur l'inscription et la connexion.
// Désactivée temporairement à la demande de Nana. Pour la remettre :
//   1. passer CAPTCHA_ENABLED à true ici,
//   2. réactiver « Enable CAPTCHA protection » dans Supabase
//      (Authentication > Attack Protection), avec la clé secrète Turnstile.
export const CAPTCHA_ENABLED = false;
