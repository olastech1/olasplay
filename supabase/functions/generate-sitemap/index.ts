import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get base URL from settings or use default
    const { data: settingsData } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "site_url")
      .maybeSingle();

    const baseUrl = settingsData?.value || "https://olasplay.com";

    // Fetch all songs
    const { data: songs } = await supabase
      .from("songs")
      .select("slug, updated_at")
      .order("updated_at", { ascending: false });

    // Fetch all artists
    const { data: artists } = await supabase
      .from("artists")
      .select("slug, updated_at")
      .order("updated_at", { ascending: false });

    // Fetch all categories
    const { data: categories } = await supabase
      .from("categories")
      .select("slug, updated_at")
      .order("updated_at", { ascending: false });

    // Static pages
    const staticPages = [
      { loc: "/", priority: "1.0", changefreq: "daily" },
      { loc: "/songs", priority: "0.9", changefreq: "daily" },
      { loc: "/artists", priority: "0.9", changefreq: "weekly" },
      { loc: "/categories", priority: "0.8", changefreq: "weekly" },
      { loc: "/search", priority: "0.7", changefreq: "monthly" },
    ];

    // Build XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:music="http://www.google.com/schemas/sitemap-music/1.0">
`;

    // Add static pages
    for (const page of staticPages) {
      xml += `  <url>
    <loc>${baseUrl}${page.loc}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
    }

    // Add songs
    if (songs) {
      for (const song of songs) {
        const lastmod = song.updated_at ? new Date(song.updated_at).toISOString().split("T")[0] : "";
        xml += `  <url>
    <loc>${baseUrl}/song/${song.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
      }
    }

    // Add artists
    if (artists) {
      for (const artist of artists) {
        const lastmod = artist.updated_at ? new Date(artist.updated_at).toISOString().split("T")[0] : "";
        xml += `  <url>
    <loc>${baseUrl}/artist/${artist.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
      }
    }

    // Add categories
    if (categories) {
      for (const category of categories) {
        const lastmod = category.updated_at ? new Date(category.updated_at).toISOString().split("T")[0] : "";
        xml += `  <url>
    <loc>${baseUrl}/category/${category.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
`;
      }
    }

    xml += `</urlset>`;

    console.log(`Generated sitemap with ${staticPages.length + (songs?.length || 0) + (artists?.length || 0) + (categories?.length || 0)} URLs`);

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Sitemap generation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
