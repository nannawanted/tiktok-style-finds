import { createFileRoute, Link } from "@tanstack/react-router";
import { legalUpdated } from "@/lib/legal";
import { useTranslation } from "@/lib/i18n";
import { ContactMail, LegalPage, type LegalSection } from "@/components/legal/LegalPage";

export const Route = createFileRoute("/regles")({
  head: () => ({ meta: [{ title: "Règles de la communauté — Wanted Fashion" }] }),
  component: RulesPage,
});

// Catégories reprises des « Community Guidelines » de Pinterest (sécurité des contenus, propriété
// intellectuelle, sécurité du site, spam), adaptées à un site de looks et de liens mode.
function RulesPage() {
  const { lang } = useTranslation();
  const en = lang === "en";
  const sections: LegalSection[] = en ? rulesEn() : [
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
      title={en ? "Community guidelines" : "Règles de la communauté"}
      updated={legalUpdated(lang)}
      essentials={en ? [
        "Post real outfits with real fashion links.",
        "Criticise a style if you want, never a person or their body.",
        "No nudity, hate, counterfeits, scams or fake engagement.",
        "A person decides on every sanction, and you can always appeal.",
      ] : [
        "Publie de vraies tenues avec de vrais liens de mode.",
        "Critique un style si tu veux, jamais une personne ou son corps.",
        "Pas de nudité, de haine, de contrefaçons, d'arnaques ni de faux engagement.",
        "Une personne décide de chaque sanction, et tu peux toujours contester.",
      ]}
      sections={sections}
    />
  );
}

