import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/seo/SEOHead";
import SongCard from "@/components/cards/SongCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const Songs = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);

  const { data: songs = [], isLoading: songsLoading } = useQuery({
    queryKey: ['all-songs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('songs')
        .select('id, title, slug, cover_url, duration, plays, downloads, genre, artists:artist_id(name)')
        .order('created_at', { ascending: false });
      
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

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['all-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  const filteredSongs = useMemo(() => {
    return songs.filter((song) => {
      const matchesSearch =
        song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        song.artist.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGenre = !selectedGenre || song.genre === selectedGenre;
      return matchesSearch && matchesGenre;
    });
  }, [songs, searchQuery, selectedGenre]);

  const isLoading = songsLoading || categoriesLoading;

  return (
    <>
      <SEOHead
        title="All Songs - Browse & Download"
        description="Browse and download the latest songs from top artists. Free MP3 downloads across all genres including Afrobeats, Amapiano, Hip Hop, R&B, and more."
        keywords="music download, mp3 songs, free music, latest songs, afrobeats, amapiano"
        canonicalUrl="/songs"
      />
      <Layout>
        <div className="container mx-auto px-4 py-12">
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">All Songs</h1>
            <p className="text-muted-foreground">
              Discover and download the latest tracks from your favorite artists
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search songs or artists..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pl-12 pr-4 rounded-xl bg-card border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Genre Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap md:overflow-visible scrollbar-hide">
              <Button
                variant={selectedGenre === null ? "default" : "outline"}
                size="sm"
                className="flex-shrink-0"
                onClick={() => setSelectedGenre(null)}
              >
                All
              </Button>
              {categories.slice(0, 5).map((category) => (
                <Button
                  key={category.id}
                  variant={selectedGenre === category.name ? "default" : "outline"}
                  size="sm"
                  className="flex-shrink-0"
                  onClick={() => setSelectedGenre(category.name)}
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Results */}
          <div className="mb-6">
            <p className="text-muted-foreground text-sm">
              {isLoading ? 'Loading...' : `Showing ${filteredSongs.length} songs`}
            </p>
          </div>

          {/* Songs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {isLoading ? (
              Array.from({ length: 12 }).map((_, index) => (
                <div key={index} className="space-y-3">
                  <Skeleton className="aspect-square rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))
            ) : (
              filteredSongs.map((song, index) => (
                <div
                  key={song.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 0.03}s` }}
                >
                  <SongCard song={song} />
                </div>
              ))
            )}
          </div>

          {!isLoading && filteredSongs.length === 0 && (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">No songs found matching your criteria.</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedGenre(null);
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </Layout>
    </>
  );
};

export default Songs;
