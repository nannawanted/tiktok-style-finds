import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export const Route = createFileRoute("/confidentialite")({
  head: () => ({ meta: [{ title: "Politique de confidentialité — Wanted Fashion" }] }),
  component: PrivacyPage,
});

/** Une ligne du registre : quelles données, pourquoi, sur quelle base légale (RGPD art. 6), combien de temps. */
function Row({ title, data, why, basis, keep }: { title: string; data: ReactNode; why: ReactNode; basis: ReactNode; keep: ReactNode }) {
  return (
    <li className="rounded-2xl bg-surface p-4">
      <p className="mb-1.5 font-bold">{title}</p>
      <dl className="grid grid-cols-[minmax(0,7.5rem)_minmax(0,1fr)] gap-x-3 gap-y-1">
        <dt className="text-foreground/60">Données</dt>
        <dd>{data}</dd>
        <dt className="text-foreground/60">Pourquoi</dt>
        <dd>{why}</dd>
        <dt className="text-foreground/60">Base légale</dt>
        <dd>{basis}</dd>
        <dt className="text-foreground/60">Durée</dt>
        <dd>{keep}</dd>
      </dl>
    </li>
  );
}

const mail = (
  <a href="mailto:nannawanted@gmail.com" className="text-brand underline">
    nannawanted@gmail.com
  </a>
);

