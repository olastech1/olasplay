export interface Song {
  id: string;
  title: string;
  artist: string;
  artistId: string;
  album?: string;
  albumId?: string;
  coverUrl: string;
  duration: string;
  genre: string;
  releaseDate: string;
  downloadUrl: string;
  lyrics?: string;
  description?: string;
  plays: number;
  downloads: number;
  slug: string;
}

export interface Artist {
  id: string;
  name: string;
  imageUrl: string;
  bio?: string;
  genre: string;
  followers: number;
  songCount: number;
  slug: string;
}

export interface Album {
  id: string;
  title: string;
  artistId: string;
  artistName: string;
  coverUrl: string;
  releaseDate: string;
  genre: string;
  trackCount: number;
  slug: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  songCount: number;
  iconUrl?: string;
}
