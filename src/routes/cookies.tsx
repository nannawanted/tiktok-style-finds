import { createFileRoute, Link } from "@tanstack/react-router";
import { AFFILIATE_ENABLED } from "@/lib/features";
import { LEGAL_UPDATED } from "@/lib/legal";
import { ContactMail, LegalPage, type LegalSection } from "@/components/legal/LegalPage";
import { openCookieSettings } from "@/components/CookieConsent";

export const Route = createFileRoute("/cookies")({
  head: () => ({ meta: [{ title: "Politique cookies — Wanted Fashion" }] }),
  component: CookiesPage,
});

// Organisation reprise de la politique cookies de Pinterest (ce qu'est un cookie, comment on les utilise,
// ce qu'on fait dans chaque catégorie, où, vos options), avec les exigences de l'Autorité de protection
// des données belge : accord séparé par type, durée de chaque cookie, refus aussi simple, retrait à tout moment.
function CookiesPage() {
  const sections: LegalSection[] = [
    {
      id: "definition",
      title: "Qu'est-ce qu'un cookie ?",
      short: "Un petit fichier que le site garde dans ton navigateur.",
      body: (
        <p>
          Un cookie est une petite quantité de texte qu'un site enregistre dans votre navigateur. Certains disparaissent
          quand vous fermez le navigateur, d'autres restent jusqu'à leur date d'expiration ou jusqu'à ce que vous les
          effaciez. Nous utilisons aussi le « stockage local » du navigateur, qui fonctionne de la même façon : les mêmes
          règles s'y appliquent.
        </p>
      ),
    },
    {
      id: "categories",
      title: "Les types de cookies que nous utilisons",
      short: AFFILIATE_ENABLED ? "Trois types : indispensables, statistiques, suivi des achats." : "Deux types : indispensables et statistiques.",
      body: (
        <>
          <h3>Indispensables — toujours actifs</h3>
          <p>Ils font fonctionner le site (connexion, langue, mémorisation de votre choix). Sans eux, le site ne marche pas : ils n'ont pas besoin de votre accord.</p>
          <h3>Statistiques — seulement avec votre accord</h3>
          <p>Ils nous permettent de savoir combien de personnes visitent le site et de reconnaître une visite de retour. Ils ne servent jamais à de la publicité.</p>
          {AFFILIATE_ENABLED && (
            <>
              <h3>Suivi des achats — seulement avec votre accord</h3>
              <p>Ils permettent de savoir qu'un achat chez une marque vient d'un lien de Wanted Fashion, pour attribuer la vente au bon créateur.</p>
            </>
          )}
          <p>Nous n'utilisons aucun cookie publicitaire et ne vendons aucune donnée.</p>
        </>
      ),
    },
    {
      id: "liste",
      title: "La liste complète",
      short: "Chaque cookie, son but et sa durée.",
      body: (
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Type</th>
                <th>À quoi il sert</th>
                <th>Durée</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>wf_consent</code></td>
                <td>Indispensable</td>
                <td>Mémorise votre choix sur le bandeau cookies.</td>
                <td>1 an</td>
              </tr>
              <tr>
                <td><code>wf_consent_id</code></td>
                <td>Indispensable</td>
                <td>Identifiant au hasard qui relie votre choix à sa preuve (sans nom ni adresse IP).</td>
                <td>1 an</td>
              </tr>
              <tr>
                <td>Session Supabase (stockage local)</td>
                <td>Indispensable</td>
                <td>Vous garde connecté si vous avez un compte.</td>
                <td>Jusqu'à la déconnexion</td>
              </tr>
              <tr>
                <td><code>wf-lang</code> (stockage local)</td>
                <td>Indispensable</td>
                <td>La langue choisie (français ou anglais).</td>
                <td>Jusqu'à effacement</td>
              </tr>
              <tr>
                <td>Brouillons et affichage (stockage local)</td>
                <td>Indispensable</td>
                <td>Ne pas perdre un look en cours d'écriture, garder vos préférences d'affichage.</td>
                <td>Jusqu'à effacement</td>
              </tr>
              <tr>
                <td><code>wf_device</code> (stockage local)</td>
                <td>Statistiques</td>
                <td>Compter les vues des looks sans compter deux fois la même personne.</td>
                <td>13 mois maximum, non prolongé</td>
              </tr>
              <tr>
                <td><code>ph_…</code> (PostHog, UE)</td>
                <td>Statistiques</td>
                <td>Reconnaître une visite de retour dans nos statistiques de fréquentation.</td>
                <td>12 mois</td>
              </tr>
              {AFFILIATE_ENABLED && (
                <tr>
                  <td><code>wf_aff</code></td>
                  <td>Suivi des achats</td>
                  <td>Posé quand vous cliquez sur un produit, pour attribuer une vente au bon créateur.</td>
                  <td>30 jours</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ),
    },
    {
      id: "sans-accord",
      title: "Si vous refusez",
      short: "Le site marche entièrement, sans rien de plus dans ton navigateur.",
      body: (
        <p>
          Refuser est aussi simple qu'accepter, et le site reste utilisable normalement. Sans votre accord, PostHog ne
          garde rien dans votre navigateur, et les vues des looks sont comptées grâce à une empreinte chiffrée de votre
          adresse IP, effacée après 48 heures (voir la <Link to="/confidentialite">Politique de confidentialité</Link>).
        </p>
      ),
    },
    {
      id: "options",
      title: "Changer d'avis à tout moment",
      short: "Un clic sur « Gérer les cookies », en bas de chaque page ou dans le menu.",
      body: (
        <>
          <p>
            Vous pouvez modifier ou retirer votre accord à tout moment avec le lien « Gérer les cookies » en bas de chaque
            page ou dans le menu. Si vous retirez votre accord, les éléments correspondants sont effacés de votre
            navigateur.
          </p>
          <p>
            <button type="button" onClick={openCookieSettings} className="rounded-full bg-ink px-4 py-2 text-sm font-bold text-surface !no-underline">
              Gérer les cookies maintenant
            </button>
          </p>
          <p>Vous pouvez aussi effacer ou bloquer les cookies dans les réglages de votre navigateur ; certaines fonctions (comme rester connecté) ne marcheront alors plus.</p>
          <p>
            Quand un nouveau type de cookie apparaît, le bandeau vous est présenté à nouveau : un ancien choix ne vaut pas
            pour un nouveau type de cookie.
          </p>
        </>
      ),
    },
    {
      id: "preuve",
      title: "Preuve de votre choix",
      short: "Ton choix est gardé comme preuve, sans ton nom ni ton adresse IP.",
      body: (
        <p>
          La loi nous demande de pouvoir prouver votre accord (RGPD, article 7). Votre choix (accepté ou refusé, par type),
          sa date et un identifiant au hasard sont ajoutés à un journal qui ne peut pas être modifié — sans votre nom ni
          votre adresse IP.
        </p>
      ),
    },
    {
      id: "contact",
      title: "Une question ?",
      body: (
        <p>
          Écrivez à <ContactMail />. Pour tout le reste sur vos données, voir la{" "}
          <Link to="/confidentialite">Politique de confidentialité</Link>.
        </p>
      ),
    },
  ];

  return (
    <LegalPage
      path="/cookies"
      title="Politique cookies"
      updated={LEGAL_UPDATED}
      essentials={[
        "Aucun cookie publicitaire, aucune donnée vendue.",
        "Sans ton accord, seuls les cookies indispensables sont utilisés.",
        "Refuser n'empêche pas d'utiliser le site.",
        "Tu changes d'avis quand tu veux avec « Gérer les cookies ».",
      ]}
      sections={sections}
    />
  );
}
