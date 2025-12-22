import { useState } from "react";
import { Search, Filter } from "lucide-react";
import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/seo/SEOHead";
import SongCard from "@/components/cards/SongCard";
import { Button } from "@/components/ui/button";
import { mockSongs, categories } from "@/data/mockData";

const Songs = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);

  const filteredSongs = mockSongs.filter((song) => {
    const matchesSearch =
      song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = !selectedGenre || song.genre === selectedGenre;
    return matchesSearch && matchesGenre;
  });

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
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedGenre === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedGenre(null)}
              >
                All
              </Button>
              {categories.slice(0, 5).map((category) => (
                <Button
                  key={category.id}
                  variant={selectedGenre === category.name ? "default" : "outline"}
                  size="sm"
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
              Showing {filteredSongs.length} songs
            </p>
          </div>

          {/* Songs Grid */}
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

          {filteredSongs.length === 0 && (
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
