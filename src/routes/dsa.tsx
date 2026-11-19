import { createFileRoute, Link } from "@tanstack/react-router";
import { legalUpdated } from "@/lib/legal";
import { useTranslation } from "@/lib/i18n";
import { ContactMail, LegalPage, type LegalSection } from "@/components/legal/LegalPage";

export const Route = createFileRoute("/dsa")({
  head: () => ({ meta: [{ title: "Services numériques (DSA) — Wanted Fashion" }] }),
  component: DsaPage,
});

// Sur le modèle de la page « Digital Services Act » de Pinterest (points de contact, signalement de contenus
// illégaux, recours, règlement extrajudiciaire, transparence), avec les voies de recours décrites par l'IBPT,
// coordinateur belge pour les services numériques.
const BODIES: { name: string; url: string; note: string }[] = [
  { name: "ADR Center", url: "https://ods.adrcenter.com/", note: "large champ : produits illégaux, vie privée, haine, propriété intellectuelle, arnaques, violence" },
  { name: "ADR Point", url: "https://ods.adrpoint.com/en", note: "vie privée, discours illégaux, propriété intellectuelle, produits dangereux, arnaques" },
  { name: "ADROIT", url: "https://adroit.legal/", note: "partage de contenus, achats en ligne, places de marché" },
  { name: "Central European Appeals Hub", url: "https://ceappeals.online/", note: "contenus illégaux et non-respect des conditions" },
];

