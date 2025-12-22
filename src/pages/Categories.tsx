import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/seo/SEOHead";
import CategoryCard from "@/components/cards/CategoryCard";
import { categories } from "@/data/mockData";

const Categories = () => {
  return (
    <>
      <SEOHead
        title="Music Categories - Browse by Genre"
        description="Browse music by category. Download Afrobeats, Amapiano, Hip Hop, R&B, Gospel, Reggae, Electronic, and Trap music for free."
        keywords="music genres, music categories, afrobeats, amapiano, hip hop, r&b, gospel, reggae"
        canonicalUrl="/categories"
      />
      <Layout>
        <div className="container mx-auto px-4 py-12">
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Music Categories</h1>
            <p className="text-muted-foreground">
              Browse songs by your favorite genre
            </p>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {categories.map((category, index) => (
              <div
                key={category.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <CategoryCard category={category} />
              </div>
            ))}
          </div>
        </div>
      </Layout>
    </>
  );
};

export default Categories;
