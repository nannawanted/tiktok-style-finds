# Wanted Fashion — Plan d'implémentation

## ⚠️ Point à clarifier avant de coder

Le projet Lovable est connecté à Supabase `lwgccuruqttsjjhyiikm` (les tables `creators`, `posts`, `products` y existent déjà avec les bonnes colonnes et RLS). Le brief mentionne un autre projet (`ogyobiirnieohmwrvzim`). **Je vais utiliser le Supabase déjà connecté** — c'est lui qui est câblé dans `.env` et `client.ts`. Dis-moi si tu veux qu'on bascule sur l'autre projet (il faudrait reconnecter).

## Design system

- Tokens dans `src/styles.css` : `--background` blanc, `--foreground` `#0A0A0A`, nouveau `--brand` `#FF3B5C` (en oklch), radius doux, ombre `--shadow-card` pour hover.
- Logo texte : "Wanted" foreground + "Fashion" brand, réutilisé dans header.
- Mobile-first, grilles 2 cols mobile / 3-4 desktop.
- Toasts/erreurs en français via `sonner`.

## Routes (TanStack Router, fichiers sous `src/routes/`)

Publiques (SSR on) :
- `index.tsx` → `/` feed global (loader = server fn publique lisant `posts` + count produits, ordonné `created_at desc`)
- `creator.$username.tsx` → `/creator/:username` (loader public : creator + ses posts)
- `post.$id.tsx` → `/post/:id` (loader public : post + creator + products triés par `position`) + embed TikTok via `<blockquote class="tiktok-embed">` + `https://www.tiktok.com/embed.js`
- `login.tsx`, `signup.tsx` (formulaire email/password + username unique → crée la ligne `creators`)

Protégées (sous `_authenticated/` — layout géré par l'intégration) :
- `_authenticated/dashboard/index.tsx` → liste de mes posts + bouton nouveau, actions Éditer/Aperçu/Supprimer/Copier URL
- `_authenticated/dashboard/post.new.tsx` et `_authenticated/dashboard/post.$id.edit.tsx` → formulaire post + produits dynamiques (react-hook-form + zod, validation FR)
- `_authenticated/dashboard/settings.tsx` → username / bio / profile_image / banner_image

Header global dans `__root.tsx` : logo, lien Accueil, et soit "Connexion" soit "Dashboard / Déconnexion" selon session (`supabase.auth.onAuthStateChange`).

## Data layer

- Lectures publiques : server fn avec client publishable (anon) — les policies SELECT public existent déjà.
- Lectures/écritures authentifiées : server fn avec `requireSupabaseAuth` (dashboard, create/update/delete posts & products, update creator profile).
- Signup : `supabase.auth.signUp` côté client, puis server fn protégée qui vérifie l'unicité du username et insère dans `creators` (id = `auth.uid()`).
- Mutations via TanStack Query (`useMutation` + invalidate des bonnes clés).
- Suppression post → cascade applicative : supprimer produits puis post (pas de FK cascade visible dans le schéma).

## Embed TikTok & script Skimlinks

- Ajouter le `<script src="https://s.skimresources.com/js/305412X1793617.skimlinks.js" async>` dans `__root.tsx` via `head().scripts` (note : ton brief est coupé, je suppose l'URL `.skimlinks.js`).
- Embed TikTok : `<blockquote class="tiktok-embed" cite={tiktok_url}>` + script `embed.js` chargé via effet client sur la page post.
- Tous les liens produits : `<a target="_blank" rel="noopener noreferrer">` pour que Skimlinks puisse les rewriter.

## SEO / head

- `head()` par route : titres FR ("Wanted Fashion — Accueil", "@username — Wanted Fashion", titre du post), descriptions, `og:title`/`og:description`/`og:image` (cover_image pour post, profile_image pour creator), canonical relatif.

## États UI

- Skeletons sur feed, profil, post, dashboard.
- Vides : "Aucun post pour le moment", "Ce créateur n'a pas encore publié", etc.
- Erreurs : `errorComponent` + `notFoundComponent` sur chaque route avec loader.

## Détails techniques

- Pas de nouvelle migration nécessaire (tables et policies OK).
- Username unique : check applicatif (`.select().eq('username', ...).maybeSingle()`) avant insert ; afficher erreur FR si pris.
- Validation zod : titre ≤ 120, URLs valides, prix string libre (le schéma stocke `text`), produit nom requis + affiliate_link URL requise.
- Composants shadcn utilisés : Button, Input, Textarea, Card, Dialog (confirm delete), Skeleton, Sonner.

Dis-moi si je dois changer de projet Supabase ou ajuster quoi que ce soit avant de construire.
