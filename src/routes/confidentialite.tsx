import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/confidentialite")({
  head: () => ({ meta: [{ title: "Politique de confidentialité — Wanted Fashion" }] }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10 text-sm leading-relaxed text-foreground">
      <h1 className="mb-2 text-2xl font-black">Politique de confidentialité</h1>
      <p className="mb-8 text-xs text-muted-foreground">
        Dernière mise à jour : {new Date().toLocaleDateString("fr-FR")}. Ce document n'a pas été rédigé ou relu par un
        juriste — il décrit de bonne foi ce que le site fait réellement, mais ne constitue pas un avis juridique.
      </p>

      <h2 className="mb-2 mt-6 font-bold">Qui sommes-nous</h2>
      <p className="mb-4">
        Wanted Fashion est une plateforme permettant à des créateurs de partager des tenues et des produits, avec des
        liens d'achat vers des marques partenaires. Pour toute question sur cette politique, contactez{" "}
        <a href="mailto:nannawanted@gmail.com" className="text-brand underline">nannawanted@gmail.com</a>.
      </p>

      <h2 className="mb-2 mt-6 font-bold">Données que nous collectons</h2>
      <p className="mb-2">Selon votre usage du site :</p>
      <ul className="mb-4 list-disc space-y-1 pl-5">
        <li><strong>Visiteurs</strong> : adresse IP et navigateur au moment d'un clic sur un produit (pour le suivi d'affiliation), avec votre consentement.</li>
        <li><strong>Créateurs inscrits</strong> : adresse email, nom d'utilisateur, mot de passe (jamais stocké en clair), photo de profil et bannière, bio, les posts et produits que vous publiez.</li>
        <li><strong>Ventes et commissions</strong> : si vous êtes créateur, les ventes générées par vos liens et les montants qui vous sont dus.</li>
      </ul>

      <h2 className="mb-2 mt-6 font-bold">Pourquoi nous les collectons</h2>
      <ul className="mb-4 list-disc space-y-1 pl-5">
        <li>Faire fonctionner le compte créateur et afficher vos posts publiquement.</li>
        <li>Savoir qu'un achat vient d'un lien affiché sur le site, pour calculer les commissions dues aux créateurs et à Wanted Fashion.</li>
        <li>Détecter les tentatives de fraude (fausses ventes, clics anormaux) — voir la section Sécurité ci-dessous.</li>
      </ul>

      <h2 className="mb-2 mt-6 font-bold">Cookies</h2>
      <p className="mb-2">Le site utilise deux cookies :</p>
      <ul className="mb-4 list-disc space-y-1 pl-5">
        <li><code>wf_consent</code> : mémorise votre choix sur ce bandeau. Toujours posé, indispensable au fonctionnement du bandeau lui-même.</li>
        <li><code>wf_aff</code> : posé uniquement si vous avez accepté, quand vous cliquez sur un produit. Il permet d'attribuer une vente au bon créateur si vous achetez ensuite chez la marque. Il expire après 30 jours.</li>
      </ul>
      <p className="mb-4">Vous pouvez refuser <code>wf_aff</code> via le bandeau ; le site reste utilisable normalement.</p>

      <h2 className="mb-2 mt-6 font-bold">Avec qui vos données sont partagées</h2>
      <ul className="mb-4 list-disc space-y-1 pl-5">
        <li><strong>Marques partenaires</strong> : lorsqu'un achat est réalisé via un lien du site, la marque connaît le fait qu'une vente a eu lieu via Wanted Fashion (aucune donnée personnelle vous concernant ne lui est transmise au-delà de ce qu'elle collecte déjà pour votre commande).</li>
        <li><strong>Hébergeurs techniques</strong> : Supabase (base de données) et Vercel (hébergement du site), qui traitent les données pour notre compte.</li>
        <li>Nous ne vendons aucune donnée à des tiers.</li>
      </ul>

      <h2 className="mb-2 mt-6 font-bold">Sécurité et détection de fraude</h2>
      <p className="mb-4">
        Pour protéger les créateurs et les marques, le site analyse automatiquement certains signaux (adresse IP au
        moment d'un clic, taux de conversion) afin de repérer des ventes potentiellement frauduleuses avant qu'une
        commission ne soit versée. Ces vérifications portent uniquement sur l'activité liée aux liens d'affiliation.
      </p>

      <h2 className="mb-2 mt-6 font-bold">Combien de temps nous gardons vos données</h2>
      <p className="mb-4">
        Les données de compte sont conservées tant que le compte existe. Vous pouvez supprimer votre compte à tout
        moment depuis les paramètres de votre dashboard, ce qui supprime vos posts, produits et statistiques.
      </p>

      <h2 className="mb-2 mt-6 font-bold">Vos droits</h2>
      <p className="mb-4">
        Conformément au RGPD, vous pouvez demander l'accès, la rectification ou la suppression de vos données en
        écrivant à <a href="mailto:nannawanted@gmail.com" className="text-brand underline">nannawanted@gmail.com</a>.
      </p>
    </main>
  );
}