function DsaPage() {
  const { lang } = useTranslation();
  const en = lang === "en";
  const sections: LegalSection[] = en ? dsaEn() : [
    {
      id: "service",
      title: "Le service concerné",
      short: "Wanted Fashion héberge les looks publiés par ses utilisateurs.",
      body: (
        <p>
          Wanted Fashion est un service d'hébergement au sens du règlement (UE) 2022/2065 sur les services numériques
          (« DSA ») : il stocke et affiche les looks, photos et liens publiés par ses utilisateurs. Cette page rassemble
          les informations prévues par ce règlement.
        </p>
      ),
    },
    {
      id: "contact",
      title: "Point de contact unique",
      short: "Une adresse pour les utilisateurs et pour les autorités, en français ou en anglais.",
      body: (
        <p>
          Utilisateurs, autorités des États membres, Commission européenne et Comité européen des services numériques
          peuvent nous écrire à <ContactMail /> (articles 11 et 12 du DSA). Langues acceptées : français et anglais. Une
          personne lit chaque message.
        </p>
      ),
    },
    {
      id: "signaler",
      title: "Signaler un contenu illégal",
      short: "Formulaire public, même sans compte. On confirme la réception et on te donne notre décision.",
      body: (
        <>
          <p>
            Toute personne, avec ou sans compte, peut signaler un contenu qu'elle estime illégal avec le{" "}
            <Link to="/droits-auteur" search={{ type: "illegal" }}>formulaire de signalement</Link> (article 16 du DSA).
            Un utilisateur connecté peut aussi utiliser le bouton « Signaler » sur la page d'un look.
          </p>
          <p>Pour être traité rapidement, un signalement doit contenir :</p>
          <ul>
            <li>une explication des raisons pour lesquelles le contenu est illégal ;</li>
            <li>le lien exact du contenu ;</li>
            <li>votre nom et votre adresse e-mail ;</li>
            <li>une déclaration confirmant que vous agissez de bonne foi et que les informations sont exactes et complètes.</li>
          </ul>
          <p>
            Nous confirmons la réception du signalement, l'examinons de façon objective et sans retard, puis vous informons
            de notre décision et des recours possibles. Les décisions sont prises par une personne, pas par un outil
            automatique.
          </p>
        </>
      ),
    },
    {
      id: "decisions",
      title: "Nos décisions et leurs motifs",
      short: "Chaque mesure est expliquée à la personne concernée.",
      body: (
        <p>
          Quand nous retirons un contenu ou suspendons un compte, la personne concernée reçoit un exposé des motifs
          (article 17 du DSA) : la mesure prise et sa portée, les faits qui l'ont motivée, la base (loi ou{" "}
          <Link to="/regles">Règles de la communauté</Link>), le fait qu'elle a été décidée par une personne, et les voies
          de recours. Le fonctionnement de la modération est détaillé dans les{" "}
          <Link to="/conditions" hash="moderation">Conditions d'utilisation</Link>.
        </p>
      ),
    },
    {
      id: "contester",
      title: "Contester une décision",
      short: "Écris-nous dans les 6 mois : une personne réexamine gratuitement.",
      body: (
        <p>
          Vous pouvez contester une décision (retrait d'un contenu, suspension de compte, refus de donner suite à votre
          signalement) en écrivant à <ContactMail /> dans les 6 mois, en expliquant pourquoi. C'est gratuit. Une personne
          qui n'a pas pris la première décision, quand c'est possible, réexamine le dossier et vous répond.
        </p>
      ),
    },
    {
      id: "extrajudiciaire",
      title: "Règlement extrajudiciaire des litiges",
      short: "Des organismes certifiés peuvent trancher un désaccord, sans passer par un tribunal.",
      body: (
        <>
          <p>
            Vous pouvez aussi vous adresser à un organisme de règlement extrajudiciaire des litiges certifié (article 21 du
            DSA). Ses décisions ne sont pas contraignantes, mais nous nous engageons à participer de bonne foi. Quelques
            organismes certifiés dont le champ couvre ce type de site :
          </p>
          <ul>
            {BODIES.map((b) => (
              <li key={b.name}>
                <a href={b.url} target="_blank" rel="noopener noreferrer">
                  {b.name}
                </a>{" "}
                — {b.note}
              </li>
            ))}
          </ul>
          <p>
            La liste complète et à jour est publiée par la{" "}
            <a href="https://digital-strategy.ec.europa.eu/en/policies/dsa-out-court-dispute-settlement" target="_blank" rel="noopener noreferrer">
              Commission européenne
            </a>
            .
          </p>
        </>
      ),
    },
    {
      id: "autorites",
      title: "Plaintes auprès des autorités et des tribunaux",
      short: "Tu peux aussi saisir l'IBPT, la police pour un contenu manifestement illégal, ou un tribunal.",
      body: (
        <ul>
          <li>
            En Belgique, le coordinateur pour les services numériques est l'
            <a href="https://www.bipt.be/consumers/digital-service-act-in-a-nutshell" target="_blank" rel="noopener noreferrer">
              IBPT
            </a>{" "}
            : vous pouvez y déposer une plainte si un signalement n'est pas traité correctement.
          </li>
          <li>Un contenu manifestement illégal peut aussi être signalé à la police ou à l'autorité compétente (par exemple le SPF Économie pour les arnaques).</li>
          <li>Vous pouvez toujours saisir les tribunaux compétents.</li>
        </ul>
      ),
    },
    {
      id: "transparence",
      title: "Transparence",
      short: "Wanted Fashion est une très petite plateforme : les obligations des géants ne s'y appliquent pas.",
      body: (
        <p>
          Wanted Fashion est une très petite structure : les obligations que le DSA réserve aux plateformes plus grandes
          (rapports de transparence, publication du nombre d'utilisateurs, etc.) ne s'appliquent pas à elle (articles 15
          §2 et 19 du DSA). Elle compte bien moins de 45 millions d'utilisateurs dans l'Union européenne et n'est donc pas
          une « très grande plateforme ». Nous appliquons malgré tout les règles de signalement, de motivation des
          décisions et de recours décrites sur cette page.
        </p>
      ),
    },
  ];

  return (
    <LegalPage
      path="/dsa"
      title={en ? "Digital services (DSA)" : "Services numériques (DSA)"}
      updated={legalUpdated(lang)}
      essentials={en ? [
        "Anyone can report illegal content, even without an account.",
        "Every report is read by a person, who replies to you.",
        "You can appeal a decision for free for 6 months.",
        "Single point of contact: nannawanted@gmail.com (FR / EN).",
      ] : [
        "Tout le monde peut signaler un contenu illégal, même sans compte.",
        "Chaque signalement est lu par une personne, qui te répond.",
        "Tu peux contester une décision gratuitement pendant 6 mois.",
        "Point de contact unique : nannawanted@gmail.com (FR / EN).",
      ]}
      sections={sections}
    />
  );
}

const BODIES_EN: { name: string; url: string; note: string }[] = [
  { name: "ADR Center", url: "https://ods.adrcenter.com/", note: "broad scope: illegal products, privacy, hate, intellectual property, scams, violence" },
  { name: "ADR Point", url: "https://ods.adrpoint.com/en", note: "privacy, illegal speech, intellectual property, dangerous products, scams" },
  { name: "ADROIT", url: "https://adroit.legal/", note: "content sharing, online shopping, marketplaces" },
  { name: "Central European Appeals Hub", url: "https://ceappeals.online/", note: "illegal content and breaches of terms and conditions" },
];

