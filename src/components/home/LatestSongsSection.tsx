import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/seo/SEOHead";
import HeroSection from "@/components/home/HeroSection";
import LatestSongsSection from "@/components/home/LatestSongsSection";
import TrendingSection from "@/components/home/TrendingSection";
import ArtistsSection from "@/components/home/ArtistsSection";
import CategoriesSection from "@/components/home/CategoriesSection";
const Index = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "OlasPlay",
    url: "https://olasplay.com",
    description: "Free MP3 music downloads from top artists worldwide. Download the latest songs, albums, and mixtapes.",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://olasplay.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };
  return (
    <>
      <SEOHead
        title="Free MP3 Music Downloads"
        description="Download free MP3 music from top artists worldwide. Get the latest Afrobeats, Amapiano, Hip Hop, R&B, and more. High-quality music downloads at OlasPlay."
        keywords="free mp3 download, music download, afrobeats, amapiano, hip hop, r&b, nigerian music, south african music"
        canonicalUrl="/"
        structuredData={structuredData}
      />
      <Layout>
        <HeroSection />
        <LatestSongsSection />
        <TrendingSection />
        <ArtistsSection />
        <CategoriesSection />
      </Layout>
    </>
  );
};
export default Index;
