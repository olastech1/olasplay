import { Link } from "react-router-dom";
import { Search, Download, Music, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background to-background" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/20 rounded-full blur-[128px] animate-pulse-slow" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary mb-8 animate-fade-in">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">Trending Now • 10,000+ Daily Downloads</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight animate-fade-in" style={{ animationDelay: "0.1s" }}>
            Download Your Favorite
            <span className="block gradient-text">Music for Free</span>
          </h1>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            Access millions of tracks from top artists worldwide. High-quality MP3 downloads, 
            instant streaming, and the latest hits – all in one place.
          </p>

          {/* Search Bar */}
          <div className="max-w-xl mx-auto mb-10 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <Link to="/search" className="flex items-center gap-3 p-4 rounded-2xl bg-card/80 backdrop-blur-lg border border-border/50 hover:border-primary/50 transition-colors group">
              <Search className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-muted-foreground">Search for songs, artists, or albums...</span>
            </Link>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <Link to="/songs">
              <Button variant="gradient" size="xl" className="gap-2">
                <Music className="w-5 h-5" />
                Browse All Songs
              </Button>
            </Link>
            <Link to="/categories">
              <Button variant="glass" size="xl" className="gap-2">
                <Download className="w-5 h-5" />
                Explore Categories
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto mt-16 animate-fade-in" style={{ animationDelay: "0.5s" }}>
            {[
              { value: "50K+", label: "Songs" },
              { value: "5K+", label: "Artists" },
              { value: "1M+", label: "Downloads" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl md:text-3xl font-bold gradient-text">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default HeroSection;
