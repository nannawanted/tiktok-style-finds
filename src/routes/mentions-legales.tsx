import { createFileRoute, Link } from "@tanstack/react-router";
import { PUBLISHER_NAME, legalUpdated } from "@/lib/legal";
import { useTranslation } from "@/lib/i18n";
import { ContactMail, LegalPage, type LegalSection } from "@/components/legal/LegalPage";

export const Route = createFileRoute("/mentions-legales")({
  head: () => ({ meta: [{ title: "Mentions légales — Wanted Fashion" }] }),
  component: ImprintPage,
});

// Informations demandées par l'article 5 de la directive 2000/31/CE sur le commerce électronique
// (article III.74 du Code de droit économique en Belgique) : identité de l'éditeur, contact direct et rapide,
// et, comme sur les pages « Imprint » des grandes plateformes, l'hébergeur.
function ImprintPage() {
  const { lang } = useTranslation();
  const en = lang === "en";
  const sections: LegalSection[] = en ? imprintEn() : [
    {
      id: "editeur",
      title: "Éditeur du site",
      body: PUBLISHER_NAME ? (
        <p>
          Wanted Fashion est édité par <strong>{PUBLISHER_NAME}</strong>, à titre non commercial, en Belgique. Contact :{" "}
          <ContactMail />.
        </p>
      ) : (
        <p>
          Les informations sur l'éditeur seront publiées ici prochainement. En attendant, l'éditeur peut être contacté
          directement à <ContactMail />.
        </p>
      ),
    },
    {
      id: "contact",
      title: "Nous contacter",
      body: (
        <p>
          Par e-mail à <ContactMail />, en français ou en anglais. Une personne lit chaque message. Pour signaler un contenu,
          utilisez le <Link to="/droits-auteur">formulaire de signalement</Link>.
        </p>
      ),
    },
    {
      id: "hebergeur",
      title: "Hébergement",
      body: (
        <ul>
          <li>
            <strong>Site</strong> : Vercel Inc., 440 N Barranca Avenue #4133, Covina, CA 91723, États-Unis —{" "}
            <a href="https://vercel.com" target="_blank" rel="noopener noreferrer">
              vercel.com
            </a>
            .
          </li>
          <li>
            <strong>Base de données et photos</strong> : Supabase, serveurs situés en Irlande (Union européenne) —{" "}
            <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">
              supabase.com
            </a>
            .
          </li>
        </ul>
      ),
    },
    {
      id: "autres",
      title: "Autres informations",
      body: (
        <p>
          Les règles d'utilisation, la protection des données et les recours sont expliqués dans le{" "}
          <Link to="/legal">Centre juridique</Link>.
        </p>
      ),
    },
  ];

  return <LegalPage path="/mentions-legales" title={en ? "Legal notice" : "Mentions légales"} updated={legalUpdated(lang)} sections={sections} />;
}

/** Traduction anglaise fidèle des mentions légales (la version française fait foi). */
function imprintEn(): LegalSection[] {
  return [
    {
      id: "editeur",
      title: "Publisher of the site",
      body: PUBLISHER_NAME ? (
        <p>
          Wanted Fashion is published by <strong>{PUBLISHER_NAME}</strong>, on a non-commercial basis, in Belgium. Contact:{" "}
          <ContactMail />.
        </p>
      ) : (
        <p>
          Information about the publisher will be published here soon. In the meantime, the publisher can be contacted
          directly at <ContactMail />.
        </p>
      ),
    },
    {
      id: "contact",
      title: "Contact us",
      body: (
        <p>
          By email at <ContactMail />, in French or English. A person reads every message. To report content, use the{" "}
          <Link to="/droits-auteur">report form</Link>.
        </p>
      ),
    },
    {
      id: "hebergeur",
      title: "Hosting",
      body: (
        <ul>
          <li>
            <strong>Website</strong>: Vercel Inc., 440 N Barranca Avenue #4133, Covina, CA 91723, United States —{" "}
            <a href="https://vercel.com" target="_blank" rel="noopener noreferrer">
              vercel.com
            </a>
            .
          </li>
          <li>
            <strong>Database and photos</strong>: Supabase, servers located in Ireland (European Union) —{" "}
            <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">
              supabase.com
            </a>
            .
          </li>
        </ul>
      ),
    },
    {
      id: "autres",
      title: "Other information",
      body: (
        <p>
          The rules of use, data protection and remedies are explained in the <Link to="/legal">Legal centre</Link>.
        </p>
      ),
    },
  ];
}
