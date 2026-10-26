import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { absoluteUrl, outfitPath, profilePath } from "@/lib/site";

// Plan du site pour Google : toutes les tenues et tous les profils publics.
async function buildSitemap() {
  const [{ data: posts }, { data: creators }] = await Promise.all([
    supabase.from("posts").select("id, created_at").order("created_at", { ascending: false }).limit(5000),
    supabase.from("creators_public").select("username, created_at").limit(5000),
  ]);
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const url = (loc: string, lastmod?: string | null) =>
    `<url><loc>${esc(loc)}</loc>${lastmod ? `<lastmod>${lastmod.slice(0, 10)}</lastmod>` : ""}</url>`;
  const body = [
    url(absoluteUrl("/")),
    url(absoluteUrl("/createurs")),
    url(absoluteUrl("/explorer")),
    ...(creators ?? []).filter((c) => c.username).map((c) => url(absoluteUrl(profilePath(c.username!)), c.created_at)),
    ...(posts ?? []).map((p) => url(absoluteUrl(outfitPath(p.id)), p.created_at)),
  ].join("");
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`, {
    headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600" },
  });
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => buildSitemap(),
    },
  },
});
