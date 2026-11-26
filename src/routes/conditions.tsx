import { createFileRoute, Link } from "@tanstack/react-router";
import { AFFILIATE_ENABLED } from "@/lib/features";
import { PUBLISHER_NAME, legalUpdated } from "@/lib/legal";
import { useTranslation } from "@/lib/i18n";
import { ContactMail, LegalPage, type LegalSection } from "@/components/legal/LegalPage";

export const Route = createFileRoute("/conditions")({
  head: () => ({ meta: [{ title: "Conditions d'utilisation — Wanted Fashion" }] }),
  component: TermsPage,
});

// Organisation inspirée des conditions de Pinterest (service, compte, contenus, sécurité, résiliation,
// responsabilité, litiges, modifications), adaptée à ce que WantedFashion fait réellement.
function TermsPage() {
  const { lang } = useTranslation();
  const en = lang === "en";
  const sections: (LegalSection | false)[] = en ? termsEn() : [
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
            choquant, photo volée, personne de moins de 18 ans, hors sujet). Toute personne, même sans compte, peut signaler une
            violation de droits d'auteur ou de marque, ou un contenu illégal (voir la page{" "}
            <Link to="/dsa">Services numériques</Link>). Chaque signalement est examiné par une personne, de façon
            objective et proportionnée.
          </li>
          <li>
            <strong>Les mesures possibles</strong> : refus d'un contenu à l'envoi, masquage d'un look (il n'est plus visible que par son créateur), suppression d'un look, d'une photo de
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
      title={en ? "Terms of use" : "Conditions d'utilisation"}
      updated={legalUpdated(lang)}
      essentials={en ? [
        "Wanted Fashion is for people aged 18 and over.",
        "Your photos remain yours: you only allow us to display them to run the site.",
        "We don't sell anything: purchases are made directly with the brand.",
        "A person decides on every removal, and you can always appeal.",
      ] : [
        "Wanted Fashion est réservé aux 18 ans et plus.",
        "Tes photos restent à toi : tu nous autorises seulement à les afficher pour faire marcher le site.",
        "On ne vend rien : un achat se fait directement chez la marque.",
        "Une personne décide de chaque retrait, et tu peux toujours contester.",
      ]}
      sections={sections.filter(Boolean) as LegalSection[]}
    />
  );
}