/** Traduction anglaise fidèle de la page DSA (la version française fait foi). */
function dsaEn(): LegalSection[] {
  return [
    {
      id: "service",
      title: "The service concerned",
      short: "Wanted Fashion hosts the looks published by its users.",
      body: (
        <p>
          Wanted Fashion is a hosting service within the meaning of Regulation (EU) 2022/2065 on digital services (the
          “DSA”): it stores and displays the looks, photos and links published by its users. This page brings together
          the information required by that regulation.
        </p>
      ),
    },
    {
      id: "contact",
      title: "Single point of contact",
      short: "One address for users and authorities, in French or English.",
      body: (
        <p>
          Users, Member State authorities, the European Commission and the European Board for Digital Services can write to
          us at <ContactMail /> (Articles 11 and 12 DSA). Accepted languages: French and English. A person reads every
          message.
        </p>
      ),
    },
    {
      id: "signaler",
      title: "Reporting illegal content",
      short: "Public form, even without an account. We confirm receipt and give you our decision.",
      body: (
        <>
          <p>
            Anyone, with or without an account, can report content they consider illegal using the{" "}
            <Link to="/droits-auteur" search={{ type: "illegal" }}>report form</Link> (Article 16 DSA). A signed-in user can
            also use the “Report” button on a look's page.
          </p>
          <p>To be handled quickly, a report must contain:</p>
          <ul>
            <li>an explanation of why the content is illegal;</li>
            <li>the exact link to the content;</li>
            <li>your name and email address;</li>
            <li>a statement confirming that you are acting in good faith and that the information is accurate and complete.</li>
          </ul>
          <p>
            We confirm receipt of the report, examine it objectively and without delay, then inform you of our decision and
            the possible remedies. Decisions are made by a person, not by an automated tool.
          </p>
        </>
      ),
    },
    {
      id: "decisions",
      title: "Our decisions and their reasons",
      short: "Every measure is explained to the person concerned.",
      body: (
        <p>
          When we remove content or suspend an account, the person concerned receives a statement of reasons (Article 17
          DSA): the measure taken and its scope, the facts on which it is based, the ground (law or{" "}
          <Link to="/regles">Community guidelines</Link>), the fact that it was decided by a person, and the available
          remedies. How moderation works is detailed in the <Link to="/conditions" hash="moderation">Terms of use</Link>.
        </p>
      ),
    },
    {
      id: "contester",
      title: "Appealing a decision",
      short: "Write to us within 6 months: a person reviews it for free.",
      body: (
        <p>
          You can appeal a decision (removal of content, account suspension, refusal to act on your report) by writing to{" "}
          <ContactMail /> within 6 months, explaining why. It's free. A person who did not take the first decision, where
          possible, reviews the case and replies to you.
        </p>
      ),
    },
    {
      id: "extrajudiciaire",
      title: "Out-of-court dispute settlement",
      short: "Certified bodies can settle a disagreement without going to court.",
      body: (
        <>
          <p>
            You can also turn to a certified out-of-court dispute settlement body (Article 21 DSA). Its decisions are not
            binding, but we undertake to take part in good faith. Some certified bodies whose scope covers this type of
            site:
          </p>
          <ul>
            {BODIES_EN.map((b) => (
              <li key={b.name}>
                <a href={b.url} target="_blank" rel="noopener noreferrer">
                  {b.name}
                </a>{" "}
                — {b.note}
              </li>
            ))}
          </ul>
          <p>
            The full, up-to-date list is published by the{" "}
            <a href="https://digital-strategy.ec.europa.eu/en/policies/dsa-out-court-dispute-settlement" target="_blank" rel="noopener noreferrer">
              European Commission
            </a>
            .
          </p>
        </>
      ),
    },
    {
      id: "autorites",
      title: "Complaints to authorities and courts",
      short: "You can also contact the BIPT, the police for manifestly illegal content, or a court.",
      body: (
        <ul>
          <li>
            In Belgium, the Digital Services Coordinator is the{" "}
            <a href="https://www.bipt.be/consumers/digital-service-act-in-a-nutshell" target="_blank" rel="noopener noreferrer">
              BIPT
            </a>
            : you can file a complaint there if a report is not handled properly.
          </li>
          <li>Manifestly illegal content can also be reported to the police or the competent authority (for example the FPS Economy for scams).</li>
          <li>You can always go to the competent courts.</li>
        </ul>
      ),
    },
    {
      id: "transparence",
      title: "Transparency",
      short: "Wanted Fashion is a very small platform: the obligations of the giants don't apply to it.",
      body: (
        <p>
          Wanted Fashion is a very small organisation: the obligations that the DSA reserves for larger platforms
          (transparency reports, publication of the number of users, etc.) do not apply to it (Articles 15(2) and 19 DSA).
          It has far fewer than 45 million users in the European Union and is therefore not a “very large platform”. We
          nevertheless apply the rules on reporting, statements of reasons and appeals described on this page.
        </p>
      ),
    },
  ];
}
