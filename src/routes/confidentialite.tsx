import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { AFFILIATE_ENABLED } from "@/lib/features";
import { LEGAL_UPDATED, PUBLISHER_NAME } from "@/lib/legal";
import { ContactMail, LegalPage, type LegalSection } from "@/components/legal/LegalPage";

export const Route = createFileRoute("/confidentialite")({
  head: () => ({ meta: [{ title: "Politique de confidentialité — Wanted Fashion" }] }),
  component: PrivacyPage,
});

/** Une ligne du registre : quelles données, pourquoi, sur quelle base légale (RGPD art. 6), combien de temps. */
function Row({ title, data, why, basis, keep }: { title: string; data: ReactNode; why: ReactNode; basis: ReactNode; keep: ReactNode }) {
  return (
    <li className="list-none rounded-2xl bg-surface p-4">
      <p className="mb-1.5 font-bold text-foreground">{title}</p>
      <dl className="grid grid-cols-[minmax(0,6.5rem)_minmax(0,1fr)] gap-x-3 gap-y-1 text-[13.5px]">
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

// Contenu organisé selon l'article 13 du RGPD et l'ordre de la politique de Pinterest
// (responsable, données et usages, partage, transferts, conservation, sécurité, droits, mineurs, modifications).
function PrivacyPage() {
  const sections: LegalSection[] = [
    {
      id: "responsable",
      title: "Qui est responsable de vos données",
      short: "Une seule adresse pour toutes tes questions sur tes données.",
      body: (
        <p>
          Wanted Fashion est une plateforme où des créateurs partagent leurs tenues et les liens des vêtements portés. Le
          responsable du traitement de vos données est {PUBLISHER_NAME ?? "l'équipe Wanted Fashion"}, établi(e) en
          Belgique, joignable à <ContactMail />. Pour toute question sur vos données, c'est l'adresse à utiliser.
        </p>
      ),
    },
    {
      id: "donnees",
      title: "Quelles données, pourquoi, et combien de temps",
      short: "Pour chaque usage : les données, la raison, la base légale et la durée de conservation.",
      body: (
        <>
          <ul className="!list-none space-y-3 !pl-0">
            <Row
              title="Votre compte"
              data="E-mail, nom d'utilisateur, mot de passe (jamais stocké en clair), date de naissance (jamais affichée), photo de profil, bannière, bio, liens TikTok/Instagram, styles choisis, version des conditions acceptée et date."
              why="Créer et faire fonctionner votre compte, afficher votre page publique, vérifier que vous avez 18 ans ou plus et garder la preuve de votre accord aux conditions."
              basis="Exécution du contrat (nos conditions d'utilisation). E-mail, nom d'utilisateur, mot de passe et date de naissance sont obligatoires : sans eux, pas de compte. Si vous avez moins de 18 ans, l'inscription est refusée et rien n'est gardé."
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
              title="Signalements"
              data="Signalement d'un look depuis votre compte : votre compte, le motif, vos précisions. Signalement par le formulaire public (droits d'auteur, marque, contenu illégal) : nom, e-mail, signature, contenu de la demande, empreinte chiffrée de l'adresse IP (contre les abus)."
              why="Traiter le signalement, vous répondre, informer le créateur concerné de la raison d'un retrait. Votre nom et votre e-mail ne lui sont communiqués que si c'est strictement nécessaire."
              basis="Obligation légale (règlement européen sur les services numériques, art. 16 et 17) ; intérêt légitime pour les signalements simples."
              keep="Signalement d'un look : tant que le look existe. Formulaire public : le temps de traiter la demande et jusqu'à la fin des recours possibles."
            />
            {AFFILIATE_ENABLED && (
            <Row
              title="Ventes et commissions (créateurs)"
              data="Les ventes générées par vos liens et les montants qui vous sont dus ; signaux de fraude (adresse IP au moment d'un clic, taux de conversion)."
              why="Calculer les commissions et repérer les ventes potentiellement frauduleuses avant qu'une commission soit versée."
              basis="Exécution du contrat ; intérêt légitime pour la détection de fraude."
              keep="Tant que le compte existe, sauf obligation légale de conservation plus longue."
            />
            )}
            <Row
              title="Preuves légales"
              data="Dans un journal qui ne peut pas être modifié : votre déclaration d'âge et votre date de naissance à l'inscription, chaque version des conditions acceptée et sa date, la suppression de votre compte ; vos choix de cookies avec un identifiant au hasard (cookie wf_consent_id), sans nom ni adresse IP."
              why="Pouvoir prouver, en cas de contrôle ou de litige, que vous avez déclaré avoir 18 ans, accepté nos conditions ou donné (ou refusé) votre accord aux cookies."
              basis="Obligation légale (RGPD art. 7 §1 : pouvoir démontrer le consentement) et intérêt légitime (se défendre en cas de litige). Ces preuves sont gardées même si vous supprimez votre compte (RGPD art. 17 §3 e)."
              keep="Pendant les délais légaux durant lesquels un litige reste possible, puis effacées."
            />
            <Row
              title="Erreurs techniques"
              data="Quand une page plante : l'erreur, la page, le type de navigateur (outil Sentry)."
              why="Corriger les pannes."
              basis="Intérêt légitime : un site qui fonctionne."
              keep="30 jours chez Sentry, puis effacées."
            />
          </ul>
          <p>
            Quand la base légale est notre <strong>intérêt légitime</strong>, vous pouvez vous y opposer en écrivant à{" "}
            <ContactMail />.
          </p>
        </>
      ),
    },
    {
      id: "cookies",
      title: "Cookies",
      short: "Sans ton accord, seuls les cookies indispensables sont utilisés.",
      body: (
        <p>
          Tout est expliqué dans la <Link to="/cookies">Politique cookies</Link> : la liste des cookies, leur but, leur
          durée et comment changer d'avis à tout moment avec « Gérer les cookies ».
        </p>
      ),
    },
    {
      id: "partage",
      title: "Avec qui vos données sont partagées",
      short: "On ne vend aucune donnée. Seuls nos prestataires techniques y ont accès, pour faire marcher le site.",
      body: (
        <>
          <p>Nous ne vendons aucune donnée. Ces prestataires traitent des données pour notre compte, uniquement pour les usages décrits ici :</p>
          <ul>
            <li><strong>Supabase</strong> : base de données et comptes — serveurs en Irlande (Union européenne).</li>
            <li><strong>Vercel</strong> (États-Unis) : hébergement du site.</li>
            <li><strong>PostHog</strong> : statistiques de fréquentation — hébergé dans l'Union européenne.</li>
            <li><strong>Sightengine</strong> (France) : vérification automatique des photos.</li>
            <li><strong>Sentry</strong> (États-Unis) : suivi des erreurs techniques.</li>
            <li><strong>Resend</strong> (États-Unis) : envoi des e-mails liés à la modération, quand cet envoi est activé.</li>
            <li><strong>Have I Been Pwned</strong> : à l'inscription, pour refuser un mot de passe déjà volé ailleurs, seuls les 5 premiers caractères d'une empreinte chiffrée du mot de passe sont envoyés — jamais le mot de passe, ni aucune donnée sur vous.</li>
            {AFFILIATE_ENABLED && <li><strong>Marques partenaires</strong> : lorsqu'un achat est réalisé via un lien du site, la marque sait qu'une vente vient de Wanted Fashion ; aucune donnée personnelle vous concernant ne lui est transmise au-delà de ce qu'elle collecte déjà pour votre commande.</li>}
            <li><strong>Les autres visiteurs</strong> : ce que vous publiez (looks, nom d'utilisateur, photo de profil, bio) est public. Votre e-mail et votre date de naissance ne le sont jamais.</li>
            <li><strong>Autorités</strong> : uniquement si la loi nous y oblige.</li>
          </ul>
        </>
      ),
    },
    {
      id: "transferts",
      title: "Transferts hors de l'Union européenne",
      short: "Trois prestataires sont américains, sous un cadre reconnu par la Commission européenne.",
      body: (
        <p>
          Vercel, Sentry et Resend sont des sociétés américaines. Elles sont certifiées au cadre de protection des données
          UE–États-Unis (« Data Privacy Framework »), reconnu par la Commission européenne comme offrant un niveau de
          protection adéquat (décision d'adéquation du 10 juillet 2023).
        </p>
      ),
    },
    {
      id: "securite",
      title: "Comment nous protégeons vos données",
      short: "Connexion chiffrée, mots de passe jamais stockés en clair, accès limités.",
      body: (
        <ul>
          <li>Toutes les connexions au site sont chiffrées (HTTPS).</li>
          <li>Les mots de passe ne sont jamais stockés en clair, seulement sous forme d'empreinte chiffrée ; un mot de passe déjà volé ailleurs est refusé.</li>
          <li>Chaque table de la base de données est protégée par des règles d'accès : chacun ne voit que ce qu'il a le droit de voir.</li>
          <li>L'espace de modération est protégé par une double vérification.</li>
          <li>Aucune sécurité n'est parfaite : en cas de violation de données présentant un risque pour vous, nous prévenons l'autorité de protection des données et, si le risque est élevé, les personnes concernées.</li>
        </ul>
      ),
    },
    {
      id: "automatique",
      title: "Décisions automatiques",
      short: "Seules les vérifications à l'envoi sont automatiques ; un retrait est toujours décidé par une personne.",
      body: (
        <p>
          Seules les vérifications à l'envoi sont automatiques : une photo jugée contraire aux règles (nudité, photo sans
          rapport avec la mode) ou un lien non conforme est refusé, avec un message qui en donne la raison. Aucune
          suppression de look ni suspension de compte n'est décidée par un outil : c'est toujours une personne. Si un
          refus automatique vous semble faux, écrivez à <ContactMail /> : une personne vérifiera. Le détail est dans nos{" "}
          <Link to="/conditions" hash="moderation">conditions d'utilisation</Link>.
        </p>
      ),
    },
    {
      id: "mineurs",
      title: "Personnes de moins de 18 ans",
      short: "Le site est réservé aux 18 ans et plus.",
      body: (
        <p>
          Wanted Fashion est réservé aux personnes de 18 ans et plus : une inscription avec une date de naissance de
          moins de 18 ans est refusée et rien n'est gardé. Si nous apprenons qu'un compte appartient à une personne
          mineure, il est suspendu. Un parent peut nous écrire à <ContactMail /> pour demander la suppression des données
          de son enfant.
        </p>
      ),
    },
    {
      id: "messages",
      title: "Messages que vous nous envoyez",
      short: "On garde nos échanges 2 ans pour suivre ta demande.",
      body: (
        <p>
          Quand vous nous écrivez (question, demande sur vos données, contestation), nous gardons l'échange pour vous
          répondre et suivre votre demande, pendant 2 ans après le dernier message, ou plus longtemps si une procédure
          est en cours.
        </p>
      ),
    },
    {
      id: "droits",
      title: "Vos droits",
      short: "Tu peux voir, corriger, télécharger ou supprimer tes données, et porter plainte.",
      body: (
        <>
          <ul>
            <li><strong>Accès et portabilité</strong> : téléchargez toutes vos données à tout moment depuis Paramètres → Compte → « Télécharger mes données ».</li>
            <li><strong>Rectification</strong> : modifiez vos informations dans Paramètres, ou écrivez-nous.</li>
            <li><strong>Effacement</strong> : supprimez votre compte dans Paramètres, ou écrivez-nous.</li>
            <li><strong>Limitation et opposition</strong> : demandez-nous de limiter un traitement ou opposez-vous à ceux fondés sur notre intérêt légitime.</li>
            <li><strong>Retrait du consentement</strong> : à tout moment, avec « Gérer les cookies » en bas de chaque page. Cela ne remet pas en cause ce qui a été fait avant.</li>
            <li><strong>Réclamation</strong> : vous pouvez saisir l'Autorité de protection des données (Belgique, autoriteprotectiondonnees.be) ou l'autorité du pays où vous vivez (en France : la CNIL).</li>
          </ul>
          <p>
            Pour exercer ces droits, écrivez à <ContactMail />. Nous répondons dans un délai d'un mois. Si nous refusons une
            demande, nous vous expliquons pourquoi et vous pouvez la contester auprès de l'autorité de protection des
            données.
          </p>
        </>
      ),
    },
    {
      id: "modifications",
      title: "Modification de cette politique",
      short: "On te prévient en cas de changement important.",
      body: (
        <p>
          Si nous modifions cette politique de façon importante, les utilisateurs inscrits sont prévenus par une
          notification sur le site, et la date en haut de cette page est mise à jour.
        </p>
      ),
    },
  ];

  return (
    <LegalPage
      path="/confidentialite"
      title="Politique de confidentialité"
      updated={LEGAL_UPDATED}
      essentials={[
        "On ne vend aucune donnée.",
        "Ton e-mail et ta date de naissance ne sont jamais publics.",
        "Sans ton accord, aucun cookie de statistiques n'est déposé.",
        "Tu peux télécharger ou supprimer tes données à tout moment.",
      ]}
      sections={sections}
    />
  );
}
