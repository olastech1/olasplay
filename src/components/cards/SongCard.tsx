import { Link } from "react-router-dom";
import { Play, Download, Clock } from "lucide-react";
import { Song } from "@/types/music";
import { Button } from "@/components/ui/button";

interface SongCardProps {
  song: Song;
  variant?: "default" | "compact" | "featured";
}

const SongCard = ({ song, variant = "default" }: SongCardProps) => {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
  };

  if (variant === "compact") {
    return (
      <Link
        to={`/song/${song.slug}`}
        className="flex items-center gap-3 p-3 rounded-lg bg-card/50 hover:bg-card transition-colors group"
      >
        <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
          <img
            src={song.coverUrl}
            alt={`${song.title} by ${song.artist}`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-primary/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Play className="w-4 h-4 text-primary-foreground fill-current" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-foreground truncate">{song.title}</h4>
          <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
        </div>
        <span className="text-xs text-muted-foreground">{song.duration}</span>
      </Link>
    );
  }

  if (variant === "featured") {
    return (
      <Link
        to={`/song/${song.slug}`}
        className="group relative overflow-hidden rounded-2xl aspect-square"
      >
        <img
          src={song.coverUrl}
          alt={`${song.title} by ${song.artist}`}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent opacity-80" />
        <div className="absolute inset-0 p-6 flex flex-col justify-end">
          <span className="text-primary text-sm font-medium mb-1">{song.genre}</span>
          <h3 className="text-xl font-bold text-foreground mb-1">{song.title}</h3>
          <p className="text-muted-foreground">{song.artist}</p>
          <div className="flex items-center gap-4 mt-4">
            <Button variant="gradient" size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              Download
            </Button>
            <span className="text-sm text-muted-foreground">
              {formatNumber(song.downloads)} downloads
            </span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/song/${song.slug}`} className="music-card block">
      <div className="relative aspect-square rounded-lg overflow-hidden mb-4">
        <img
          src={song.coverUrl}
          alt={`${song.title} by ${song.artist}`}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        <div className="play-button">
          <Play className="w-8 h-8 text-primary-foreground fill-current" />
        </div>
      </div>
      <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
        {song.title}
      </h3>
      <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
      <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {song.duration}
        </span>
        <span>{formatNumber(song.plays)} plays</span>
      </div>
    </Link>
  );
};

export default SongCard;
