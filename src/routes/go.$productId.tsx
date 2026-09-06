import { createFileRoute, redirect, notFound } from "@tanstack/react-router";
import { resolveAffiliateRedirect } from "@/lib/affiliate-redirect";

// Route de redirection tracée pour l'affiliation maison.
// wantedfashion.com/go/{productId} :
//  1. retrouve le produit (via une server function, clé secrète isolée)
//  2. enregistre le clic + pose un cookie de tracking
//  3. redirige (302) vers le site de la marque
export const Route = createFileRoute("/go/$productId")({
  beforeLoad: async ({ params }) => {
    const result = await resolveAffiliateRedirect({ data: { productId: params.productId } });
    if (!result.found) throw notFound();
    throw redirect({ href: result.targetUrl, statusCode: 302 });
  },
  component: () => null,
});
