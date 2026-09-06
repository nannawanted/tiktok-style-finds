import { createFileRoute } from "@tanstack/react-router";
import { createServerOnlyFn } from "@tanstack/react-start";
import { recordConversion } from "@/lib/record-conversion";

// Endpoint public appelé par le script "pixel" installé par la marque sur sa
// page de confirmation de commande. Doit être appelé en fetch() avec
// credentials: "include" pour que le cookie de tracking wf_aff soit transmis.
//
// Tout ce qui touche à la requête HTTP brute (getRequest, parsing du body,
// construction de la Response) est isolé dans une fonction server-only : le
// bundler la retire du bundle client, elle ne s'exécute jamais côté navigateur.
const handleConversionRequest = createServerOnlyFn(async () => {
  const { getRequest } = await import("@tanstack/react-start/server");
  const request = getRequest();
  const origin = request.headers.get("origin");

  const corsHeaders = {
    "Access-Control-Allow-Origin": origin ?? "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Credentials": "true",
    "Vary": "Origin",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { "content-type": "application/json", ...corsHeaders },
    });
  }

  let body: { brand_id?: string; secret?: string; amount?: number; order_reference?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers: { "content-type": "application/json", ...corsHeaders },
    });
  }

  if (!body.brand_id || !body.secret || !body.amount) {
    return new Response(JSON.stringify({ error: "missing_fields" }), {
      status: 400,
      headers: { "content-type": "application/json", ...corsHeaders },
    });
  }

  const result = await recordConversion({
    data: {
      brand_id: body.brand_id,
      secret: body.secret,
      amount: body.amount,
      order_reference: body.order_reference,
    },
  });

  return new Response(JSON.stringify(result), {
    status: result.ok ? 200 : 400,
    headers: { "content-type": "application/json", ...corsHeaders },
  });
});

export const Route = createFileRoute("/api/conversion")({
  beforeLoad: async () => {
    throw await handleConversionRequest();
  },
  component: () => null,
});
