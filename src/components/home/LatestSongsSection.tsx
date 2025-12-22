import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import SongCard from "@/components/cards/SongCard";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

const LatestSongsSection = () => {
  const { data: latestSongs = [], isLoading } = useQuery({
    queryKey: ['latest-songs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('songs')
        .select('id, title, slug, cover_url, duration, plays, downloads, genre, artists:artist_id(name)')
        .order('created_at', { ascending: false })
        .limit(8);
      
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
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Latest Releases</h2>
            <p className="text-muted-foreground mt-1">Fresh tracks added daily</p>
          </div>
          <Link to="/songs">
            <Button variant="ghost" className="gap-2 text-primary hover:text-primary/80">
              View All
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Songs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="space-y-3">
                <Skeleton className="aspect-square rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))
          ) : latestSongs.length === 0 ? (
            <p className="col-span-full text-center text-muted-foreground py-8">No songs available yet.</p>
          ) : (
            latestSongs.map((song, index) => (
              <div
                key={song.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <SongCard song={song} />
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default LatestSongsSection;
