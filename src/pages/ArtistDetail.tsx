import { useParams, Link } from "react-router-dom";
import { Users, Music, ChevronRight } from "lucide-react";
import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/seo/SEOHead";
import SongCard from "@/components/cards/SongCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const ArtistDetail = () => {
  const { slug } = useParams();

  const { data: artist, isLoading: artistLoading } = useQuery({
    queryKey: ['artist', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('artists')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) return null;
      
      return {
        id: data.id,
        name: data.name,
        slug: data.slug,
        imageUrl: data.image_url || '/placeholder.svg',
        genre: data.genre || 'Music',
        followers: data.followers || 0,
        songCount: data.song_count || 0,
        bio: data.bio,
      };
    },
    enabled: !!slug,
  });

  const { data: artistSongs = [], isLoading: songsLoading } = useQuery({
    queryKey: ['artist-songs', artist?.id],
    queryFn: async () => {
      if (!artist) return [];
      
      const { data, error } = await supabase
        .from('songs')
        .select('id, title, slug, cover_url, duration, plays, downloads, genre')
        .eq('artist_id', artist.id)
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
        artist: artist.name,
        artistId: artist.id,
        releaseDate: '',
        downloadUrl: '',
      }));
    },
    enabled: !!artist,
  });

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
  };

  if (artistLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            <Skeleton className="w-48 h-48 md:w-56 md:h-56 rounded-full" />
            <div className="flex-1 space-y-4 text-center md:text-left">
              <Skeleton className="h-6 w-32 mx-auto md:mx-0" />
              <Skeleton className="h-12 w-64 mx-auto md:mx-0" />
              <div className="flex gap-6 justify-center md:justify-start">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-6 w-24" />
              </div>
              <Skeleton className="h-20 w-full max-w-2xl" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!artist) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Artist Not Found</h1>
          <p className="text-muted-foreground mb-8">The artist you're looking for doesn't exist.</p>
          <Link to="/artists">
            <Button variant="gradient">Browse Artists</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "MusicGroup",
    name: artist.name,
    genre: artist.genre,
    description: artist.bio,
    image: artist.imageUrl,
    url: `https://olasplay.com/artist/${artist.slug}`
  };

  return (
    <>
      <SEOHead
        title={`${artist.name} - Songs & Downloads`}
        description={artist.bio || `Download ${artist.name}'s latest songs and albums. Free ${artist.genre} music downloads.`}
        keywords={`${artist.name}, ${artist.genre}, music download, songs, artist`}
        canonicalUrl={`/artist/${artist.slug}`}
        ogImage={artist.imageUrl}
        ogType="profile"
        structuredData={structuredData}
      />
      <Layout>
        {/* Breadcrumb */}
        <div className="container mx-auto px-4 py-6">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <Link to="/artists" className="hover:text-foreground transition-colors">Artists</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground">{artist.name}</span>
          </nav>
        </div>

        {/* Hero */}
        <section className="relative pb-16">
          <div className="absolute inset-0 bg-gradient-to-b from-secondary/10 via-background to-background h-[400px]" />
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8 text-center md:text-left">
              {/* Artist Image */}
              <div className="w-48 h-48 md:w-56 md:h-56 rounded-full overflow-hidden ring-4 ring-primary/20 shadow-2xl shadow-primary/20">
                <img
                  src={artist.imageUrl}
                  alt={artist.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Artist Info */}
              <div className="flex-1">
                <span className="inline-block px-3 py-1 rounded-full bg-secondary/10 text-secondary text-sm font-medium mb-4">
                  {artist.genre} Artist
                </span>
                
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
                  {artist.name}
                </h1>

                {/* Stats */}
                <div className="flex flex-wrap justify-center md:justify-start items-center gap-6 text-muted-foreground mb-6">
                  <span className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    <span className="font-semibold text-foreground">{formatNumber(artist.followers)}</span>
                    Followers
                  </span>
                  <span className="flex items-center gap-2">
                    <Music className="w-5 h-5 text-primary" />
                    <span className="font-semibold text-foreground">{artistSongs.length}</span>
                    Songs
                  </span>
                </div>

                {/* Bio */}
                {artist.bio && (
                  <p className="text-muted-foreground max-w-2xl leading-relaxed">{artist.bio}</p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Songs */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-foreground mb-8">Songs by {artist.name}</h2>
            
            {songsLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="space-y-3">
                    <Skeleton className="aspect-square rounded-lg" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : artistSongs.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                {artistSongs.map((song, index) => (
                  <div
                    key={song.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <SongCard song={song} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No songs available yet.</p>
            )}
          </div>
        </section>
      </Layout>
    </>
  );
};

export default ArtistDetail;
