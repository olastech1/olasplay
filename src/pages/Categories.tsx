import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/seo/SEOHead";
import CategoryCard from "@/components/cards/CategoryCard";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const Categories = () => {
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['all-categories-page'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug, song_count, icon_url')
        .order('name');
      
      if (error) throw error;
      
      return data.map(category => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        songCount: category.song_count || 0,
        iconUrl: category.icon_url,
      }));
    },
  });

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
            {isLoading ? (
              Array.from({ length: 8 }).map((_, index) => (
                <Skeleton key={index} className="h-28 rounded-xl" />
              ))
            ) : categories.length === 0 ? (
              <p className="col-span-full text-center text-muted-foreground py-12">
                No categories available yet.
              </p>
            ) : (
              categories.map((category, index) => (
                <div
                  key={category.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <CategoryCard category={category} />
                </div>
              ))
            )}
          </div>
        </div>
      </Layout>
    </>
  );
};

export default Categories;
