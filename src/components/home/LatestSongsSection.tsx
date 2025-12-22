import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import SongCard from "@/components/cards/SongCard";
import { mockSongs } from "@/data/mockData";

const LatestSongsSection = () => {
  const latestSongs = mockSongs.slice(0, 8);

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
          {latestSongs.map((song, index) => (
            <div
              key={song.id}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <SongCard song={song} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LatestSongsSection;
