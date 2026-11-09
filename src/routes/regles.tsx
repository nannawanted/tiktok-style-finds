import { createFileRoute, Link } from "@tanstack/react-router";
import { LEGAL_UPDATED } from "@/lib/legal";
import { ContactMail, LegalPage, type LegalSection } from "@/components/legal/LegalPage";

export const Route = createFileRoute("/regles")({
  head: () => ({ meta: [{ title: "Règles de la communauté — Wanted Fashion" }] }),
  component: RulesPage,
});

// Catégories reprises des « Community Guidelines » de Pinterest (sécurité des contenus, propriété
// intellectuelle, sécurité du site, spam), adaptées à un site de looks et de liens mode.
function RulesPage() {
  const sections: LegalSection[] = [
    {
      id: "esprit",
      title: "L'esprit de Wanted Fashion",
      short: "De vraies tenues, de vrais liens, et du respect.",
      body: (
        <>
          <p>
            Wanted Fashion sert à partager des tenues et à aider les gens à retrouver les vêtements portés. Ces règles
            s'appliquent à tout ce qui est publié sur le site : looks, photos, textes, liens, photos de profil, bannières,
            bios et noms d'utilisateur. Elles font partie des <Link to="/conditions">Conditions d'utilisation</Link>.
          </p>
          <ul>
            <li><strong>Un look, c'est une vraie tenue</strong> : la photo doit montrer des vêtements ou accessoires portés ou présentés.</li>
            <li><strong>Un lien, c'est un vrai produit</strong> : il doit mener à la page d'un vêtement ou d'un accessoire chez une marque ou une boutique, sans redirection trompeuse.</li>
            <li><strong>Le respect</strong> : chacun s'habille comme il veut. On peut ne pas aimer une tenue, pas attaquer la personne.</li>
          </ul>
        </>
      ),
    },
    {
      id: "nudite",
      title: "Contenu sexuel et nudité",
      short: "Pas de nudité ni de contenu sexuel. La lingerie et les maillots présentés comme de la mode sont autorisés.",
      body: (
        <>
          <p>Sont interdits :</p>
          <ul>
            <li>la nudité, les parties intimes visibles, les contenus sexuels explicites ou suggestifs ;</li>
            <li>la promotion de services sexuels ;</li>
            <li>les images intimes partagées sans le consentement de la personne, la sextorsion, les outils qui « déshabillent » une photo.</li>
          </ul>
          <p>La lingerie, les maillots de bain et les tenues près du corps sont autorisés quand ils sont présentés comme de la mode, sans pose ni intention sexuelle.</p>
        </>
      ),
    },
    {
      id: "mineurs",
      title: "Protection des mineurs",
      short: "Tolérance zéro pour tout contenu qui met en danger des enfants.",
      body: (
        <ul>
          <li>Tout contenu d'exploitation sexuelle de mineurs est interdit, supprimé immédiatement et signalé aux autorités compétentes.</li>
          <li>Sont aussi interdits : les représentations sexualisées de mineurs, la sollicitation ou la manipulation de mineurs, et la nudité, même partielle, de mineurs.</li>
          <li>Wanted Fashion est réservé aux 18 ans et plus : signalez-nous tout compte qui semble appartenir à une personne mineure.</li>
        </ul>
      ),
    },
    {
      id: "haine",
      title: "Haine",
      short: "Aucune attaque contre des personnes pour ce qu'elles sont.",
      body: (
        <p>
          Sont interdits les insultes, stéréotypes dégradants, appels à l'exclusion ou attaques visant des personnes en
          raison de leur origine, de leur couleur de peau, de leur religion, de leur handicap, de leur genre, de leur
          identité de genre, de leur orientation sexuelle, de leur âge ou de toute autre caractéristique protégée, ainsi
          que le soutien à des groupes haineux.
        </p>
      ),
    },
    {
      id: "harcelement",
      title: "Harcèlement et critiques",
      short: "Critiquer un style, oui. Se moquer d'un corps ou harceler quelqu'un, non.",
      body: (
        <ul>
          <li>Le harcèlement, les attaques personnelles et le cyberharcèlement sont interdits.</li>
          <li>Les moqueries sur le corps, le poids, la taille ou l'apparence physique (« body shaming ») sont interdites.</li>
          <li>Les remarques sexuelles non désirées sont interdites.</li>
          <li>Se moquer de la douleur ou du deuil de quelqu'un est interdit.</li>
        </ul>
      ),
    },
    {
      id: "violence",
      title: "Violence, menaces et groupes violents",
      short: "Pas de menaces, de violence choquante ni de soutien à des groupes violents.",
      body: (
        <ul>
          <li>Les menaces, les appels à la violence et la glorification de la violence sont interdits.</li>
          <li>Les images de violence choquante ou d'événements violents sont interdites.</li>
          <li>Les comptes et contenus qui soutiennent ou représentent des groupes extrémistes, terroristes ou violents sont interdits.</li>
        </ul>
      ),
    },
    {
      id: "sante",
      title: "Automutilation et troubles alimentaires",
      short: "Rien qui encourage à se faire du mal, à maigrir dangereusement ou à se priver.",
      body: (
        <ul>
          <li>Les contenus qui montrent, encouragent ou présentent comme normal l'automutilation ou le suicide sont interdits.</li>
          <li>
            Les contenus qui encouragent les troubles alimentaires ou une maigreur extrême (par exemple « thinspiration »,
            défis de privation) sont interdits.
          </li>
          <li>
            Si vous traversez une période difficile, parlez-en à quelqu'un de confiance. En Belgique, le Centre de
            Prévention du Suicide répond au 0800 32 123 (en néerlandais : 1813) ; en France, appelez le 3114. En cas
            d'urgence, appelez le 112.
          </li>
        </ul>
      ),
    },
    {
      id: "vie-privee",
      title: "Informations privées",
      short: "Ne publie pas les infos privées de quelqu'un, ni sa photo sans son accord.",
      body: (
        <p>
          Il est interdit de publier des informations privées sur une personne (adresse, téléphone, documents d'identité,
          données de santé, informations bancaires, identifiants de connexion) ou la photo d'une personne privée sans
          son accord. Si une photo de vous a été publiée sans votre accord, signalez-la.
        </p>
      ),
    },
    {
      id: "usurpation",
      title: "Usurpation d'identité",
      short: "Ne te fais pas passer pour quelqu'un d'autre, ni pour une marque.",
      body: (
        <p>
          Il est interdit d'utiliser l'identité d'une autre personne, d'un créateur ou d'une marque de façon trompeuse
          (nom, photo, logo). Les comptes de fans ou de parodie sont autorisés s'ils indiquent clairement qu'ils n'ont
          aucun lien officiel avec la personne ou la marque.
        </p>
      ),
    },
    {
      id: "produits",
      title: "Contrefaçons, produits interdits et arnaques",
      short: "Pas de contrefaçons, de produits illégaux ni de liens piégés.",
      body: (
        <ul>
          <li>
            <strong>Contrefaçons</strong> : les liens vers des copies de produits de marque vendues comme des originaux, ou
            qui reprennent le logo ou le nom d'une marque sans autorisation, sont interdits.
          </li>
          <li>
            <strong>Produits interdits ou réglementés</strong> : armes, drogues, médicaments vendus sans ordonnance, tabac
            et alcool en vente illégale sont interdits.
          </li>
          <li>
            <strong>Animaux protégés</strong> : les produits faits à partir d'espèces menacées ou protégées sont interdits.
          </li>
          <li>
            <strong>Arnaques</strong> : les faux produits, faux concours, promesses d'argent facile, liens qui volent des
            données ou des identifiants, et pages qui imitent une vraie boutique sont interdits.
          </li>
          <li>
            <strong>Fausses informations dangereuses</strong> : les produits ou conseils « miracle » présentés comme des
            remèdes (par exemple pour maigrir) et les fausses informations qui mettent la santé en danger sont interdits.
          </li>
        </ul>
      ),
    },
    {
      id: "spam",
      title: "Spam et faux engagement",
      short: "Pas de robots, de faux comptes ni d'achat de vues ou d'abonnés.",
      body: (
        <ul>
          <li>L'utilisation de robots ou de programmes automatiques non autorisés est interdite.</li>
          <li>Les faux comptes, les comptes créés en série et les comptes multiples utilisés pour manipuler le site sont interdits.</li>
          <li>Acheter, vendre ou échanger des vues, des clics, des likes ou des abonnés est interdit.</li>
          <li>Les contenus répétitifs, les liens trompeurs ou les redirections abusives, et l'accumulation de hashtags sans rapport avec le look sont interdits.</li>
        </ul>
      ),
    },
    {
      id: "pi",
      title: "Droits d'auteur et marques",
      short: "Publie seulement des photos qui t'appartiennent ou que tu as le droit d'utiliser.",
      body: (
        <p>
          Il est interdit de publier un contenu qui viole les droits d'auteur, le droit à l'image ou la marque de
          quelqu'un d'autre. Un ayant droit peut demander le retrait d'un contenu sur la page{" "}
          <Link to="/droits-auteur">Droits d'auteur et marques</Link>. Chaque retrait pour ce motif donne un
          avertissement de 90 jours ; à 3 avertissements, le compte est suspendu.
        </p>
      ),
    },
    {
      id: "securite",
      title: "Sécurité du site",
      short: "Ne pirate pas le site et ne collecte pas les données des autres.",
      body: (
        <ul>
          <li>Il est interdit de tenter de contourner les protections du site, d'y accéder sans autorisation ou de perturber son fonctionnement.</li>
          <li>Il est interdit de copier le contenu du site en masse (« scraping ») ou de collecter les données des autres utilisateurs sans autorisation.</li>
          <li>Il est interdit de partager ses identifiants ou de vendre un compte ou un nom d'utilisateur.</li>
          <li>Si vous trouvez une faille de sécurité, prévenez-nous à <ContactMail /> sans l'exploiter.</li>
        </ul>
      ),
    },
    {
      id: "mesures",
      title: "Ce qui se passe si une règle n'est pas respectée",
      short: "Selon la gravité : retrait, avertissement ou suspension du compte. Une personne décide toujours.",
      body: (
        <>
          <p>Selon la gravité et la répétition, nous pouvons :</p>
          <ul>
            <li>refuser un contenu à l'envoi (vérifications automatiques) ;</li>
            <li>supprimer un look, une photo de profil ou une bannière ;</li>
            <li>bloquer un site dans les liens produits ;</li>
            <li>donner un avertissement ;</li>
            <li>suspendre le compte, immédiatement pour les manquements les plus graves (exploitation de mineurs, menaces, contenus illégaux graves).</li>
          </ul>
          <p>
            Chaque suppression ou suspension est décidée par une personne, et la personne concernée reçoit un message qui
            explique la mesure, sa raison, sa base et comment la contester. Les contenus manifestement illégaux peuvent être
            signalés aux autorités compétentes.
          </p>
        </>
      ),
    },
    {
      id: "signaler",
      title: "Signaler et contester",
      short: "Le bouton « Signaler » sur chaque look, ou le formulaire public, même sans compte.",
      body: (
        <ul>
          <li>Connecté : utilisez le bouton « Signaler » sur la page du look.</li>
          <li>
            Sans compte, ou pour un contenu illégal, des droits d'auteur ou une marque : utilisez le{" "}
            <Link to="/droits-auteur">formulaire de signalement</Link>.
          </li>
          <li>
            Pour contester une décision : écrivez à <ContactMail /> en expliquant pourquoi. Une personne réexamine le
            dossier. Les autres recours possibles sont expliqués sur la page <Link to="/dsa">Services numériques</Link>.
          </li>
        </ul>
      ),
    },
  ];

  return (
    <LegalPage
      path="/regles"
      title="Règles de la communauté"
      updated={LEGAL_UPDATED}
      essentials={[
        "Publie de vraies tenues avec de vrais liens de mode.",
        "Critique un style si tu veux, jamais une personne ou son corps.",
        "Pas de nudité, de haine, de contrefaçons, d'arnaques ni de faux engagement.",
        "Une personne décide de chaque sanction, et tu peux toujours contester.",
      ]}
      sections={sections}
    />
  );
}