/** Traduction anglaise fidèle des conditions (la version française fait foi). */
function termsEn(): (LegalSection | false)[] {
  return [
    {
      id: "service",
      title: "The service",
      short: AFFILIATE_ENABLED
        ? "Creators share their outfits with links to the clothes; we earn a commission on some sales."
        : "Creators share their outfits with links to the clothes they wear. It's free.",
      body: (
        <>
          {AFFILIATE_ENABLED ? (
            <p>
              Wanted Fashion lets creators publish outfits with shopping links to partner brands. Wanted Fashion earns a
              commission on sales made through these links and passes part of it on to the creator concerned.
            </p>
          ) : (
            <p>
              Wanted Fashion lets creators publish their outfits with links to the clothes they wear, on the brands'
              websites. Wanted Fashion earns no commission on these links and pays no money to creators. Using the site is
              free.
            </p>
          )}
          <p>
            The site is published from Belgium{PUBLISHER_NAME ? ` by ${PUBLISHER_NAME}` : ""} (see{" "}
            {PUBLISHER_NAME ? <Link to="/mentions-legales">Legal notice</Link> : "the point of contact below"}). By using
            Wanted Fashion, you accept these terms, our <Link to="/regles">Community guidelines</Link> and our{" "}
            <Link to="/confidentialite">Privacy policy</Link>.
          </p>
        </>
      ),
    },
    {
      id: "age",
      title: "Who can use Wanted Fashion",
      short: "You must be 18 or over to create an account.",
      body: (
        <>
          <p>
            Wanted Fashion is for people aged <strong>18 and over</strong>. When you sign up, you give your date of birth
            and a valid email address. Giving a false date of birth is prohibited: if an account belongs to a person under
            18, it is suspended. Anyone can report an account that seems to belong to a minor.
          </p>
          {AFFILIATE_ENABLED && <p>Before any money is paid to a creator, their identity and age are verified.</p>}
          <p>You don't need an account to browse published looks.</p>
        </>
      ),
    },
    {
      id: "compte",
      title: "Your account and its security",
      short: "Keep your password secret; tell us if someone uses your account.",
      body: (
        <ul>
          <li>You are responsible for what happens on your account. An account is personal: don't lend it or sell it.</li>
          <li>Keep your password secret and don't reuse it elsewhere. A password that has appeared in a known data breach is refused at sign-up.</li>
          <li>You can turn on two-factor authentication in Settings → Security.</li>
          <li>
            If you think someone is using your account without your permission, change your password and let us know at{" "}
            <ContactMail />.
          </li>
        </ul>
      ),
    },
    {
      id: "contenus",
      title: "Your content",
      short: "Your photos remain yours. You only allow us to show them on the site.",
      body: (
        <>
          <p>
            You remain the owner of the content you publish (photos, videos, descriptions). By publishing it, you grant
            Wanted Fashion a free, non-exclusive, worldwide permission to host it, reproduce it (for example to create
            thumbnails), display it publicly on the site and in share previews, and analyse it with automated tools
            (content checks, suggestions of similar looks). This permission is used only to run the site; it ends when you
            delete the content or your account.
          </p>
          <p>
            By publishing, you guarantee that you are the author of the photos and texts you publish, or have their
            author's permission, and that the people visible in your photos agree. You undertake to publish only real
            product links and not to try to distort the site's statistics (views, clicks).
          </p>
          <p>
            The Wanted Fashion name, its logo and the site's design belong to us: don't use them in a way that could
            suggest a connection with us.
          </p>
        </>
      ),
    },
    {
      id: "regles",
      title: "Community guidelines",
      short: "Some content and behaviour is prohibited; the full list is on a separate page.",
      body: (
        <p>
          The <Link to="/regles">Community guidelines</Link> are part of these terms. They list what is prohibited
          (nudity, hate, harassment, counterfeits, scams, spam, fake engagement, etc.) and what happens when a rule is
          broken.
        </p>
      ),
    },
    {
      id: "droits-auteur",
      title: "Copyright and trademarks",
      short: "Only publish what belongs to you. A rights holder can ask for content to be removed.",
      body: (
        <ul>
          <li>
            Product images are displayed from the website of the brand concerned, with a link to its product page. A brand
            can ask for them to be removed at any time.
          </li>
          <li>
            Anyone, with or without an account, can report content that infringes their copyright or trademark on the{" "}
            <Link to="/droits-auteur">Copyright and trademarks</Link> page. Every request is reviewed by a person.
          </li>
          <li>
            Each look removed for copyright or trademark infringement gives the creator a strike, valid for 90 days. With 3
            active strikes, the account is suspended.
          </li>
        </ul>
      ),
    },
    {
      id: "moderation",
      title: "Content moderation",
      short: "Tools check photos and links when they are uploaded; a person decides on every removal.",
      body: (
        <ul>
          <li>
            <strong>Automated checks on upload</strong>: every photo uploaded (look, profile picture, banner) is analysed
            by an automated tool (Sightengine) that refuses nudity and sexual content; the photo of a look is also analysed
            by an artificial intelligence tool that checks that it shows an outfit or a piece of clothing; every product
            link is checked automatically (link format, blocked site, page that is really about a piece of clothing or an
            accessory). Refused content is not published and a message gives the reason.
          </li>
          <li>
            <strong>Human checks</strong>: if the automated check of a photo could not be carried out, the photo is
            published and then checked by a member of the team. Any decision to remove published content or to suspend an
            account is made by a person, never by an automated tool.
          </li>
          <li>
            <strong>Reports</strong>: a signed-in user can report a look (broken link, scam, shocking content, stolen
            photo, person under 18, off-topic). Anyone, even without an account, can report a copyright or trademark
            infringement, or illegal content (see the <Link to="/dsa">Digital services</Link> page). Every report is
            reviewed by a person, objectively and proportionately.
          </li>
          <li>
            <strong>Possible measures</strong>: refusal of content on upload, hiding of a look (only its creator can still see it), removal of a look, profile picture or banner,
            blocking of a site in product links, warning, suspension of an account for serious or repeated violations. The
            person concerned receives a message explaining the measure, its reason, its basis and how to appeal.
          </li>
          <li>
            <strong>Appealing a decision</strong>: write to <ContactMail /> explaining why you think the decision is
            unfair. A member of the team reviews the case and replies. You can also turn to a certified out-of-court
            dispute settlement body, or to the courts.
          </li>
        </ul>
      ),
    },
    {
      id: "marques-liens",
      title: "Links to brands",
      short: "We don't sell anything: purchases are made directly with the brand.",
      body: (
        <p>
          Wanted Fashion doesn't sell anything. A purchase made after clicking a link takes place directly between you and
          the brand or shop: it is responsible for the product, its price, delivery, returns and your right of withdrawal.
          We check links when they are published, but we don't control brands' websites and don't guarantee that the
          product, its price or its availability haven't changed.
          {AFFILIATE_ENABLED &&
            " Affiliate links are marked “Affiliate link”: the creator and Wanted Fashion may earn a commission if you buy, at no extra cost to you."}
        </p>
      ),
    },
    AFFILIATE_ENABLED && {
      id: "commissions",
      title: "Commissions and payments",
      short: "The creator receives half of the commission, after a 30-day security period.",
      body: (
        <ul>
          <li>The share paid to the creator is 50% of the commission received by Wanted Fashion on each sale.</li>
          <li>
            A sale only counts as final after a security period of 30 days from its detection, to check that it isn't
            cancelled or refunded by the brand.
          </li>
          <li>
            Wanted Fashion may withhold or refuse a commission in case of reasonable suspicion of fraud (self-purchase,
            false sale declaration, abnormal activity).
          </li>
        </ul>
      ),
    },
    AFFILIATE_ENABLED && {
      id: "partenaires",
      title: "Partner brands",
      short: "A partner brand declares in good faith the sales that come from the site.",
      body: (
        <p>
          A brand that joins the affiliate programme agrees to declare in good faith the sales generated through its links,
          according to the agreed technical arrangements (pixel or server-to-server integration).
        </p>
      ),
    },
    {
      id: "fin",
      title: "Suspension and deletion of the account",
      short: "You can leave whenever you want; we can suspend an account that breaks the rules.",
      body: (
        <ul>
          <li>
            You can delete your account at any time from the dashboard settings. This is permanent and deletes your posts,
            products and related statistics. Remember to download your data first (Settings → Account → “Download my
            data”).
          </li>
          <li>
            We can suspend an account for serious or repeated violations of these terms or of the Community guidelines
            {AFFILIATE_ENABLED ? ", and cancel pending commissions in case of fraud" : ""}. The person concerned receives a
            message giving reasons and can appeal the decision.
          </li>
          <li>Some evidence (declared age, accepted terms) is kept after deletion, as explained in the Privacy policy.</li>
        </ul>
      ),
    },
    {
      id: "responsabilite",
      title: "Liability",
      short: "We do our best, everyone is responsible for what they publish, and your consumer rights remain intact.",
      body: (
        <ul>
          <li>We do our best to make the site work well and securely, but it may experience outages or errors.</li>
          <li>
            Each creator is responsible for what they publish. We don't check every piece of content before it is
            published, but we act quickly when illegal content is reported to us.
          </li>
          <li>
            Nothing in these terms limits our liability in case of intentional or gross misconduct, nor the rights the law
            gives you as a consumer.
          </li>
        </ul>
      ),
    },
    {
      id: "contact",
      title: "Point of contact",
      short: "One address for everything: users and authorities.",
      body: (
        <p>
          For any question about these terms, moderation or your rights, and for the authorities of Member States, the
          European Commission and the European Board for Digital Services: write to <ContactMail />. A person will reply,
          in French or English.
        </p>
      ),
    },
    {
      id: "modifications",
      title: "Changes to these terms",
      short: "We warn you before any important change; you can always leave.",
      body: (
        <p>
          We may change these terms, for example when the site evolves or when the law changes. In case of an important
          change, registered users are informed by a notification on the site before it applies, unless the law requires an
          immediate change. If you don't agree, you can delete your account at any time; if you continue to use the site,
          the new terms apply.
        </p>
      ),
    },
    {
      id: "droit-applicable",
      title: "Governing law and disputes",
      short: "Belgian law, but you keep the protection of your own country.",
      body: (
        <p>
          These terms are governed by Belgian law. If you are a consumer living in another country of the European Union,
          you keep the protection of the mandatory rules of your country and can go to the courts of your country. If
          there's a problem, write to us first: most difficulties are settled amicably.
        </p>
      ),
    },
  ];
}
