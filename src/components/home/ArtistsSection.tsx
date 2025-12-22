import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import ArtistCard from "@/components/cards/ArtistCard";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

const ArtistsSection = () => {
  const { data: artists = [], isLoading } = useQuery({
    queryKey: ['top-artists'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('artists')
        .select('id, name, slug, image_url, genre, followers, song_count')
        .order('followers', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      
      return data.map(artist => ({
        id: artist.id,
        name: artist.name,
        slug: artist.slug,
        imageUrl: artist.image_url || '/placeholder.svg',
        genre: artist.genre || 'Music',
        followers: artist.followers || 0,
        songCount: artist.song_count || 0,
      }));
    },
  });

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Top Artists</h2>
            <p className="text-muted-foreground mt-1">Discover talented artists</p>
          </div>
          <Link to="/artists">
            <Button variant="ghost" className="gap-2 text-primary hover:text-primary/80">
              View All
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Artists Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex flex-col items-center space-y-3">
                <Skeleton className="w-32 h-32 rounded-full" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))
          ) : artists.length === 0 ? (
            <p className="col-span-full text-center text-muted-foreground py-8">No artists available yet.</p>
          ) : (
            artists.map((artist, index) => (
              <div
                key={artist.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <ArtistCard artist={artist} />
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default ArtistsSection;