/** Traduction anglaise fidèle des règles de la communauté (la version française fait foi). */
function rulesEn(): LegalSection[] {
  return [
    {
      id: "esprit",
      title: "The spirit of Wanted Fashion",
      short: "Real outfits, real links, and respect.",
      body: (
        <>
          <p>
            Wanted Fashion is for sharing outfits and helping people find the clothes being worn. These rules apply to
            everything published on the site: looks, photos, texts, links, profile pictures, banners, bios and usernames.
            They are part of the <Link to="/conditions">Terms of use</Link>.
          </p>
          <ul>
            <li><strong>A look is a real outfit</strong>: the photo must show clothes or accessories being worn or presented.</li>
            <li><strong>A link is a real product</strong>: it must lead to the page of a piece of clothing or an accessory at a brand or shop, without misleading redirects.</li>
            <li><strong>Respect</strong>: everyone dresses the way they want. You can dislike an outfit, not attack the person.</li>
          </ul>
        </>
      ),
    },
    {
      id: "nudite",
      title: "Sexual content and nudity",
      short: "No nudity or sexual content. Lingerie and swimwear presented as fashion are allowed.",
      body: (
        <>
          <p>The following are prohibited:</p>
          <ul>
            <li>nudity, visible intimate parts, explicit or suggestive sexual content;</li>
            <li>the promotion of sexual services;</li>
            <li>intimate images shared without the person's consent, sextortion, tools that “undress” a photo.</li>
          </ul>
          <p>Lingerie, swimwear and close-fitting outfits are allowed when presented as fashion, without a sexual pose or intent.</p>
        </>
      ),
    },
    {
      id: "mineurs",
      title: "Protection of minors",
      short: "Zero tolerance for any content that endangers children.",
      body: (
        <ul>
          <li>Any content involving the sexual exploitation of minors is prohibited, removed immediately and reported to the competent authorities.</li>
          <li>Also prohibited: sexualised depictions of minors, soliciting or manipulating minors, and nudity, even partial, of minors.</li>
          <li>Wanted Fashion is for people aged 18 and over: report to us any account that seems to belong to a minor.</li>
        </ul>
      ),
    },
    {
      id: "haine",
      title: "Hate",
      short: "No attacks on people for who they are.",
      body: (
        <p>
          Insults, degrading stereotypes, calls for exclusion or attacks targeting people because of their origin, skin
          colour, religion, disability, gender, gender identity, sexual orientation, age or any other protected
          characteristic are prohibited, as is support for hate groups.
        </p>
      ),
    },
    {
      id: "harcelement",
      title: "Harassment and criticism",
      short: "Criticising a style, yes. Mocking a body or harassing someone, no.",
      body: (
        <ul>
          <li>Harassment, personal attacks and cyberbullying are prohibited.</li>
          <li>Mocking someone's body, weight, height or physical appearance (“body shaming”) is prohibited.</li>
          <li>Unwanted sexual remarks are prohibited.</li>
          <li>Mocking someone's pain or grief is prohibited.</li>
        </ul>
      ),
    },
    {
      id: "violence",
      title: "Violence, threats and violent groups",
      short: "No threats, shocking violence or support for violent groups.",
      body: (
        <ul>
          <li>Threats, calls for violence and the glorification of violence are prohibited.</li>
          <li>Images of shocking violence or violent events are prohibited.</li>
          <li>Accounts and content that support or represent extremist, terrorist or violent groups are prohibited.</li>
        </ul>
      ),
    },
    {
      id: "sante",
      title: "Self-harm and eating disorders",
      short: "Nothing that encourages self-harm, dangerous weight loss or deprivation.",
      body: (
        <ul>
          <li>Content that shows, encourages or normalises self-harm or suicide is prohibited.</li>
          <li>Content that encourages eating disorders or extreme thinness (for example “thinspiration”, deprivation challenges) is prohibited.</li>
          <li>
            If you're going through a difficult time, talk to someone you trust. In Belgium, the Centre de Prévention du
            Suicide answers on 0800 32 123 (in Dutch: 1813); in France, call 3114. In an emergency, call 112.
          </li>
        </ul>
      ),
    },
    {
      id: "vie-privee",
      title: "Private information",
      short: "Don't publish someone's private information, or their photo without their consent.",
      body: (
        <p>
          It is prohibited to publish private information about a person (address, phone number, identity documents, health
          data, banking information, login credentials) or the photo of a private person without their consent. If a photo
          of you has been published without your consent, report it.
        </p>
      ),
    },
    {
      id: "usurpation",
      title: "Impersonation",
      short: "Don't pretend to be someone else, or a brand.",
      body: (
        <p>
          It is prohibited to use the identity of another person, creator or brand in a misleading way (name, photo, logo).
          Fan or parody accounts are allowed if they clearly state that they have no official connection with the person or
          brand.
        </p>
      ),
    },
    {
      id: "produits",
      title: "Counterfeits, prohibited products and scams",
      short: "No counterfeits, illegal products or booby-trapped links.",
      body: (
        <ul>
          <li><strong>Counterfeits</strong>: links to copies of branded products sold as originals, or that use a brand's logo or name without permission, are prohibited.</li>
          <li><strong>Prohibited or regulated products</strong>: weapons, drugs, medicines sold without a prescription, and tobacco and alcohol sold illegally are prohibited.</li>
          <li><strong>Protected animals</strong>: products made from endangered or protected species are prohibited.</li>
          <li><strong>Scams</strong>: fake products, fake contests, promises of easy money, links that steal data or credentials, and pages that imitate a real shop are prohibited.</li>
          <li><strong>Dangerous false information</strong>: “miracle” products or advice presented as remedies (for example for weight loss) and false information that endangers health are prohibited.</li>
        </ul>
      ),
    },
    {
      id: "spam",
      title: "Spam and fake engagement",
      short: "No bots, fake accounts or buying views or followers.",
      body: (
        <ul>
          <li>Using unauthorised bots or automated programs is prohibited.</li>
          <li>Fake accounts, accounts created in bulk and multiple accounts used to manipulate the site are prohibited.</li>
          <li>Buying, selling or exchanging views, clicks, likes or followers is prohibited.</li>
          <li>Repetitive content, misleading links or abusive redirects, and piling up hashtags unrelated to the look are prohibited.</li>
        </ul>
      ),
    },
    {
      id: "pi",
      title: "Copyright and trademarks",
      short: "Only publish photos that belong to you or that you have the right to use.",
      body: (
        <p>
          It is prohibited to publish content that infringes someone else's copyright, image rights or trademark. A rights
          holder can ask for content to be removed on the <Link to="/droits-auteur">Copyright and trademarks</Link> page.
          Each removal on these grounds gives a 90-day strike; at 3 strikes, the account is suspended.
        </p>
      ),
    },
    {
      id: "securite",
      title: "Site security",
      short: "Don't hack the site or collect other people's data.",
      body: (
        <ul>
          <li>It is prohibited to try to get around the site's protections, access it without authorisation or disrupt how it works.</li>
          <li>It is prohibited to copy the site's content in bulk (“scraping”) or collect other users' data without authorisation.</li>
          <li>It is prohibited to share your login credentials or sell an account or username.</li>
          <li>If you find a security flaw, let us know at <ContactMail /> without exploiting it.</li>
        </ul>
      ),
    },
    {
      id: "mesures",
      title: "What happens if a rule is broken",
      short: "Depending on how serious it is: removal, warning or account suspension. A person always decides.",
      body: (
        <>
          <p>Depending on how serious and repeated it is, we may:</p>
          <ul>
            <li>refuse content on upload (automated checks);</li>
            <li>remove a look, a profile picture or a banner;</li>
            <li>block a site in product links;</li>
            <li>give a warning;</li>
            <li>suspend the account, immediately for the most serious violations (exploitation of minors, threats, serious illegal content).</li>
          </ul>
          <p>
            Every removal or suspension is decided by a person, and the person concerned receives a message explaining the
            measure, its reason, its basis and how to appeal. Manifestly illegal content may be reported to the competent
            authorities.
          </p>
        </>
      ),
    },
    {
      id: "signaler",
      title: "Report and appeal",
      short: "The “Report” button on each look, or the public form, even without an account.",
      body: (
        <ul>
          <li>Signed in: use the “Report” button on the look's page.</li>
          <li>
            Without an account, or for illegal content, copyright or a trademark: use the{" "}
            <Link to="/droits-auteur">report form</Link>.
          </li>
          <li>
            To appeal a decision: write to <ContactMail /> explaining why. A person reviews the case. The other possible
            remedies are explained on the <Link to="/dsa">Digital services</Link> page.
          </li>
        </ul>
      ),
    },
  ];
}
