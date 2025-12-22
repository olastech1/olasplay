import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/seo/SEOHead";
import ArtistCard from "@/components/cards/ArtistCard";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const Artists = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: artists = [], isLoading } = useQuery({
    queryKey: ['all-artists'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('artists')
        .select('id, name, slug, image_url, genre, followers, song_count')
        .order('followers', { ascending: false });
      
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

  const filteredArtists = useMemo(() => {
    return artists.filter(
      (artist) =>
        artist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        artist.genre.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [artists, searchQuery]);

  return (
    <>
      <SEOHead
        title="Top Artists - Discover Music Creators"
        description="Explore top music artists and download their latest songs. Find your favorite Afrobeats, Amapiano, Hip Hop, and R&B artists."
        keywords="music artists, top artists, afrobeats artists, nigerian artists, music producers"
        canonicalUrl="/artists"
      />
      <Layout>
        <div className="container mx-auto px-4 py-12">
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Top Artists</h1>
            <p className="text-muted-foreground">
              Discover talented artists and download their music
            </p>
          </div>

          {/* Search */}
          <div className="relative max-w-md mb-10">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search artists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-12 pr-4 rounded-xl bg-card border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Artists Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {isLoading ? (
              Array.from({ length: 10 }).map((_, index) => (
                <div key={index} className="flex flex-col items-center space-y-3">
                  <Skeleton className="w-32 h-32 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              ))
            ) : (
              filteredArtists.map((artist, index) => (
                <div
                  key={artist.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <ArtistCard artist={artist} />
                </div>
              ))
            )}
          </div>

          {!isLoading && filteredArtists.length === 0 && (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">No artists found.</p>
            </div>
          )}
        </div>
      </Layout>
    </>
  );
};

export default Artists;
