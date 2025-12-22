import { Link } from "react-router-dom";
import { ArrowRight, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import SongCard from "@/components/cards/SongCard";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

const TrendingSection = () => {
  const { data: trendingSongs = [], isLoading } = useQuery({
    queryKey: ['trending-songs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('songs')
        .select('id, title, slug, cover_url, duration, plays, downloads, genre, artists:artist_id(name)')
        .eq('is_trending', true)
        .order('plays', { ascending: false })
        .limit(4);
      
      if (error) throw error;
      
      return data.map(song => ({
        id: song.id,
        title: song.title,
        slug: song.slug,
        coverUrl: song.cover_url || '/placeholder.svg',
        duration: song.duration || '0:00',
        plays: song.plays || 0,
        downloads: song.downloads || 0,
        genre: song.genre || 'Music',
        artist: song.artists?.name || 'Unknown Artist',
        artistId: '',
        releaseDate: '',
        downloadUrl: '',
      }));
    },
  });

  return (
    <section className="py-16 md:py-24 bg-card/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Flame className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">Trending Now</h2>
              <p className="text-muted-foreground mt-1">What everyone's listening to</p>
            </div>
          </div>
          <Link to="/songs?sort=trending">
            <Button variant="ghost" className="gap-2 text-primary hover:text-primary/80">
              View All
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Featured Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="aspect-square rounded-2xl" />
            ))
          ) : trendingSongs.length === 0 ? (
            <p className="col-span-full text-center text-muted-foreground py-8">No trending songs yet.</p>
          ) : (
            trendingSongs.map((song, index) => (
              <div
                key={song.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <SongCard song={song} variant="featured" />
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default TrendingSection;
