import { Song, Artist, Category } from "@/types/music";

export const mockSongs: Song[] = [
  {
    id: "1",
    title: "Midnight Vibes",
    artist: "Afrowave",
    artistId: "a1",
    album: "City Lights",
    albumId: "alb1",
    coverUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
    duration: "3:45",
    genre: "Afrobeats",
    releaseDate: "2024-12-15",
    downloadUrl: "#",
    plays: 125000,
    downloads: 45000,
    slug: "afrowave-midnight-vibes-mp3-download",
    description: "A smooth Afrobeats track that captures the energy of Lagos nightlife.",
    lyrics: "Verse 1:\nWalking through the city lights...\n\nChorus:\nMidnight vibes, feeling so alive..."
  },
  {
    id: "2",
    title: "Summer Heat",
    artist: "DJ Flame",
    artistId: "a2",
    coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop",
    duration: "4:12",
    genre: "Amapiano",
    releaseDate: "2024-12-10",
    downloadUrl: "#",
    plays: 89000,
    downloads: 32000,
    slug: "dj-flame-summer-heat-mp3-download"
  },
  {
    id: "3",
    title: "Street Anthem",
    artist: "King Vibes",
    artistId: "a3",
    coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop",
    duration: "3:58",
    genre: "Hip Hop",
    releaseDate: "2024-12-08",
    downloadUrl: "#",
    plays: 210000,
    downloads: 78000,
    slug: "king-vibes-street-anthem-mp3-download"
  },
  {
    id: "4",
    title: "Love & Bass",
    artist: "Melodia",
    artistId: "a4",
    coverUrl: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&h=400&fit=crop",
    duration: "3:22",
    genre: "R&B",
    releaseDate: "2024-12-05",
    downloadUrl: "#",
    plays: 156000,
    downloads: 52000,
    slug: "melodia-love-bass-mp3-download"
  },
  {
    id: "5",
    title: "Electric Dreams",
    artist: "Synth Master",
    artistId: "a5",
    coverUrl: "https://images.unsplash.com/photo-1571974599782-87624638275e?w=400&h=400&fit=crop",
    duration: "5:01",
    genre: "Electronic",
    releaseDate: "2024-12-01",
    downloadUrl: "#",
    plays: 98000,
    downloads: 28000,
    slug: "synth-master-electric-dreams-mp3-download"
  },
  {
    id: "6",
    title: "Reggae Soul",
    artist: "Island King",
    artistId: "a6",
    coverUrl: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&h=400&fit=crop",
    duration: "4:33",
    genre: "Reggae",
    releaseDate: "2024-11-28",
    downloadUrl: "#",
    plays: 134000,
    downloads: 41000,
    slug: "island-king-reggae-soul-mp3-download"
  },
  {
    id: "7",
    title: "Gospel Glory",
    artist: "Divine Voices",
    artistId: "a7",
    coverUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=400&fit=crop",
    duration: "4:15",
    genre: "Gospel",
    releaseDate: "2024-11-25",
    downloadUrl: "#",
    plays: 87000,
    downloads: 29000,
    slug: "divine-voices-gospel-glory-mp3-download"
  },
  {
    id: "8",
    title: "Trap Nation",
    artist: "Beat Dropper",
    artistId: "a8",
    coverUrl: "https://images.unsplash.com/photo-1504898770365-14faca6a7320?w=400&h=400&fit=crop",
    duration: "3:08",
    genre: "Trap",
    releaseDate: "2024-11-20",
    downloadUrl: "#",
    plays: 178000,
    downloads: 63000,
    slug: "beat-dropper-trap-nation-mp3-download"
  }
];

export const mockArtists: Artist[] = [
  {
    id: "a1",
    name: "Afrowave",
    imageUrl: "https://images.unsplash.com/photo-1549213783-8284d0336c4f?w=400&h=400&fit=crop",
    bio: "Nigerian-born producer and artist blending traditional sounds with modern beats.",
    genre: "Afrobeats",
    followers: 250000,
    songCount: 45,
    slug: "afrowave"
  },
  {
    id: "a2",
    name: "DJ Flame",
    imageUrl: "https://images.unsplash.com/photo-1571974599782-87624638275e?w=400&h=400&fit=crop",
    bio: "South African DJ pioneering the Amapiano movement worldwide.",
    genre: "Amapiano",
    followers: 180000,
    songCount: 32,
    slug: "dj-flame"
  },
  {
    id: "a3",
    name: "King Vibes",
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
    bio: "Hip hop artist known for street anthems and powerful lyrics.",
    genre: "Hip Hop",
    followers: 420000,
    songCount: 67,
    slug: "king-vibes"
  },
  {
    id: "a4",
    name: "Melodia",
    imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop",
    bio: "R&B songstress with a voice that touches souls.",
    genre: "R&B",
    followers: 310000,
    songCount: 28,
    slug: "melodia"
  }
];

export const categories: Category[] = [
  { id: "c1", name: "Afrobeats", slug: "afrobeats", songCount: 1250 },
  { id: "c2", name: "Amapiano", slug: "amapiano", songCount: 890 },
  { id: "c3", name: "Hip Hop", slug: "hip-hop", songCount: 2100 },
  { id: "c4", name: "R&B", slug: "rnb", songCount: 780 },
  { id: "c5", name: "Gospel", slug: "gospel", songCount: 650 },
  { id: "c6", name: "Reggae", slug: "reggae", songCount: 420 },
  { id: "c7", name: "Electronic", slug: "electronic", songCount: 560 },
  { id: "c8", name: "Trap", slug: "trap", songCount: 920 }
];
