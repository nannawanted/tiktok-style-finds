import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { AFFILIATE_ENABLED } from "@/lib/features";
import { PUBLISHER_NAME, legalUpdated } from "@/lib/legal";
import { useTranslation } from "@/lib/i18n";
import { ContactMail, LegalPage, type LegalSection } from "@/components/legal/LegalPage";

export const Route = createFileRoute("/confidentialite")({
  head: () => ({ meta: [{ title: "Politique de confidentialité — Wanted Fashion" }] }),
  component: PrivacyPage,
});

/** Une ligne du registre : quelles données, pourquoi, sur quelle base légale (RGPD art. 6), combien de temps. */
function Row({ title, data, why, basis, keep, en = false }: { title: string; data: ReactNode; why: ReactNode; basis: ReactNode; keep: ReactNode; en?: boolean }) {
  return (
    <li className="list-none rounded-2xl bg-surface p-4">
      <p className="mb-1.5 font-bold text-foreground">{title}</p>
      <dl className="grid grid-cols-[minmax(0,6.5rem)_minmax(0,1fr)] gap-x-3 gap-y-1 text-[13.5px]">
        <dt className="text-foreground/60">{en ? "Data" : "Données"}</dt>
        <dd>{data}</dd>
        <dt className="text-foreground/60">{en ? "Why" : "Pourquoi"}</dt>
        <dd>{why}</dd>
        <dt className="text-foreground/60">{en ? "Legal basis" : "Base légale"}</dt>
        <dd>{basis}</dd>
        <dt className="text-foreground/60">{en ? "How long" : "Durée"}</dt>
        <dd>{keep}</dd>
      </dl>
    </li>
  );
}

