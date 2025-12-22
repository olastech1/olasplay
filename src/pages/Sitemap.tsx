import { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/seo/SEOHead";
import { Skeleton } from "@/components/ui/skeleton";

const Sitemap = () => {
  const [sitemapContent, setSitemapContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSitemap = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-sitemap`
        );
        
        if (!response.ok) {
          throw new Error("Failed to fetch sitemap");
        }
        
        const xml = await response.text();
        setSitemapContent(xml);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchSitemap();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="h-64 w-full" />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Error Loading Sitemap</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </Layout>
    );
  }

  // Parse XML to display as structured list
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(sitemapContent, "text/xml");
  const urls = Array.from(xmlDoc.querySelectorAll("url")).map((url) => ({
    loc: url.querySelector("loc")?.textContent || "",
    lastmod: url.querySelector("lastmod")?.textContent || "",
    changefreq: url.querySelector("changefreq")?.textContent || "",
    priority: url.querySelector("priority")?.textContent || "",
  }));

  return (
    <>
      <SEOHead
        title="Sitemap"
        description="Complete sitemap of all songs, artists, and pages on OlasPlay."
        canonicalUrl="/sitemap"
        noIndex={true}
      />
      <Layout>
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-3xl font-bold text-foreground mb-8">Sitemap</h1>
          
          <div className="space-y-8">
            {/* Static Pages */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">Pages</h2>
              <ul className="space-y-2">
                {urls.filter(u => !u.loc.includes("/song/") && !u.loc.includes("/artist/") && !u.loc.includes("/category/")).map((url) => (
                  <li key={url.loc}>
                    <a 
                      href={url.loc} 
                      className="text-primary hover:underline"
                    >
                      {url.loc}
                    </a>
                    {url.priority && (
                      <span className="text-sm text-muted-foreground ml-2">
                        (Priority: {url.priority})
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </section>

            {/* Songs */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Songs ({urls.filter(u => u.loc.includes("/song/")).length})
              </h2>
              <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {urls.filter(u => u.loc.includes("/song/")).map((url) => (
                  <li key={url.loc}>
                    <a 
                      href={url.loc} 
                      className="text-primary hover:underline text-sm truncate block"
                    >
                      {url.loc.split("/song/")[1]}
                    </a>
                  </li>
                ))}
              </ul>
            </section>

            {/* Artists */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Artists ({urls.filter(u => u.loc.includes("/artist/")).length})
              </h2>
              <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {urls.filter(u => u.loc.includes("/artist/")).map((url) => (
                  <li key={url.loc}>
                    <a 
                      href={url.loc} 
                      className="text-primary hover:underline text-sm"
                    >
                      {url.loc.split("/artist/")[1]}
                    </a>
                  </li>
                ))}
              </ul>
            </section>

            {/* Categories */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Categories ({urls.filter(u => u.loc.includes("/category/")).length})
              </h2>
              <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {urls.filter(u => u.loc.includes("/category/")).map((url) => (
                  <li key={url.loc}>
                    <a 
                      href={url.loc} 
                      className="text-primary hover:underline text-sm"
                    >
                      {url.loc.split("/category/")[1]}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default Sitemap;
