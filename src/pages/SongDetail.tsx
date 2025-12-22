import { useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Download, Play, Pause, Clock, Calendar, Music, ChevronRight, Share2, Volume2 } from "lucide-react";
import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import SongCard from "@/components/cards/SongCard";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const SongDetail = () => {
  const { slug } = useParams();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const { data: song, isLoading } = useQuery({
    queryKey: ['song', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('songs')
        .select('*, artists:artist_id(id, name, slug)')
        .eq('slug', slug)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) return null;
      
      return {
        id: data.id,
        title: data.title,
        slug: data.slug,
        coverUrl: data.cover_url || '/placeholder.svg',
        duration: data.duration || '0:00',
        plays: data.plays || 0,
        downloads: data.downloads || 0,
        genre: data.genre || 'Music',
        artist: data.artists?.name || 'Unknown Artist',
        artistId: data.artists?.id || '',
        artistSlug: data.artists?.slug || '',
        releaseDate: data.release_date || new Date().toISOString(),
        downloadUrl: data.download_url || '',
        description: data.description,
        lyrics: data.lyrics,
      };
    },
    enabled: !!slug,
  });

  const { data: relatedSongs = [] } = useQuery({
    queryKey: ['related-songs', song?.genre, song?.id],
    queryFn: async () => {
      if (!song) return [];
      
      const { data, error } = await supabase
        .from('songs')
        .select('id, title, slug, cover_url, duration, plays, downloads, genre, artists:artist_id(name)')
        .eq('genre', song.genre)
        .neq('id', song.id)
        .limit(4);
      
      if (error) throw error;
      
      return data.map(s => ({
        id: s.id,
        title: s.title,
        slug: s.slug,
        coverUrl: s.cover_url || '/placeholder.svg',
        duration: s.duration || '0:00',
        plays: s.plays || 0,
        downloads: s.downloads || 0,
        genre: s.genre || 'Music',
        artist: s.artists?.name || 'Unknown Artist',
        artistId: '',
        releaseDate: '',
        downloadUrl: '',
      }));
    },
    enabled: !!song,
  });

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const togglePlay = () => {
    if (!audioRef.current || !song?.downloadUrl) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row gap-8">
            <Skeleton className="w-64 md:w-80 aspect-square rounded-2xl" />
            <div className="flex-1 space-y-4">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-6 w-48" />
              <div className="flex gap-4 mt-6">
                <Skeleton className="h-12 w-40" />
                <Skeleton className="h-12 w-32" />
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!song) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Song Not Found</h1>
          <p className="text-muted-foreground mb-8">The song you're looking for doesn't exist.</p>
          <Link to="/songs">
            <Button variant="gradient">Browse Songs</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "MusicRecording",
    name: song.title,
    byArtist: {
      "@type": "MusicGroup",
      name: song.artist
    },
    duration: `PT${song.duration.replace(":", "M")}S`,
    genre: song.genre,
    datePublished: song.releaseDate,
    url: `https://olasplay.com/song/${song.slug}`
  };

  const handleDownload = () => {
    if (song.downloadUrl) {
      window.open(song.downloadUrl, '_blank');
    }
  };

  return (
    <>
      <SEOHead
        title={`${song.title} by ${song.artist} - Download MP3`}
        description={`Download ${song.title} by ${song.artist} MP3 for free. ${song.description || `High-quality ${song.genre} music download.`}`}
        keywords={`${song.title}, ${song.artist}, ${song.genre}, mp3 download, free music`}
        canonicalUrl={`/song/${song.slug}`}
        ogImage={song.coverUrl}
        ogType="music.song"
        structuredData={structuredData}
      />
      <Layout>
        {/* Hidden Audio Element */}
        {song.downloadUrl && (
          <audio
            ref={audioRef}
            src={song.downloadUrl}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleEnded}
            preload="metadata"
          />
        )}

        {/* Breadcrumb */}
        <div className="container mx-auto px-4 py-6">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <Link to="/songs" className="hover:text-foreground transition-colors">Songs</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground">{song.title}</span>
          </nav>
        </div>

        {/* Hero Section */}
        <section className="relative pb-20">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background to-background h-[500px]" />
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start">
              {/* Cover Art */}
              <div className="w-48 sm:w-64 md:w-80 flex-shrink-0">
                <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl shadow-primary/20 glow-effect">
                  <img
                    src={song.coverUrl}
                    alt={`${song.title} by ${song.artist}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Song Info */}
              <div className="flex-1 text-center md:text-left">
                <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                  {song.genre}
                </span>
                
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-2">
                  {song.title}
                </h1>
                
                <Link
                  to={`/artist/${song.artistSlug || song.artistId}`}
                  className="text-xl text-muted-foreground hover:text-primary transition-colors"
                >
                  {song.artist}
                </Link>

                {/* Stats */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 md:gap-6 mt-6 text-muted-foreground text-sm md:text-base">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    {song.duration}
                  </span>
                  {song.releaseDate && (
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      {new Date(song.releaseDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric"
                      })}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Play className="w-4 h-4" />
                    {formatNumber(song.plays)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Download className="w-4 h-4" />
                    {formatNumber(song.downloads)}
                  </span>
                </div>

                {/* Audio Player */}
                {song.downloadUrl && (
                  <div className="mt-6 p-4 rounded-xl bg-card/50 border border-border max-w-lg mx-auto md:mx-0">
                    <div className="flex items-center gap-4">
                      <Button
                        variant="gradient"
                        size="icon"
                        className="h-12 w-12 rounded-full flex-shrink-0"
                        onClick={togglePlay}
                      >
                        {isPlaying ? (
                          <Pause className="w-5 h-5" />
                        ) : (
                          <Play className="w-5 h-5 ml-0.5" />
                        )}
                      </Button>
                      <div className="flex-1 space-y-2">
                        <Slider
                          value={[currentTime]}
                          max={duration || 100}
                          step={1}
                          onValueChange={handleSeek}
                          className="cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{formatTime(currentTime)}</span>
                          <span>{formatTime(duration)}</span>
                        </div>
                      </div>
                      <Volume2 className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-6">
                  <Button 
                    variant="gradient" 
                    size="lg" 
                    className="gap-2 flex-1 sm:flex-none"
                    onClick={handleDownload}
                    disabled={!song.downloadUrl}
                  >
                    <Download className="w-5 h-5" />
                    Download MP3
                  </Button>
                  <Button variant="ghost" size="icon" className="h-11 w-11">
                    <Share2 className="w-5 h-5" />
                  </Button>
                </div>

                {/* Description */}
                {song.description && (
                  <div className="mt-8">
                    <h2 className="text-lg font-semibold text-foreground mb-3">About This Song</h2>
                    <p className="text-muted-foreground leading-relaxed">{song.description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Song Analysis Section */}
        {song.lyrics && (
          <section className="py-12 bg-card/30">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                <Music className="w-6 h-6 text-primary" />
                Song Analysis
              </h2>
              <div className="glass-card p-6 md:p-8 max-w-3xl">
                <div className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {song.lyrics}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Related Songs */}
        {relatedSongs.length > 0 && (
          <section className="py-16">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl font-bold text-foreground mb-8">More {song.genre} Songs</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
                {relatedSongs.map((relatedSong) => (
                  <SongCard key={relatedSong.id} song={relatedSong} />
                ))}
              </div>
            </div>
          </section>
        )}
      </Layout>
    </>
  );
};

export default SongDetail;
