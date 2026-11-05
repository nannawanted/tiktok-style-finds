import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/conditions")({
  head: () => ({ meta: [{ title: "Conditions d'utilisation — Wanted Fashion" }] }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10 text-sm leading-relaxed text-foreground">
      <h1 className="mb-2 text-2xl font-black">Conditions d'utilisation</h1>
      <p className="mb-8 text-xs text-muted-foreground">
        Dernière mise à jour : 5 novembre 2026. Ce document n'a pas été rédigé ou relu par un
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
        Wanted Fashion est réservé aux personnes de <strong>18 ans et plus</strong>. À l'inscription, vous indiquez votre
        date de naissance et une adresse e-mail valide. Donner une fausse date de naissance est interdit : si un
        compte appartient à une personne de moins de 18 ans, il est suspendu. Tout le monde peut nous signaler un
        compte qui semble appartenir à une personne mineure. Avant tout versement d'argent à un créateur, son
        identité et son âge seront vérifiés.
      </p>

      <h2 className="mb-2 mt-6 font-bold">Sécurité de votre compte</h2>
      <p className="mb-4">
        Gardez votre mot de passe secret et ne le réutilisez pas ailleurs. Vous pouvez activer la double vérification
        dans Paramètres → Sécurité. Si vous pensez que quelqu'un utilise votre compte sans votre accord, changez votre
        mot de passe et prévenez-nous à{" "}
        <a href="mailto:nannawanted@gmail.com" className="text-brand underline">nannawanted@gmail.com</a>.
      </p>

      <h2 className="mb-2 mt-6 font-bold">Contenu publié par les créateurs</h2>
      <p className="mb-4">
        Vous restez propriétaire du contenu que vous publiez (photos, vidéos, descriptions). En le publiant, vous
        accordez à Wanted Fashion une autorisation gratuite, non exclusive et valable dans le monde entier pour
        l'héberger, le reproduire (par exemple en créer des miniatures), l'afficher publiquement sur le site et dans
        les aperçus de partage, et l'analyser avec des outils automatiques (vérification des contenus, suggestions de
        looks qui se ressemblent). Cette autorisation sert uniquement à faire fonctionner le site ; elle prend fin
        quand vous supprimez le contenu ou votre compte. Vous vous engagez à ne publier que des liens produits réels
        et à ne pas tenter de fausser le système de suivi ou de commission.
      </p>

      <h2 id="droits-auteur" className="mb-2 mt-6 scroll-mt-24 font-bold">Droits d'auteur</h2>
      <ul className="mb-4 list-disc space-y-1 pl-5">
        <li>
          En publiant un look, vous garantissez que vous êtes l'auteur des photos et textes publiés, ou que vous avez
          l'autorisation de leur auteur. Vous restez responsable de ce que vous publiez.
        </li>
        <li>
          Les images des produits s'affichent depuis le site de la marque concernée, avec un lien vers sa page produit.
          Une marque peut demander leur retrait à tout moment.
        </li>
        <li>
          Toute personne (avec ou sans compte) peut signaler un contenu qui viole ses droits d'auteur via le{" "}
          <Link to="/droits-auteur" className="text-brand underline">formulaire de signalement</Link>. La demande doit
          indiquer le lien exact du look, l'œuvre concernée, les raisons, le nom et l'e-mail de la personne, et une
          déclaration de bonne foi. Une fausse déclaration peut engager la responsabilité de son auteur.
        </li>
        <li>
          Chaque demande est examinée par une personne. Nous confirmons la réception par e-mail, puis informons la
          personne qui signale de notre décision. Si un look est retiré, son créateur reçoit un message qui explique
          pourquoi.
        </li>
        <li>
          Chaque look retiré pour droits d'auteur donne un avertissement au créateur, valable 90 jours. Avec 3
          avertissements actifs, le compte est suspendu.
        </li>
        <li>
          En cas de désaccord avec une décision, écrivez à{" "}
          <a href="mailto:nannawanted@gmail.com" className="text-brand underline">nannawanted@gmail.com</a> en expliquant
          pourquoi : nous réexaminerons le dossier. Vous pouvez aussi vous adresser à un organisme de règlement
          extrajudiciaire des litiges certifié ou aux tribunaux.
        </li>
      </ul>

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

      <h2 id="moderation" className="mb-2 mt-6 scroll-mt-24 font-bold">Modération des contenus</h2>
      <p className="mb-2">Pour faire respecter ces règles, Wanted Fashion utilise :</p>
      <ul className="mb-4 list-disc space-y-1 pl-5">
        <li>
          <strong>Des vérifications automatiques à l'envoi</strong> : chaque photo envoyée (look, photo de profil,
          bannière) est analysée par un outil automatique (Sightengine) qui refuse la nudité et les contenus sexuels ;
          la photo d'un look est aussi analysée par un outil d'intelligence artificielle qui vérifie qu'elle montre une
          tenue ou un vêtement ; chaque lien produit est vérifié automatiquement (format du lien, site bloqué, page
          qui parle bien d'un vêtement ou d'un accessoire). Un contenu refusé n'est pas publié et un message en indique
          la raison.
        </li>
        <li>
          <strong>Des vérifications humaines</strong> : si la vérification automatique d'une photo (look, photo de profil
          ou bannière) n'a pas pu se faire, la photo est publiée puis vérifiée par une personne de l'équipe. Toute décision de supprimer un look publié ou de
          suspendre un compte est prise par une personne, jamais par un outil automatique.
        </li>
        <li>
          <strong>Les signalements</strong> : un utilisateur connecté peut signaler un look (lien cassé, arnaque,
          contenu choquant, photo volée). Toute personne, même sans compte, peut signaler une violation de droits
          d'auteur (voir « Droits d'auteur »). Chaque signalement est examiné par une personne, de façon objective et
          proportionnée.
        </li>
        <li>
          <strong>Les mesures possibles</strong> : refus d'un contenu à l'envoi, suppression d'un look, d'une photo de profil ou d'une bannière, blocage d'un
          site dans les liens produits, suspension d'un compte en cas de manquement grave ou répété. La personne
          concernée reçoit un message qui explique la mesure, sa raison, sa base et comment la contester.
        </li>
        <li>
          <strong>Contester une décision</strong> : écrivez à{" "}
          <a href="mailto:nannawanted@gmail.com" className="text-brand underline">nannawanted@gmail.com</a> en expliquant
          pourquoi la décision vous semble injuste. Une personne de l'équipe réexamine le dossier et vous répond. Vous
          pouvez aussi vous adresser à un organisme de règlement extrajudiciaire des litiges certifié, ou aux tribunaux.
        </li>
      </ul>

      <h2 className="mb-2 mt-6 font-bold">Suppression de compte</h2>
      <p className="mb-4">
        Vous pouvez supprimer votre compte à tout moment depuis les paramètres du dashboard. Cette action est
        définitive et supprime vos posts, produits et statistiques associées. Pensez à télécharger vos données
        avant (Paramètres → Compte → « Télécharger mes données »).
      </p>

      <h2 className="mb-2 mt-6 font-bold">Liens vers les marques</h2>
      <p className="mb-4">
        Wanted Fashion ne vend rien. Un achat fait après avoir cliqué sur un lien se passe directement entre vous et
        la marque ou la boutique : c'est elle qui est responsable du produit, de son prix, de la livraison, des
        retours et de votre droit de rétractation. Nous vérifions les liens au moment de leur publication, mais nous
        ne contrôlons pas les sites des marques et ne garantissons pas que le produit, son prix ou sa disponibilité
        n'ont pas changé.
      </p>

      <h2 className="mb-2 mt-6 font-bold">Responsabilité</h2>
      <ul className="mb-4 list-disc space-y-1 pl-5">
        <li>Nous faisons de notre mieux pour que le site fonctionne bien et en sécurité, mais il peut connaître des pannes ou des erreurs.</li>
        <li>Chaque créateur est responsable de ce qu'il publie. Nous ne vérifions pas chaque contenu avant sa publication, mais nous agissons rapidement quand un contenu illégal nous est signalé (voir « Modération des contenus »).</li>
        <li>Rien dans ces conditions ne limite notre responsabilité en cas de faute intentionnelle ou grave, ni les droits que vous donne la loi en tant que consommateur.</li>
      </ul>

      <h2 className="mb-2 mt-6 font-bold">Marques partenaires</h2>
      <p className="mb-4">
        Une marque qui rejoint le programme d'affiliation accepte de déclarer de bonne foi les ventes générées via
        ses liens, selon les modalités techniques convenues (pixel ou intégration serveur-à-serveur).
      </p>

      <h2 id="contact" className="mb-2 mt-6 scroll-mt-24 font-bold">Point de contact</h2>
      <p className="mb-4">
        Pour toute question sur ces conditions, la modération ou vos droits, et pour les autorités des États membres,
        la Commission européenne et le Comité européen des services numériques : écrivez à{" "}
        <a href="mailto:nannawanted@gmail.com" className="text-brand underline">nannawanted@gmail.com</a>. Une personne
        vous répond, en français ou en anglais.
      </p>

      <h2 className="mb-2 mt-6 font-bold">Modification de ces conditions</h2>
      <p className="mb-4">
        Nous pouvons modifier ces conditions, par exemple quand le site évolue ou quand la loi change. En cas de
        changement important, les utilisateurs inscrits sont prévenus par une notification sur le site avant
        qu'il s'applique, sauf si la loi impose un changement immédiat. Si vous n'êtes pas d'accord, vous pouvez
        supprimer votre compte à tout moment ; si vous continuez à utiliser le site, les nouvelles conditions
        s'appliquent.
      </p>

      <h2 className="mb-2 mt-6 font-bold">Droit applicable et litiges</h2>
      <p className="mb-4">
        Ces conditions sont soumises au droit belge. Si vous êtes un consommateur vivant dans un autre pays de l'Union
        européenne, vous gardez la protection des règles obligatoires de votre pays et pouvez saisir les tribunaux de
        votre pays. En cas de problème, écrivez-nous d'abord : la plupart des difficultés se règlent à l'amiable.
      </p>
    </main>
  );
}