// Contenu organisé selon l'article 13 du RGPD et l'ordre de la politique de Pinterest
// (responsable, données et usages, partage, transferts, conservation, sécurité, droits, mineurs, modifications).
function PrivacyPage() {
  const { lang } = useTranslation();
  const en = lang === "en";
  const sections: LegalSection[] = en ? privacyEn() : [
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
              title="Look « En ce moment »"
              data="Quand un look est ouvert : une empreinte chiffrée (identifiant du navigateur si vous avez accepté les statistiques, sinon compte ou adresse IP), jamais l'adresse en clair."
              why="Repérer le look le plus regardé d'un créateur dans la dernière heure et le mettre en avant sur sa page."
              basis="Intérêt légitime : mettre en avant les looks qui intéressent."
              keep="48 heures, puis effacée."
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
            <li><strong>Cloudflare Turnstile</strong> (États-Unis) : à l'inscription seulement, vérification anti-robot ; Cloudflare reçoit des informations techniques sur votre navigateur et votre adresse IP.</li>
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
      short: "Quatre prestataires sont américains, sous un cadre reconnu par la Commission européenne.",
      body: (
        <p>
          Vercel, Sentry, Resend et Cloudflare sont des sociétés américaines. Elles sont certifiées au cadre de protection des données
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
      title={en ? "Privacy policy" : "Politique de confidentialité"}
      updated={legalUpdated(lang)}
      essentials={en ? [
        "We don't sell any data.",
        "Your email and date of birth are never public.",
        "Without your consent, no statistics cookies are set.",
        "You can download or delete your data at any time.",
      ] : [
        "On ne vend aucune donnée.",
        "Ton e-mail et ta date de naissance ne sont jamais publics.",
        "Sans ton accord, aucun cookie de statistiques n'est déposé.",
        "Tu peux télécharger ou supprimer tes données à tout moment.",
      ]}
      sections={sections}
    />
  );
}

/** Traduction anglaise fidèle de la politique de confidentialité (la version française fait foi). */
function privacyEn(): LegalSection[] {
  return [
    {
      id: "responsable",
      title: "Who is responsible for your data",
      short: "One address for all your questions about your data.",
      body: (
        <p>
          Wanted Fashion is a platform where creators share their outfits and links to the clothes they wear. The
          controller of your data is {PUBLISHER_NAME ?? "the Wanted Fashion team"}, based in Belgium, reachable at{" "}
          <ContactMail />. For any question about your data, this is the address to use.
        </p>
      ),
    },
    {
      id: "donnees",
      title: "What data, why, and for how long",
      short: "For each use: the data, the reason, the legal basis and how long it is kept.",
      body: (
        <>
          <ul className="!list-none space-y-3 !pl-0">
            <Row
              en
              title="Your account"
              data="Email, username, password (never stored in plain text), date of birth (never displayed), profile picture, banner, bio, TikTok/Instagram links, chosen styles, version of the accepted terms and date."
              why="Create and run your account, display your public page, check that you are 18 or over and keep proof of your agreement to the terms."
              basis="Performance of the contract (our terms of use). Email, username, password and date of birth are mandatory: without them, no account. If you are under 18, sign-up is refused and nothing is kept."
              keep="As long as the account exists. Deleting your account (Settings) erases everything."
            />
            <Row
              en
              title="What you publish and do on the site"
              data="Your looks, photos, pieces and links; the looks you like, save or report; the accounts you follow."
              why="Display your looks, run likes, follows and collections."
              basis="Performance of the contract."
              keep="As long as the account exists (or until you delete the look)."
            />
            <Row
              en
              title="Checking photos and links"
              data="Each uploaded photo is sent to Sightengine (automated tool), which detects nudity; the photo of a look is also analysed to check that it shows an outfit; each product link is checked. A digital “fingerprint” of look photos is calculated."
              why="Prevent prohibited content; suggest similar looks and search by image."
              basis="Legitimate interest: keeping the site safe and relevant."
              keep="Check results: 90 days (or until checked by a person). Fingerprint: as long as the look exists."
            />
            <Row
              en
              title="Look views"
              data="An encrypted fingerprint of your IP address and browser (never the address in plain text). If you accept statistics: an identifier kept in your browser. If you are signed in: your account."
              why="Count views without counting the same person twice or robots, and give creators accurate statistics."
              basis="Legitimate interest (counting without storing anything in your browser); consent for the identifier kept in the browser."
              keep="IP fingerprint: 48 hours. To count unique people, a fingerprint of the identifier or account is kept as long as the look exists."
            />
            <Row
              en
              title="“Trending now” look"
              data="When a look is opened: an encrypted fingerprint (browser identifier if you accepted statistics, otherwise account or IP address), never the address in plain text."
              why="Identify a creator's most viewed look in the last hour and highlight it on their page."
              basis="Legitimate interest: highlighting looks people are interested in."
              keep="48 hours, then erased."
            />
            <Row
              en
              title="Product clicks"
              data="IP address, browser, date, look and product clicked."
              why="Count the clicks sent to brands and exclude fake clicks (robots, repeated clicks)."
              basis="Legitimate interest: reliable figures for creators and brands."
              keep="IP address and browser: 30 days. The click itself (without IP) remains in the statistics."
            />
            <Row
              en
              title="Audience statistics"
              data="Pages visited, origin (e.g. TikTok, Google), device type, measured with PostHog (European Union). No screen recording, no name or email."
              why="Understand how the site is used in order to improve it."
              basis="Consent for PostHog cookies; without consent, legitimate interest (measurement without storing anything in your browser)."
              keep="Cookies: 12 months. Data at PostHog: 12 months maximum, then erased."
            />
            <Row
              en
              title="Searches"
              data="The text searched and the look opened afterwards, without knowing who searched."
              why="Improve search results."
              basis="Legitimate interest."
              keep="Anonymous data, kept to improve search."
            />
            <Row
              en
              title="Reports"
              data="Report of a look from your account: your account, the reason, your details. Report through the public form (copyright, trademark, illegal content): name, email, signature, content of the request, encrypted fingerprint of the IP address (against abuse)."
              why="Handle the report, reply to you, inform the creator concerned of the reason for a removal. Your name and email are only shared with them if strictly necessary."
              basis="Legal obligation (EU Digital Services Act, Art. 16 and 17); legitimate interest for simple reports."
              keep="Report of a look: as long as the look exists. Public form: the time needed to handle the request and until the end of possible appeals."
            />
            {AFFILIATE_ENABLED && (
              <Row
                en
                title="Sales and commissions (creators)"
                data="Sales generated by your links and the amounts owed to you; fraud signals (IP address at the time of a click, conversion rate)."
                why="Calculate commissions and spot potentially fraudulent sales before a commission is paid."
                basis="Performance of the contract; legitimate interest for fraud detection."
                keep="As long as the account exists, unless a longer retention is required by law."
              />
            )}
            <Row
              en
              title="Legal evidence"
              data="In a log that cannot be modified: your age declaration and date of birth at sign-up, each version of the terms accepted and its date, the deletion of your account; your cookie choices with a random identifier (wf_consent_id cookie), without name or IP address."
              why="Be able to prove, in case of an inspection or dispute, that you declared you were 18, accepted our terms or gave (or refused) your consent to cookies."
              basis="Legal obligation (GDPR Art. 7(1): being able to demonstrate consent) and legitimate interest (defending ourselves in a dispute). This evidence is kept even if you delete your account (GDPR Art. 17(3)(e))."
              keep="For the legal periods during which a dispute remains possible, then erased."
            />
            <Row
              en
              title="Technical errors"
              data="When a page crashes: the error, the page, the browser type (Sentry tool)."
              why="Fix outages."
              basis="Legitimate interest: a site that works."
              keep="30 days at Sentry, then erased."
            />
          </ul>
          <p>
            When the legal basis is our <strong>legitimate interest</strong>, you can object by writing to <ContactMail />.
          </p>
        </>
      ),
    },
    {
      id: "cookies",
      title: "Cookies",
      short: "Without your consent, only essential cookies are used.",
      body: (
        <p>
          Everything is explained in the <Link to="/cookies">Cookie policy</Link>: the list of cookies, their purpose, how
          long they last and how to change your mind at any time with “Manage cookies”.
        </p>
      ),
    },
    {
      id: "partage",
      title: "Who your data is shared with",
      short: "We don't sell any data. Only our technical providers have access to it, to run the site.",
      body: (
        <>
          <p>We don't sell any data. These providers process data on our behalf, only for the uses described here:</p>
          <ul>
            <li><strong>Supabase</strong>: database and accounts — servers in Ireland (European Union).</li>
            <li><strong>Vercel</strong> (United States): website hosting.</li>
            <li><strong>PostHog</strong>: audience statistics — hosted in the European Union.</li>
            <li><strong>Sightengine</strong> (France): automated photo checks.</li>
            <li><strong>Sentry</strong> (United States): technical error tracking.</li>
            <li><strong>Resend</strong> (United States): sending moderation-related emails, when this sending is enabled.</li>
            <li><strong>Cloudflare Turnstile</strong> (United States): only at sign-up, robot check; Cloudflare receives technical information about your browser and your IP address.</li>
            <li><strong>Have I Been Pwned</strong>: at sign-up, to refuse a password already stolen elsewhere, only the first 5 characters of an encrypted fingerprint of the password are sent — never the password, nor any data about you.</li>
            {AFFILIATE_ENABLED && <li><strong>Partner brands</strong>: when a purchase is made through a link on the site, the brand knows that a sale comes from Wanted Fashion; no personal data about you is passed on beyond what it already collects for your order.</li>}
            <li><strong>Other visitors</strong>: what you publish (looks, username, profile picture, bio) is public. Your email and date of birth never are.</li>
            <li><strong>Authorities</strong>: only if the law requires us to.</li>
          </ul>
        </>
      ),
    },
    {
      id: "transferts",
      title: "Transfers outside the European Union",
      short: "Four providers are American, under a framework recognised by the European Commission.",
      body: (
        <p>
          Vercel, Sentry, Resend and Cloudflare are American companies. They are certified under the EU–US Data Privacy
          Framework, recognised by the European Commission as providing an adequate level of protection (adequacy decision
          of 10 July 2023).
        </p>
      ),
    },
    {
      id: "securite",
      title: "How we protect your data",
      short: "Encrypted connection, passwords never stored in plain text, limited access.",
      body: (
        <ul>
          <li>All connections to the site are encrypted (HTTPS).</li>
          <li>Passwords are never stored in plain text, only as an encrypted fingerprint; a password already stolen elsewhere is refused.</li>
          <li>Each database table is protected by access rules: everyone only sees what they are allowed to see.</li>
          <li>The moderation area is protected by two-factor authentication.</li>
          <li>No security is perfect: in case of a data breach presenting a risk to you, we notify the data protection authority and, if the risk is high, the people concerned.</li>
        </ul>
      ),
    },
    {
      id: "automatique",
      title: "Automated decisions",
      short: "Only upload checks are automated; a removal is always decided by a person.",
      body: (
        <p>
          Only upload checks are automated: a photo considered contrary to the rules (nudity, photo unrelated to fashion) or
          a non-compliant link is refused, with a message giving the reason. No look removal or account suspension is
          decided by a tool: it is always a person. If an automated refusal seems wrong to you, write to <ContactMail />: a
          person will check. The details are in our <Link to="/conditions" hash="moderation">terms of use</Link>.
        </p>
      ),
    },
    {
      id: "mineurs",
      title: "People under 18",
      short: "The site is for people aged 18 and over.",
      body: (
        <p>
          Wanted Fashion is for people aged 18 and over: a sign-up with a date of birth under 18 is refused and nothing is
          kept. If we learn that an account belongs to a minor, it is suspended. A parent can write to us at <ContactMail />{" "}
          to ask for their child's data to be deleted.
        </p>
      ),
    },
    {
      id: "messages",
      title: "Messages you send us",
      short: "We keep our exchanges for 2 years to follow up on your request.",
      body: (
        <p>
          When you write to us (question, request about your data, appeal), we keep the exchange to reply to you and follow
          up on your request, for 2 years after the last message, or longer if proceedings are in progress.
        </p>
      ),
    },
    {
      id: "droits",
      title: "Your rights",
      short: "You can see, correct, download or delete your data, and file a complaint.",
      body: (
        <>
          <ul>
            <li><strong>Access and portability</strong>: download all your data at any time from Settings → Account → “Download my data”.</li>
            <li><strong>Rectification</strong>: change your information in Settings, or write to us.</li>
            <li><strong>Erasure</strong>: delete your account in Settings, or write to us.</li>
            <li><strong>Restriction and objection</strong>: ask us to restrict a processing or object to those based on our legitimate interest.</li>
            <li><strong>Withdrawal of consent</strong>: at any time, with “Manage cookies” at the bottom of every page. This doesn't affect what was done before.</li>
            <li><strong>Complaint</strong>: you can contact the Belgian Data Protection Authority (dataprotectionauthority.be) or the authority of the country where you live (in France: the CNIL).</li>
          </ul>
          <p>
            To exercise these rights, write to <ContactMail />. We reply within one month. If we refuse a request, we explain
            why and you can challenge it with the data protection authority.
          </p>
        </>
      ),
    },
    {
      id: "modifications",
      title: "Changes to this policy",
      short: "We let you know in case of an important change.",
      body: (
        <p>
          If we change this policy in an important way, registered users are informed by a notification on the site, and the
          date at the top of this page is updated.
        </p>
      ),
    },
  ];
}