// Contenu organisé selon l'article 13 du RGPD (informations à donner aux personnes).
function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10 text-sm leading-relaxed text-foreground">
      <h1 className="mb-2 text-2xl font-black">Politique de confidentialité</h1>
      <p className="mb-8 text-xs text-muted-foreground">
        Dernière mise à jour : 3 novembre 2026. Ce document n'a pas été rédigé ou relu par un
        juriste — il décrit de bonne foi ce que le site fait réellement, mais ne constitue pas un avis juridique.
      </p>

      <h2 className="mb-2 mt-6 font-bold">Qui est responsable de vos données</h2>
      <p className="mb-4">
        Wanted Fashion est une plateforme où des créateurs partagent leurs tenues et les liens des vêtements portés.
        Le responsable du traitement de vos données est l'équipe Wanted Fashion, établie en Belgique, joignable à {mail}.
        Pour toute question sur vos données, c'est l'adresse à utiliser.
      </p>

      <h2 className="mb-2 mt-6 font-bold">Quelles données, pourquoi, et combien de temps</h2>
      <ul className="mb-4 space-y-3">
        <Row
          title="Votre compte"
          data="E-mail, nom d'utilisateur, mot de passe (jamais stocké en clair), photo de profil, bannière, bio, liens TikTok/Instagram, styles choisis."
          why="Créer et faire fonctionner votre compte, afficher votre page publique."
          basis="Exécution du contrat (nos conditions d'utilisation). E-mail, nom d'utilisateur et mot de passe sont obligatoires : sans eux, pas de compte."
          keep="Tant que le compte existe. Supprimer votre compte (Paramètres) efface tout."
        />
        <Row
          title="Ce que vous publiez et faites sur le site"
          data="Vos looks, photos, pièces et liens ; les looks que vous aimez, enregistrez ou signalez ; les comptes que vous suivez."
          why="Afficher vos looks, faire fonctionner les likes, abonnements et collections."
          basis="Exécution du contrat."
          keep="Tant que le compte existe (ou jusqu'à ce que vous supprimiez le look)."
        />
        <Row
          title="Vérification des photos et des liens"
          data="Chaque photo envoyée est transmise à Sightengine (outil automatique) qui détecte la nudité ; la photo d'un look est aussi analysée pour vérifier qu'elle montre une tenue ; chaque lien produit est vérifié. Une « empreinte » numérique des photos de looks est calculée."
          why="Empêcher les contenus interdits ; proposer des looks qui se ressemblent et la recherche par l'image."
          basis="Intérêt légitime : garder un site sûr et pertinent."
          keep="Résultat des vérifications : 90 jours (ou jusqu'à la vérification par une personne). Empreinte : tant que le look existe."
        />
        <Row
          title="Vues des looks"
          data="Une empreinte chiffrée de votre adresse IP et de votre navigateur (jamais l'adresse en clair). Si vous acceptez les statistiques : un identifiant gardé dans votre navigateur. Si vous êtes connecté : votre compte."
          why="Compter les vues sans compter deux fois la même personne ni les robots, et donner des statistiques justes aux créateurs."
          basis="Intérêt légitime (comptage sans rien garder dans votre navigateur) ; consentement pour l'identifiant gardé dans le navigateur."
          keep="Empreinte IP : 48 heures. Pour compter les personnes uniques, une empreinte de l'identifiant ou du compte est gardée tant que le look existe."
        />
        <Row
          title="Clics sur un produit"
          data="Adresse IP, navigateur, date, look et produit cliqués."
          why="Compter les clics envoyés aux marques et écarter les faux clics (robots, clics répétés)."
          basis="Intérêt légitime : des chiffres fiables pour les créateurs et les marques."
          keep="Adresse IP et navigateur : 30 jours. Le clic lui-même (sans IP) reste dans les statistiques."
        />
        <Row
          title="Statistiques de fréquentation"
          data="Pages visitées, provenance (ex. : TikTok, Google), type d'appareil, mesurés avec PostHog (Union européenne). Aucun enregistrement d'écran, aucun nom ni e-mail."
          why="Comprendre comment le site est utilisé pour l'améliorer."
          basis="Consentement pour les cookies PostHog ; sans accord, intérêt légitime (mesure sans rien garder dans votre navigateur)."
          keep="Cookies : 12 mois. Données chez PostHog : 12 mois maximum, puis effacées."
        />
        <Row
          title="Recherches"
          data="Le texte cherché et le look ouvert ensuite, sans savoir qui a cherché."
          why="Améliorer les résultats de recherche."
          basis="Intérêt légitime."
          keep="Données anonymes, gardées pour améliorer la recherche."
        />
        <Row
          title="Signalements et demandes « droits d'auteur »"
          data="Signalement d'un look : votre compte, le motif, vos précisions. Demande « droits d'auteur » : nom, e-mail, signature, contenu de la demande, empreinte chiffrée de l'adresse IP (contre les abus)."
          why="Traiter le signalement, vous répondre, informer le créateur concerné de la raison d'un retrait. Votre nom et votre e-mail ne lui sont communiqués que si c'est strictement nécessaire."
          basis="Obligation légale (règlement européen sur les services numériques, art. 16 et 17) ; intérêt légitime pour les signalements simples."
          keep="Signalement d'un look : tant que le look existe. Demande « droits d'auteur » : le temps de la traiter et jusqu'à la fin des recours possibles."
        />
        <Row
          title="Ventes et commissions (créateurs)"
          data="Les ventes générées par vos liens et les montants qui vous sont dus ; signaux de fraude (adresse IP au moment d'un clic, taux de conversion)."
          why="Calculer les commissions et repérer les ventes potentiellement frauduleuses avant qu'une commission soit versée."
          basis="Exécution du contrat ; intérêt légitime pour la détection de fraude."
          keep="Tant que le compte existe, sauf obligation légale de conservation plus longue."
        />
        <Row
          title="Erreurs techniques"
          data="Quand une page plante : l'erreur, la page, le type de navigateur (outil Sentry)."
          why="Corriger les pannes."
          basis="Intérêt légitime : un site qui fonctionne."
          keep="30 jours chez Sentry, puis effacées."
        />
      </ul>
      <p className="mb-4">
        Quand la base légale est notre <strong>intérêt légitime</strong>, vous pouvez vous y opposer en écrivant à {mail}.
      </p>

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
      </ul>
      <p className="mb-2"><strong>Uniquement si vous acceptez</strong> sur le bandeau (choix séparé pour chaque type) :</p>
      <ul className="mb-4 list-disc space-y-1 pl-5">
        <li><strong>Statistiques</strong> — <code>wf_device</code> (stockage du navigateur, 13 mois maximum, non prolongé à chaque visite) : un identifiant qui sert à compter les vues de nos looks sans compter deux fois la même personne.</li>
        <li><strong>Suivi des achats</strong> — <code>wf_aff</code> (cookie, 30 jours) : posé quand vous cliquez sur un produit, pour attribuer une vente au bon créateur si vous achetez ensuite chez la marque.</li>
        <li><strong>Statistiques</strong> — PostHog (cookies et stockage commençant par <code>ph_</code>, 12 mois, hébergé dans l'Union européenne) : permet de reconnaître une visite de retour dans nos statistiques de fréquentation. Sans accord, PostHog ne garde rien dans votre navigateur.</li>
      </ul>
      <p className="mb-4">
        Refuser est aussi simple qu'accepter, et le site reste utilisable normalement. Vous pouvez changer d'avis à tout
        moment avec le lien « Gérer les cookies » en bas de chaque page (ou dans le menu) : si vous retirez votre accord,
        les éléments correspondants (<code>wf_device</code>, PostHog, <code>wf_aff</code>) sont effacés.
      </p>

      <h2 className="mb-2 mt-6 font-bold">Avec qui vos données sont partagées</h2>
      <p className="mb-2">Nous ne vendons aucune donnée. Ces prestataires traitent des données pour notre compte, uniquement pour les usages décrits ici :</p>
      <ul className="mb-4 list-disc space-y-1 pl-5">
        <li><strong>Supabase</strong> : base de données et comptes — serveurs en Irlande (Union européenne).</li>
        <li><strong>Vercel</strong> (États-Unis) : hébergement du site.</li>
        <li><strong>PostHog</strong> : statistiques de fréquentation — hébergé dans l'Union européenne.</li>
        <li><strong>Sightengine</strong> (France) : vérification automatique des photos.</li>
        <li><strong>Sentry</strong> (États-Unis) : suivi des erreurs techniques.</li>
        <li><strong>Resend</strong> (États-Unis) : envoi des e-mails liés à la modération, quand cet envoi est activé.</li>
        <li><strong>Have I Been Pwned</strong> : à l'inscription, pour refuser un mot de passe déjà volé ailleurs, seuls les 5 premiers caractères d'une empreinte chiffrée du mot de passe sont envoyés — jamais le mot de passe, ni aucune donnée sur vous.</li>
        <li><strong>Marques partenaires</strong> : lorsqu'un achat est réalisé via un lien du site, la marque sait qu'une vente vient de Wanted Fashion ; aucune donnée personnelle vous concernant ne lui est transmise au-delà de ce qu'elle collecte déjà pour votre commande.</li>
        <li><strong>Autorités</strong> : uniquement si la loi nous y oblige.</li>
      </ul>

      <h2 className="mb-2 mt-6 font-bold">Transferts hors de l'Union européenne</h2>
      <p className="mb-4">
        Vercel, Sentry et Resend sont des sociétés américaines. Elles sont certifiées au cadre de protection des données
        UE–États-Unis (« Data Privacy Framework »), reconnu par la Commission européenne comme offrant un niveau de
        protection adéquat (décision d'adéquation du 10 juillet 2023).
      </p>

      <h2 className="mb-2 mt-6 font-bold">Décisions automatiques</h2>
      <p className="mb-4">
        Seules les vérifications à l'envoi sont automatiques : une photo jugée contraire aux règles (nudité, photo
        sans rapport avec la mode) ou un lien non conforme est refusé, avec un message qui en donne la raison. Aucune
        suppression de look ni suspension de compte n'est décidée par un outil : c'est toujours une personne. Si un
        refus automatique vous semble faux, écrivez à {mail} : une personne vérifiera. Le détail est dans nos{" "}
        <Link to="/conditions" hash="moderation" className="text-brand underline">conditions d'utilisation</Link>.
      </p>

      <h2 className="mb-2 mt-6 font-bold">Vos droits</h2>
      <ul className="mb-4 list-disc space-y-1 pl-5">
        <li><strong>Accès et portabilité</strong> : téléchargez toutes vos données à tout moment depuis Paramètres → Compte → « Télécharger mes données ».</li>
        <li><strong>Rectification</strong> : modifiez vos informations dans Paramètres, ou écrivez-nous.</li>
        <li><strong>Effacement</strong> : supprimez votre compte dans Paramètres, ou écrivez-nous.</li>
        <li><strong>Limitation et opposition</strong> : demandez-nous de limiter un traitement ou opposez-vous à ceux fondés sur notre intérêt légitime.</li>
        <li><strong>Retrait du consentement</strong> : à tout moment, avec « Gérer les cookies » en bas de chaque page. Cela ne remet pas en cause ce qui a été fait avant.</li>
        <li><strong>Réclamation</strong> : vous pouvez saisir l'Autorité de protection des données (Belgique, autoriteprotectiondonnees.be) ou l'autorité du pays où vous vivez (en France : la CNIL).</li>
      </ul>
      <p className="mb-4">Pour exercer ces droits, écrivez à {mail}. Nous répondons dans un délai d'un mois.</p>
    </main>
  );
}
