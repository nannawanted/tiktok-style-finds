import { createFileRoute } from "@tanstack/react-router";
import { getRequest } from "@tanstack/react-start/server";
import { recordConversion } from "@/lib/record-conversion";

// Endpoint public appelé par le script "pixel" installé par la marque sur sa
// page de confirmation de commande. Doit être appelé en fetch() avec
// credentials: "include" pour que le cookie de tracking wf_aff soit transmis.
function corsHeaders(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": origin ?? "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Credentials": "true",
    "Vary": "Origin",
  };
}

export const Route = createFileRoute("/api/conversion")({
  beforeLoad: async () => {
    const request = getRequest();
    const origin = request.headers.get("origin");

    if (request.method === "OPTIONS") {
      throw new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (request.method !== "POST") {
      throw new Response(JSON.stringify({ error: "method_not_allowed" }), {
        status: 405,
        headers: { "content-type": "application/json", ...corsHeaders(origin) },
      });
    }

    let body: { brand_id?: string; secret?: string; amount?: number; order_reference?: string };
    try {
      body = await request.json();
    } catch {
      throw new Response(JSON.stringify({ error: "invalid_json" }), {
        status: 400,
        headers: { "content-type": "application/json", ...corsHeaders(origin) },
      });
    }

    if (!body.brand_id || !body.secret || !body.amount) {
      throw new Response(JSON.stringify({ error: "missing_fields" }), {
        status: 400,
        headers: { "content-type": "application/json", ...corsHeaders(origin) },
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

    throw new Response(JSON.stringify(result), {
      status: result.ok ? 200 : 400,
      headers: { "content-type": "application/json", ...corsHeaders(origin) },
    });
  },
  component: () => null,
});
