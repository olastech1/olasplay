import { Link } from "react-router-dom";
import { Users, Music } from "lucide-react";
import { Artist } from "@/types/music";

interface ArtistCardProps {
  artist: Artist;
}

const ArtistCard = ({ artist }: ArtistCardProps) => {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
  };

  return (
    <Link to={`/artist/${artist.slug}`} className="music-card block text-center">
      <div className="relative w-28 h-28 mx-auto mb-4 rounded-full overflow-hidden ring-4 ring-border/50 group-hover:ring-primary/50 transition-all">
        <img
          src={artist.imageUrl}
          alt={artist.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
      </div>
      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
        {artist.name}
      </h3>
      <p className="text-sm text-muted-foreground mt-1">{artist.genre}</p>
      <div className="flex items-center justify-center gap-4 mt-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          {formatNumber(artist.followers)}
        </span>
        <span className="flex items-center gap-1">
          <Music className="w-3 h-3" />
          {artist.songCount} songs
        </span>
      </div>
    </Link>
  );
};

export default ArtistCard;
