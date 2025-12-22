import { Link } from "react-router-dom";
import { ArrowRight, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import SongCard from "@/components/cards/SongCard";
import { mockSongs } from "@/data/mockData";

const TrendingSection = () => {
  // Sort by plays for trending
  const trendingSongs = [...mockSongs]
    .sort((a, b) => b.plays - a.plays)
    .slice(0, 4);

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
          {trendingSongs.map((song, index) => (
            <div
              key={song.id}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <SongCard song={song} variant="featured" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrendingSection;
