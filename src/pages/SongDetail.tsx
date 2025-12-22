import { useParams, Link } from "react-router-dom";
import { Download, Play, Clock, Calendar, Music, ChevronRight, Share2 } from "lucide-react";
import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import SongCard from "@/components/cards/SongCard";
import { mockSongs } from "@/data/mockData";

const SongDetail = () => {
  const { slug } = useParams();
  const song = mockSongs.find((s) => s.slug === slug) || mockSongs[0];
  
  const relatedSongs = mockSongs
    .filter((s) => s.genre === song.genre && s.id !== song.id)
    .slice(0, 4);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
  };

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

  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://olasplay.com" },
      { "@type": "ListItem", position: 2, name: "Songs", item: "https://olasplay.com/songs" },
      { "@type": "ListItem", position: 3, name: song.title, item: `https://olasplay.com/song/${song.slug}` }
    ]
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
            <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Cover Art */}
              <div className="w-full md:w-80 flex-shrink-0">
                <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl shadow-primary/20 glow-effect">
                  <img
                    src={song.coverUrl}
                    alt={`${song.title} by ${song.artist}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Song Info */}
              <div className="flex-1">
                <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                  {song.genre}
                </span>
                
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-2">
                  {song.title}
                </h1>
                
                <Link
                  to={`/artist/${song.artistId}`}
                  className="text-xl text-muted-foreground hover:text-primary transition-colors"
                >
                  {song.artist}
                </Link>

                {/* Stats */}
                <div className="flex flex-wrap items-center gap-6 mt-6 text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {song.duration}
                  </span>
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {new Date(song.releaseDate).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric"
                    })}
                  </span>
                  <span className="flex items-center gap-2">
                    <Play className="w-4 h-4" />
                    {formatNumber(song.plays)} plays
                  </span>
                  <span className="flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    {formatNumber(song.downloads)} downloads
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-4 mt-8">
                  <Button variant="gradient" size="lg" className="gap-2">
                    <Download className="w-5 h-5" />
                    Download MP3
                  </Button>
                  <Button variant="outline" size="lg" className="gap-2">
                    <Play className="w-5 h-5" />
                    Preview
                  </Button>
                  <Button variant="ghost" size="icon" className="h-12 w-12">
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

        {/* Lyrics Section */}
        {song.lyrics && (
          <section className="py-12 bg-card/30">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                <Music className="w-6 h-6 text-primary" />
                Lyrics
              </h2>
              <div className="glass-card p-6 md:p-8 max-w-3xl">
                <pre className="font-sans text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {song.lyrics}
                </pre>
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
