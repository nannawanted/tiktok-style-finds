import { createFileRoute, Link } from "@tanstack/react-router";
import { LEGAL_UPDATED, PUBLISHER_NAME } from "@/lib/legal";
import { ContactMail, LegalPage, type LegalSection } from "@/components/legal/LegalPage";

export const Route = createFileRoute("/mentions-legales")({
  head: () => ({ meta: [{ title: "Mentions légales — Wanted Fashion" }] }),
  component: ImprintPage,
});

// Informations demandées par l'article 5 de la directive 2000/31/CE sur le commerce électronique
// (article III.74 du Code de droit économique en Belgique) : identité de l'éditeur, contact direct et rapide,
// et, comme sur les pages « Imprint » des grandes plateformes, l'hébergeur.
function ImprintPage() {
  const sections: LegalSection[] = [
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

  return <LegalPage path="/mentions-legales" title="Mentions légales" updated={LEGAL_UPDATED} sections={sections} />;
}
