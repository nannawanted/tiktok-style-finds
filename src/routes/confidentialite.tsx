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
        Dernière mise à jour : 3 novembre 2026. Ce document n'a pas été rédigé ou relu par un
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
        <li><strong>Activité sur le site (comptes connectés)</strong> : les looks que vous likez, les comptes que vous suivez, vos collections et les looks que vous signalez.</li>
        <li><strong>Recherches</strong> : quand quelqu'un ouvre un look après une recherche, nous enregistrons le texte cherché et le look ouvert, sans savoir qui a cherché. Cela sert à améliorer la recherche.</li>
        <li><strong>Statistiques de fréquentation</strong> : pages visitées, provenance (ex. : TikTok, Google), type d'appareil, mesurées avec PostHog (hébergé dans l'Union européenne). Sans votre accord au bandeau, aucun cookie n'est déposé pour cela ; avec votre accord, PostHog peut reconnaître une visite de retour. Aucun enregistrement d'écran, aucun nom ni e-mail n'est transmis.</li>
        <li><strong>Vues des looks</strong> : quand une page de look est ouverte, nous comptons une vue. Pour éviter les fausses vues, nous utilisons un identifiant anonyme enregistré dans votre navigateur et une empreinte chiffrée de l'adresse IP (jamais l'adresse en clair), effacée après 48 heures.</li>
        <li><strong>Photos des looks</strong> : une « empreinte » numérique de chaque photo publiée est calculée pour proposer des looks qui se ressemblent et pour la recherche par l'image.</li>
        <li><strong>Demandes « droits d'auteur »</strong> : si vous signalez une violation de vos droits, nous enregistrons votre nom, votre e-mail, votre signature, le contenu de la demande et une empreinte chiffrée de votre adresse IP (contre les abus). Ces informations servent à traiter la demande et à vous répondre. Le créateur concerné est informé de la raison du retrait ; votre nom et votre e-mail ne lui sont communiqués que si c'est strictement nécessaire. Elles sont conservées le temps de traiter la demande et les éventuels recours.</li>
        <li><strong>Ventes et commissions</strong> : si vous êtes créateur, les ventes générées par vos liens et les montants qui vous sont dus.</li>
      </ul>

      <h2 className="mb-2 mt-6 font-bold">Pourquoi nous les collectons</h2>
      <ul className="mb-4 list-disc space-y-1 pl-5">
        <li>Faire fonctionner le compte créateur et afficher vos posts publiquement.</li>
        <li>Savoir qu'un achat vient d'un lien affiché sur le site, pour calculer les commissions dues aux créateurs et à Wanted Fashion.</li>
        <li>Détecter les tentatives de fraude (fausses ventes, clics anormaux) — voir la section Sécurité ci-dessous.</li>
      </ul>

      <h2 id="cookies" className="mb-2 mt-6 scroll-mt-24 font-bold">Cookies et stockage dans le navigateur</h2>
      <p className="mb-2">
        <strong>Sans votre accord</strong>, seuls des éléments indispensables au fonctionnement du site, ou exemptés de
        consentement, sont enregistrés :
      </p>
      <ul className="mb-4 list-disc space-y-1 pl-5">
        <li><code>wf_consent</code> (cookie, 1 an) : mémorise votre choix sur le bandeau cookies.</li>
        <li>Session de connexion (stockage du navigateur, Supabase) : vous garde connecté si vous avez un compte.</li>
        <li><code>wf-lang</code> (stockage du navigateur) : la langue choisie (français ou anglais).</li>
        <li>Brouillon de look et préférences d'affichage (stockage du navigateur) : pour ne pas perdre ce que vous étiez en train de faire.</li>
        <li>
          <code>wf_device</code> (stockage du navigateur, 13 mois maximum, non prolongé à chaque visite) : un identifiant
          anonyme qui sert uniquement à compter les vues de nos looks sans compter deux fois la même personne. Il n'est
          utilisé que pour nos propres statistiques, jamais partagé ni utilisé sur d'autres sites : c'est une mesure
          d'audience exemptée de consentement selon les règles de la CNIL.
        </li>
      </ul>
      <p className="mb-2"><strong>Uniquement si vous acceptez</strong> sur le bandeau :</p>
      <ul className="mb-4 list-disc space-y-1 pl-5">
        <li><code>wf_aff</code> (cookie, 30 jours) : posé quand vous cliquez sur un produit, pour attribuer une vente au bon créateur si vous achetez ensuite chez la marque.</li>
        <li>PostHog (cookies et stockage commençant par <code>ph_</code>, hébergé dans l'Union européenne) : permet de reconnaître une visite de retour dans nos statistiques de fréquentation. Sans accord, PostHog ne garde rien dans votre navigateur.</li>
      </ul>
      <p className="mb-4">
        Refuser est aussi simple qu'accepter, et le site reste utilisable normalement. Vous pouvez changer d'avis à tout
        moment avec le lien « Gérer les cookies » en bas de chaque page (ou dans le menu) : si vous retirez votre accord,
        les cookies <code>wf_aff</code> et PostHog sont effacés.
      </p>

      <h2 className="mb-2 mt-6 font-bold">Avec qui vos données sont partagées</h2>
      <ul className="mb-4 list-disc space-y-1 pl-5">
        <li><strong>Marques partenaires</strong> : lorsqu'un achat est réalisé via un lien du site, la marque connaît le fait qu'une vente a eu lieu via Wanted Fashion (aucune donnée personnelle vous concernant ne lui est transmise au-delà de ce qu'elle collecte déjà pour votre commande).</li>
        <li><strong>Hébergeurs et outils techniques</strong> : Supabase (base de données), Vercel (hébergement du site), PostHog (statistiques de fréquentation, UE), Sightengine (vérification automatique des photos publiées) et Resend (envoi des e-mails de modération), qui traitent les données pour notre compte.</li>
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
        Les adresses IP et les informations de navigateur enregistrées lors des clics sont effacées automatiquement
        après 30 jours.
      </p>

      <h2 className="mb-2 mt-6 font-bold">Vos droits</h2>
      <p className="mb-4">
        Conformément au RGPD, vous pouvez télécharger toutes vos données à tout moment depuis Paramètres → Compte
        → « Télécharger mes données », et demander leur rectification ou leur suppression en écrivant à <a href="mailto:nannawanted@gmail.com" className="text-brand underline">nannawanted@gmail.com</a>.
      </p>
    </main>
  );
}
