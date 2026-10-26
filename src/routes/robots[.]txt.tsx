import { createFileRoute } from "@tanstack/react-router";
import { absoluteUrl } from "@/lib/site";

async function buildRobots() {
  const txt = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /dashboard",
    "Disallow: /enregistres",
    "Disallow: /go/",
    "Disallow: /api/",
    `Sitemap: ${absoluteUrl("/sitemap.xml")}`,
    "",
  ].join("\n");
  return new Response(txt, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=86400" } });
}

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: async () => buildRobots(),
    },
  },
});
