import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import ArtistCard from "@/components/cards/ArtistCard";
import { mockArtists } from "@/data/mockData";

const ArtistsSection = () => {
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Top Artists</h2>
            <p className="text-muted-foreground mt-1">Discover talented artists</p>
          </div>
          <Link to="/artists">
            <Button variant="ghost" className="gap-2 text-primary hover:text-primary/80">
              View All
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Artists Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {mockArtists.map((artist, index) => (
            <div
              key={artist.id}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <ArtistCard artist={artist} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ArtistsSection;
