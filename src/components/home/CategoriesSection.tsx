import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import CategoryCard from "@/components/cards/CategoryCard";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

const CategoriesSection = () => {
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug, song_count, icon_url')
        .order('song_count', { ascending: false })
        .limit(8);
      
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
    <section className="py-16 md:py-24 bg-card/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Browse by Genre</h2>
            <p className="text-muted-foreground mt-1">Find your perfect vibe</p>
          </div>
          <Link to="/categories">
            <Button variant="ghost" className="gap-2 text-primary hover:text-primary/80">
              All Categories
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="h-24 rounded-xl" />
            ))
          ) : categories.length === 0 ? (
            <p className="col-span-full text-center text-muted-foreground py-8">No categories available yet.</p>
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
    </section>
  );
};

export default CategoriesSection;
