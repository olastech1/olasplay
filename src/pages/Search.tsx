import { useState, useMemo } from "react";
import { Search as SearchIcon, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/seo/SEOHead";
import SongCard from "@/components/cards/SongCard";
import ArtistCard from "@/components/cards/ArtistCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

const Search = () => {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "songs" | "artists">("all");

  // Fetch all songs
  const { data: songs = [], isLoading: songsLoading } = useQuery({
    queryKey: ["search-songs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("songs")
        .select("id, title, slug, cover_url, duration, plays, downloads, genre, download_url, release_date, artist_id, artists:artist_id(name)")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data.map((song) => ({
        id: song.id,
        title: song.title,
        slug: song.slug,
        coverUrl: song.cover_url || "/placeholder.svg",
        duration: song.duration || "0:00",
        plays: song.plays,
        downloads: song.downloads,
        genre: song.genre || "Music",
        artist: (song.artists as any)?.name || "Unknown Artist",
        artistId: song.artist_id || "",
        downloadUrl: song.download_url || "",
        releaseDate: song.release_date || "",
      }));
    },
  });

  // Fetch all artists
  const { data: artists = [], isLoading: artistsLoading } = useQuery({
    queryKey: ["search-artists"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artists")
        .select("*")
        .order("name", { ascending: true });
      
      if (error) throw error;
      return data.map((artist) => ({
        id: artist.id,
        name: artist.name,
        slug: artist.slug,
        imageUrl: artist.image_url || "/placeholder.svg",
        genre: artist.genre || "Music",
        followers: artist.followers,
        songCount: artist.song_count,
      }));
    },
  });

  const filteredSongs = useMemo(() => {
    if (!query) return [];
    const lowerQuery = query.toLowerCase();
    return songs.filter(
      (song) =>
        song.title.toLowerCase().includes(lowerQuery) ||
        song.artist.toLowerCase().includes(lowerQuery) ||
        song.genre.toLowerCase().includes(lowerQuery)
    );
  }, [songs, query]);

  const filteredArtists = useMemo(() => {
    if (!query) return [];
    const lowerQuery = query.toLowerCase();
    return artists.filter(
      (artist) =>
        artist.name.toLowerCase().includes(lowerQuery) ||
        artist.genre.toLowerCase().includes(lowerQuery)
    );
  }, [artists, query]);

  const hasResults = filteredSongs.length > 0 || filteredArtists.length > 0;
  const isLoading = songsLoading || artistsLoading;

  return (
    <>
      <SEOHead
        title="Search Music"
        description="Search and download your favorite songs, artists, and albums. Free MP3 downloads from OlasPlay."
        keywords="search music, find songs, music search, mp3 search"
        canonicalUrl="/search"
      />
      <Layout>
        <div className="container mx-auto px-4 py-12">
          {/* Search Header */}
          <div className="max-w-2xl mx-auto mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-8">
              Search Music
            </h1>
            
            {/* Search Input */}
            <div className="relative">
              <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search songs, artists, or genres..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
                className="w-full h-14 pl-14 pr-12 rounded-2xl bg-card border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-lg text-foreground placeholder:text-muted-foreground"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Loading State */}
          {isLoading && query && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-square rounded-xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          )}

          {/* Tabs */}
          {query && hasResults && !isLoading && (
            <div className="flex justify-center gap-2 mb-10">
              <Button
                variant={activeTab === "all" ? "default" : "outline"}
                onClick={() => setActiveTab("all")}
              >
                All Results
              </Button>
              <Button
                variant={activeTab === "songs" ? "default" : "outline"}
                onClick={() => setActiveTab("songs")}
              >
                Songs ({filteredSongs.length})
              </Button>
              <Button
                variant={activeTab === "artists" ? "default" : "outline"}
                onClick={() => setActiveTab("artists")}
              >
                Artists ({filteredArtists.length})
              </Button>
            </div>
          )}

          {/* Results */}
          {query && !isLoading && (
            <>
              {!hasResults ? (
                <div className="text-center py-20">
                  <p className="text-muted-foreground text-lg">
                    No results found for "{query}"
                  </p>
                  <p className="text-muted-foreground text-sm mt-2">
                    Try searching for something else
                  </p>
                </div>
              ) : (
                <div className="space-y-16">
                  {/* Songs */}
                  {(activeTab === "all" || activeTab === "songs") && filteredSongs.length > 0 && (
                    <section>
                      <h2 className="text-2xl font-bold text-foreground mb-6">Songs</h2>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                        {filteredSongs.map((song, index) => (
                          <div
                            key={song.id}
                            className="animate-fade-in"
                            style={{ animationDelay: `${index * 0.03}s` }}
                          >
                            <SongCard song={song} />
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Artists */}
                  {(activeTab === "all" || activeTab === "artists") && filteredArtists.length > 0 && (
                    <section>
                      <h2 className="text-2xl font-bold text-foreground mb-6">Artists</h2>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {filteredArtists.map((artist, index) => (
                          <div
                            key={artist.id}
                            className="animate-fade-in"
                            style={{ animationDelay: `${index * 0.05}s` }}
                          >
                            <ArtistCard artist={artist} />
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              )}
            </>
          )}

          {/* Empty State */}
          {!query && (
            <div className="text-center py-20">
              <SearchIcon className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">
                Start typing to search for music
              </p>
            </div>
          )}
        </div>
      </Layout>
    </>
  );
};

export default Search;
