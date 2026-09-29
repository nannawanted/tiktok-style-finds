import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/conditions")({
  head: () => ({ meta: [{ title: "Conditions d'utilisation — Wanted Fashion" }] }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10 text-sm leading-relaxed text-foreground">
      <h1 className="mb-2 text-2xl font-black">Conditions d'utilisation</h1>
      <p className="mb-8 text-xs text-muted-foreground">
        Dernière mise à jour : {new Date().toLocaleDateString("fr-FR")}. Ce document n'a pas été rédigé ou relu par un
        juriste — il décrit de bonne foi le fonctionnement du site, mais ne constitue pas un avis juridique.
      </p>

      <h2 className="mb-2 mt-6 font-bold">Le service</h2>
      <p className="mb-4">
        Wanted Fashion permet à des créateurs de publier des tenues avec des liens d'achat vers des marques
        partenaires. Wanted Fashion touche une commission sur les ventes réalisées via ces liens, et en reverse une
        partie au créateur concerné.
      </p>

      <h2 className="mb-2 mt-6 font-bold">Créer un compte</h2>
      <p className="mb-4">
        Vous devez fournir une adresse email valide et être en mesure de représenter légalement les informations que
        vous publiez. Vous êtes responsable de la confidentialité de votre mot de passe.
      </p>

      <h2 className="mb-2 mt-6 font-bold">Contenu publié par les créateurs</h2>
      <p className="mb-4">
        Vous restez propriétaire du contenu que vous publiez (photos, vidéos, descriptions). En le publiant, vous
        autorisez Wanted Fashion à l'afficher publiquement sur le site. Vous vous engagez à ne publier que des liens
        produits réels et à ne pas tenter de fausser le système de suivi ou de commission.
      </p>

      <h2 className="mb-2 mt-6 font-bold">Commissions et paiements</h2>
      <ul className="mb-4 list-disc space-y-1 pl-5">
        <li>La part reversée au créateur est de 50 % de la commission perçue par Wanted Fashion sur chaque vente.</li>
        <li>Une vente n'est comptée comme définitive qu'après un délai de sécurité de 30 jours à compter de sa détection, le temps de vérifier qu'elle n'est pas annulée ou remboursée par la marque.</li>
        <li>Wanted Fashion peut retenir ou refuser une commission en cas de suspicion raisonnable de fraude (auto-achat, fausse déclaration de vente, activité anormale).</li>
      </ul>

      <h2 className="mb-2 mt-6 font-bold">Utilisation interdite</h2>
      <p className="mb-2">Il est interdit de :</p>
      <ul className="mb-4 list-disc space-y-1 pl-5">
        <li>Cliquer sur ses propres liens dans le but de générer une fausse commission.</li>
        <li>Déclarer ou tenter de déclarer de fausses ventes.</li>
        <li>Publier du contenu illégal, trompeur, ou portant atteinte aux droits d'un tiers.</li>
      </ul>
      <p className="mb-4">
        Tout compte impliqué dans une activité frauduleuse peut être suspendu et les commissions en attente
        annulées.
      </p>

      <h2 className="mb-2 mt-6 font-bold">Suppression de compte</h2>
      <p className="mb-4">
        Vous pouvez supprimer votre compte à tout moment depuis les paramètres du dashboard. Cette action est
        définitive et supprime vos posts, produits et statistiques associées.
      </p>

      <h2 className="mb-2 mt-6 font-bold">Marques partenaires</h2>
      <p className="mb-4">
        Une marque qui rejoint le programme d'affiliation accepte de déclarer de bonne foi les ventes générées via
        ses liens, selon les modalités techniques convenues (pixel ou intégration serveur-à-serveur).
      </p>

      <h2 className="mb-2 mt-6 font-bold">Contact</h2>
      <p className="mb-4">
        Pour toute question sur ces conditions, écrivez à{" "}
        <a href="mailto:nannawanted@gmail.com" className="text-brand underline">nannawanted@gmail.com</a>.
      </p>
    </main>
  );
}
