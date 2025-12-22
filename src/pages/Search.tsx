import { useState } from "react";
import { Search as SearchIcon, X } from "lucide-react";
import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/seo/SEOHead";
import SongCard from "@/components/cards/SongCard";
import ArtistCard from "@/components/cards/ArtistCard";
import { Button } from "@/components/ui/button";
import { mockSongs, mockArtists } from "@/data/mockData";

const Search = () => {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "songs" | "artists">("all");

  const filteredSongs = mockSongs.filter(
    (song) =>
      song.title.toLowerCase().includes(query.toLowerCase()) ||
      song.artist.toLowerCase().includes(query.toLowerCase()) ||
      song.genre.toLowerCase().includes(query.toLowerCase())
  );

  const filteredArtists = mockArtists.filter(
    (artist) =>
      artist.name.toLowerCase().includes(query.toLowerCase()) ||
      artist.genre.toLowerCase().includes(query.toLowerCase())
  );

  const hasResults = filteredSongs.length > 0 || filteredArtists.length > 0;

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

          {/* Tabs */}
          {query && hasResults && (
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
          {query && (
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
