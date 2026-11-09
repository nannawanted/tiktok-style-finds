import { createFileRoute, Link } from "@tanstack/react-router";
import { AFFILIATE_ENABLED } from "@/lib/features";
import { LEGAL_UPDATED, PUBLISHER_NAME } from "@/lib/legal";
import { ContactMail, LegalPage, type LegalSection } from "@/components/legal/LegalPage";

export const Route = createFileRoute("/conditions")({
  head: () => ({ meta: [{ title: "Conditions d'utilisation — Wanted Fashion" }] }),
  component: TermsPage,
});

// Organisation inspirée des conditions de Pinterest (service, compte, contenus, sécurité, résiliation,
// responsabilité, litiges, modifications), adaptée à ce que WantedFashion fait réellement.
function TermsPage() {
  const sections: (LegalSection | false)[] = [
    {
      id: "service",
      title: "Le service",
      short: AFFILIATE_ENABLED
        ? "Les créateurs partagent leurs tenues avec les liens des vêtements ; on touche une commission sur certaines ventes."
        : "Les créateurs partagent leurs tenues avec les liens des vêtements portés. C'est gratuit.",
      body: (
        <>
          {AFFILIATE_ENABLED ? (
            <p>
              Wanted Fashion permet à des créateurs de publier des tenues avec des liens d'achat vers des marques
              partenaires. Wanted Fashion touche une commission sur les ventes réalisées via ces liens, et en reverse une
              partie au créateur concerné.
            </p>
          ) : (
            <p>
              Wanted Fashion permet à des créateurs de publier leurs tenues avec des liens vers les vêtements portés, sur
              les sites des marques. Wanted Fashion ne touche aucune commission sur ces liens et ne verse aucun argent aux
              créateurs. L'utilisation du site est gratuite.
            </p>
          )}
          <p>
            Le site est édité depuis la Belgique{PUBLISHER_NAME ? ` par ${PUBLISHER_NAME}` : ""} (voir{" "}
            {PUBLISHER_NAME ? <Link to="/mentions-legales">Mentions légales</Link> : "le point de contact plus bas"}). En
            utilisant Wanted Fashion, vous acceptez ces conditions, nos{" "}
            <Link to="/regles">Règles de la communauté</Link> et notre{" "}
            <Link to="/confidentialite">Politique de confidentialité</Link>.
          </p>
        </>
      ),
    },
    {
      id: "age",
      title: "Qui peut utiliser Wanted Fashion",
      short: "Il faut avoir 18 ans ou plus pour créer un compte.",
      body: (
        <>
          <p>
            Wanted Fashion est réservé aux personnes de <strong>18 ans et plus</strong>. À l'inscription, vous indiquez
            votre date de naissance et une adresse e-mail valide. Donner une fausse date de naissance est interdit : si un
            compte appartient à une personne de moins de 18 ans, il est suspendu. Tout le monde peut nous signaler un
            compte qui semble appartenir à une personne mineure.
          </p>
          {AFFILIATE_ENABLED && <p>Avant tout versement d'argent à un créateur, son identité et son âge sont vérifiés.</p>}
          <p>Regarder les looks publiés ne demande pas de compte.</p>
        </>
      ),
    },
    {
      id: "compte",
      title: "Votre compte et sa sécurité",
      short: "Ton mot de passe reste secret ; préviens-nous si quelqu'un utilise ton compte.",
      body: (
        <ul>
          <li>Vous êtes responsable de ce qui se passe sur votre compte. Un compte est personnel : ne le prêtez pas, ne le vendez pas.</li>
          <li>Gardez votre mot de passe secret et ne le réutilisez pas ailleurs. Un mot de passe déjà apparu dans une fuite de données connue est refusé à l'inscription.</li>
          <li>Vous pouvez activer la double vérification dans Paramètres → Sécurité.</li>
          <li>
            Si vous pensez que quelqu'un utilise votre compte sans votre accord, changez votre mot de passe et prévenez-nous
            à <ContactMail />.
          </li>
        </ul>
      ),
    },
    {
      id: "contenus",
      title: "Vos contenus",
      short: "Tes photos restent à toi. Tu nous autorises seulement à les montrer sur le site.",
      body: (
        <>
          <p>
            Vous restez propriétaire du contenu que vous publiez (photos, vidéos, descriptions). En le publiant, vous
            accordez à Wanted Fashion une autorisation gratuite, non exclusive et valable dans le monde entier pour
            l'héberger, le reproduire (par exemple en créer des miniatures), l'afficher publiquement sur le site et dans
            les aperçus de partage, et l'analyser avec des outils automatiques (vérification des contenus, suggestions de
            looks qui se ressemblent). Cette autorisation sert uniquement à faire fonctionner le site ; elle prend fin
            quand vous supprimez le contenu ou votre compte.
          </p>
          <p>
            En publiant, vous garantissez être l'auteur des photos et textes publiés, ou avoir l'autorisation de leur
            auteur, et que les personnes visibles sur vos photos sont d'accord. Vous vous engagez à ne publier que des
            liens produits réels et à ne pas tenter de fausser les statistiques du site (vues, clics).
          </p>
          <p>
            Le nom Wanted Fashion, son logo et le design du site nous appartiennent : ne les utilisez pas d'une façon qui
            pourrait faire croire à un lien avec nous.
          </p>
        </>
      ),
    },
    {
      id: "regles",
      title: "Règles de la communauté",
      short: "Certains contenus et comportements sont interdits ; la liste complète est sur une page à part.",
      body: (
        <p>
          Les <Link to="/regles">Règles de la communauté</Link> font partie de ces conditions. Elles listent ce qui est
          interdit (nudité, haine, harcèlement, contrefaçons, arnaques, spam, faux engagement, etc.) et ce qui se passe
          quand une règle n'est pas respectée.
        </p>
      ),
    },
    {
      id: "droits-auteur",
      title: "Droits d'auteur et marques",
      short: "Ne publie que ce qui t'appartient. Un ayant droit peut demander le retrait d'un contenu.",
      body: (
        <ul>
          <li>
            Les images des produits s'affichent depuis le site de la marque concernée, avec un lien vers sa page produit.
            Une marque peut demander leur retrait à tout moment.
          </li>
          <li>
            Toute personne, avec ou sans compte, peut signaler un contenu qui viole ses droits d'auteur ou sa marque via
            la page <Link to="/droits-auteur">Droits d'auteur et marques</Link>. Chaque demande est examinée par une
            personne.
          </li>
          <li>
            Chaque look retiré pour droits d'auteur ou atteinte à une marque donne un avertissement au créateur, valable
            90 jours. Avec 3 avertissements actifs, le compte est suspendu.
          </li>
        </ul>
      ),
    },
    {
      id: "moderation",
      title: "Modération des contenus",
      short: "Des outils vérifient les photos et les liens à l'envoi ; une personne décide de chaque retrait.",
      body: (
        <ul>
          <li>
            <strong>Des vérifications automatiques à l'envoi</strong> : chaque photo envoyée (look, photo de profil,
            bannière) est analysée par un outil automatique (Sightengine) qui refuse la nudité et les contenus sexuels ; la
            photo d'un look est aussi analysée par un outil d'intelligence artificielle qui vérifie qu'elle montre une
            tenue ou un vêtement ; chaque lien produit est vérifié automatiquement (format du lien, site bloqué, page qui
            parle bien d'un vêtement ou d'un accessoire). Un contenu refusé n'est pas publié et un message en indique la
            raison.
          </li>
          <li>
            <strong>Des vérifications humaines</strong> : si la vérification automatique d'une photo n'a pas pu se faire,
            la photo est publiée puis vérifiée par une personne de l'équipe. Toute décision de supprimer un contenu publié
            ou de suspendre un compte est prise par une personne, jamais par un outil automatique.
          </li>
          <li>
            <strong>Les signalements</strong> : un utilisateur connecté peut signaler un look (lien cassé, arnaque, contenu
            choquant, photo volée, personne de moins de 18 ans). Toute personne, même sans compte, peut signaler une
            violation de droits d'auteur ou de marque, ou un contenu illégal (voir la page{" "}
            <Link to="/dsa">Services numériques</Link>). Chaque signalement est examiné par une personne, de façon
            objective et proportionnée.
          </li>
          <li>
            <strong>Les mesures possibles</strong> : refus d'un contenu à l'envoi, suppression d'un look, d'une photo de
            profil ou d'une bannière, blocage d'un site dans les liens produits, avertissement, suspension d'un compte en
            cas de manquement grave ou répété. La personne concernée reçoit un message qui explique la mesure, sa raison,
            sa base et comment la contester.
          </li>
          <li>
            <strong>Contester une décision</strong> : écrivez à <ContactMail /> en expliquant pourquoi la décision vous
            semble injuste. Une personne de l'équipe réexamine le dossier et vous répond. Vous pouvez aussi vous adresser à
            un organisme de règlement extrajudiciaire des litiges certifié, ou aux tribunaux.
          </li>
        </ul>
      ),
    },
    {
      id: "marques-liens",
      title: "Liens vers les marques",
      short: "On ne vend rien : un achat se fait directement chez la marque.",
      body: (
        <p>
          Wanted Fashion ne vend rien. Un achat fait après avoir cliqué sur un lien se passe directement entre vous et la
          marque ou la boutique : c'est elle qui est responsable du produit, de son prix, de la livraison, des retours et
          de votre droit de rétractation. Nous vérifions les liens au moment de leur publication, mais nous ne contrôlons
          pas les sites des marques et ne garantissons pas que le produit, son prix ou sa disponibilité n'ont pas changé.
          {AFFILIATE_ENABLED &&
            " Les liens affiliés sont signalés « Lien affilié » : le créateur et Wanted Fashion peuvent toucher une commission si vous achetez, sans surcoût pour vous."}
        </p>
      ),
    },
    AFFILIATE_ENABLED && {
      id: "commissions",
      title: "Commissions et paiements",
      short: "Le créateur reçoit la moitié de la commission, après un délai de sécurité de 30 jours.",
      body: (
        <ul>
          <li>La part reversée au créateur est de 50 % de la commission perçue par Wanted Fashion sur chaque vente.</li>
          <li>
            Une vente n'est comptée comme définitive qu'après un délai de sécurité de 30 jours à compter de sa détection,
            le temps de vérifier qu'elle n'est pas annulée ou remboursée par la marque.
          </li>
          <li>
            Wanted Fashion peut retenir ou refuser une commission en cas de suspicion raisonnable de fraude (auto-achat,
            fausse déclaration de vente, activité anormale).
          </li>
        </ul>
      ),
    },
    AFFILIATE_ENABLED && {
      id: "partenaires",
      title: "Marques partenaires",
      short: "Une marque partenaire déclare de bonne foi les ventes venues du site.",
      body: (
        <p>
          Une marque qui rejoint le programme d'affiliation accepte de déclarer de bonne foi les ventes générées via ses
          liens, selon les modalités techniques convenues (pixel ou intégration serveur-à-serveur).
        </p>
      ),
    },
    {
      id: "fin",
      title: "Suspension et suppression du compte",
      short: "Tu peux partir quand tu veux ; on peut suspendre un compte qui enfreint les règles.",
      body: (
        <ul>
          <li>
            Vous pouvez supprimer votre compte à tout moment depuis les paramètres du dashboard. Cette action est
            définitive et supprime vos posts, produits et statistiques associées. Pensez à télécharger vos données avant
            (Paramètres → Compte → « Télécharger mes données »).
          </li>
          <li>
            Nous pouvons suspendre un compte en cas de manquement grave ou répété à ces conditions ou aux Règles de la
            communauté
            {AFFILIATE_ENABLED ? ", et annuler les commissions en attente en cas de fraude" : ""}. La personne concernée
            reçoit un message motivé et peut contester la décision.
          </li>
          <li>Certaines preuves (âge déclaré, conditions acceptées) sont gardées après la suppression, comme expliqué dans la Politique de confidentialité.</li>
        </ul>
      ),
    },
    {
      id: "responsabilite",
      title: "Responsabilité",
      short: "On fait de notre mieux, chacun répond de ce qu'il publie, et tes droits de consommateur restent intacts.",
      body: (
        <ul>
          <li>Nous faisons de notre mieux pour que le site fonctionne bien et en sécurité, mais il peut connaître des pannes ou des erreurs.</li>
          <li>
            Chaque créateur est responsable de ce qu'il publie. Nous ne vérifions pas chaque contenu avant sa publication,
            mais nous agissons rapidement quand un contenu illégal nous est signalé.
          </li>
          <li>
            Rien dans ces conditions ne limite notre responsabilité en cas de faute intentionnelle ou grave, ni les droits
            que vous donne la loi en tant que consommateur.
          </li>
        </ul>
      ),
    },
    {
      id: "contact",
      title: "Point de contact",
      short: "Une seule adresse pour tout : utilisateurs et autorités.",
      body: (
        <p>
          Pour toute question sur ces conditions, la modération ou vos droits, et pour les autorités des États membres, la
          Commission européenne et le Comité européen des services numériques : écrivez à <ContactMail />. Une personne
          vous répond, en français ou en anglais.
        </p>
      ),
    },
    {
      id: "modifications",
      title: "Modification de ces conditions",
      short: "On te prévient avant tout changement important ; tu peux toujours partir.",
      body: (
        <p>
          Nous pouvons modifier ces conditions, par exemple quand le site évolue ou quand la loi change. En cas de
          changement important, les utilisateurs inscrits sont prévenus par une notification sur le site avant qu'il
          s'applique, sauf si la loi impose un changement immédiat. Si vous n'êtes pas d'accord, vous pouvez supprimer
          votre compte à tout moment ; si vous continuez à utiliser le site, les nouvelles conditions s'appliquent.
        </p>
      ),
    },
    {
      id: "droit-applicable",
      title: "Droit applicable et litiges",
      short: "Droit belge, mais tu gardes la protection de ton pays.",
      body: (
        <p>
          Ces conditions sont soumises au droit belge. Si vous êtes un consommateur vivant dans un autre pays de l'Union
          européenne, vous gardez la protection des règles obligatoires de votre pays et pouvez saisir les tribunaux de
          votre pays. En cas de problème, écrivez-nous d'abord : la plupart des difficultés se règlent à l'amiable.
        </p>
      ),
    },
  ];

  return (
    <LegalPage
      path="/conditions"
      title="Conditions d'utilisation"
      updated={LEGAL_UPDATED}
      essentials={[
        "Wanted Fashion est réservé aux 18 ans et plus.",
        "Tes photos restent à toi : tu nous autorises seulement à les afficher pour faire marcher le site.",
        "On ne vend rien : un achat se fait directement chez la marque.",
        "Une personne décide de chaque retrait, et tu peux toujours contester.",
      ]}
      sections={sections.filter(Boolean) as LegalSection[]}
    />
  );
}
