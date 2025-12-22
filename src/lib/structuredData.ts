// Structured data helpers for SEO

export const createSongSchema = (song: {
  title: string;
  artist: string;
  coverUrl: string;
  duration?: string;
  genre?: string;
  releaseDate?: string;
  slug: string;
  description?: string;
}) => {
  const siteUrl = "https://olasplay.com";
  
  return {
    "@context": "https://schema.org",
    "@type": "MusicRecording",
    "@id": `${siteUrl}/song/${song.slug}`,
    name: song.title,
    byArtist: {
      "@type": "MusicGroup",
      name: song.artist,
    },
    image: song.coverUrl,
    duration: song.duration ? `PT${song.duration.replace(":", "M")}S` : undefined,
    genre: song.genre,
    datePublished: song.releaseDate,
    description: song.description,
    url: `${siteUrl}/song/${song.slug}`,
    inLanguage: "en",
  };
};

export const createArtistSchema = (artist: {
  name: string;
  imageUrl: string;
  bio?: string;
  genre?: string;
  slug: string;
  songCount?: number;
  followers?: number;
}) => {
  const siteUrl = "https://olasplay.com";
  
  return {
    "@context": "https://schema.org",
    "@type": "MusicGroup",
    "@id": `${siteUrl}/artist/${artist.slug}`,
    name: artist.name,
    image: artist.imageUrl,
    description: artist.bio,
    genre: artist.genre,
    url: `${siteUrl}/artist/${artist.slug}`,
  };
};

export const createBreadcrumbSchema = (items: { name: string; url: string }[]) => {
  const siteUrl = "https://olasplay.com";
  
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${siteUrl}${item.url}`,
    })),
  };
};

export const createMusicPlaylistSchema = (playlist: {
  name: string;
  description: string;
  songs: { title: string; artist: string; slug: string }[];
}) => {
  const siteUrl = "https://olasplay.com";
  
  return {
    "@context": "https://schema.org",
    "@type": "MusicPlaylist",
    name: playlist.name,
    description: playlist.description,
    numTracks: playlist.songs.length,
    track: playlist.songs.map((song) => ({
      "@type": "MusicRecording",
      name: song.title,
      byArtist: {
        "@type": "MusicGroup",
        name: song.artist,
      },
      url: `${siteUrl}/song/${song.slug}`,
    })),
  };
};

export const createFAQSchema = (faqs: { question: string; answer: string }[]) => {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
};
