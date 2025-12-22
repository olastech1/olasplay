import { useState, useEffect } from 'react';
import { X, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Song {
  id?: string;
  title: string;
  slug: string;
  artist_id: string | null;
  album_id: string | null;
  category_id: string | null;
  cover_url: string | null;
  duration: string | null;
  genre: string | null;
  release_date: string | null;
  download_url: string | null;
  lyrics: string | null;
  description: string | null;
  is_trending: boolean;
}

interface Artist {
  id: string;
  name: string;
}

interface Album {
  id: string;
  title: string;
}

interface Category {
  id: string;
  name: string;
}

interface SongFormProps {
  song?: Song | null;
  onClose: () => void;
  onSuccess: () => void;
}

const SongForm = ({ song, onClose, onSuccess }: SongFormProps) => {
  const [title, setTitle] = useState(song?.title || '');
  const [slug, setSlug] = useState(song?.slug || '');
  const [artistId, setArtistId] = useState(song?.artist_id || '');
  const [albumId, setAlbumId] = useState(song?.album_id || '');
  const [categoryId, setCategoryId] = useState(song?.category_id || '');
  const [coverUrl, setCoverUrl] = useState(song?.cover_url || '');
  const [duration, setDuration] = useState(song?.duration || '');
  const [genre, setGenre] = useState(song?.genre || '');
  const [releaseDate, setReleaseDate] = useState(song?.release_date || '');
  const [downloadUrl, setDownloadUrl] = useState(song?.download_url || '');
  const [lyrics, setLyrics] = useState(song?.lyrics || '');
  const [description, setDescription] = useState(song?.description || '');
  const [isTrending, setIsTrending] = useState(song?.is_trending || false);

  const [artists, setArtists] = useState<Artist[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const { toast } = useToast();

  const isEditing = !!song?.id;

  const generateSlug = (text: string, artistName?: string) => {
    const base = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return artistName 
      ? `${artistName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${base}-mp3-download`
      : `${base}-mp3-download`;
  };

  useEffect(() => {
    const fetchData = async () => {
      const [artistsRes, albumsRes, categoriesRes] = await Promise.all([
        supabase.from('artists').select('id, name').order('name'),
        supabase.from('albums').select('id, title').order('title'),
        supabase.from('categories').select('id, name').order('name'),
      ]);
      setArtists(artistsRes.data || []);
      setAlbums(albumsRes.data || []);
      setCategories(categoriesRes.data || []);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!isEditing && title) {
      const selectedArtist = artists.find(a => a.id === artistId);
      setSlug(generateSlug(title, selectedArtist?.name));
    }
  }, [title, artistId, artists, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !slug.trim()) {
      toast({ title: 'Error', description: 'Title and slug are required', variant: 'destructive' });
      return;
    }

    setLoading(true);

    const data = {
      title: title.trim(),
      slug: slug.trim(),
      artist_id: artistId || null,
      album_id: albumId || null,
      category_id: categoryId || null,
      cover_url: coverUrl.trim() || null,
      duration: duration.trim() || null,
      genre: genre.trim() || null,
      release_date: releaseDate || null,
      download_url: downloadUrl.trim() || null,
      lyrics: lyrics.trim() || null,
      description: description.trim() || null,
      is_trending: isTrending,
    };

    let error;

    if (isEditing) {
      const result = await supabase.from('songs').update(data).eq('id', song.id);
      error = result.error;
    } else {
      const result = await supabase.from('songs').insert(data);
      error = result.error;
    }

    setLoading(false);

    if (error) {
      toast({ 
        title: 'Error', 
        description: error.message.includes('duplicate') ? 'A song with this slug already exists' : error.message, 
        variant: 'destructive' 
      });
    } else {
      toast({ title: 'Success', description: `Song ${isEditing ? 'updated' : 'created'} successfully` });
      onSuccess();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-2xl glass-card p-6 animate-fade-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">
            {isEditing ? 'Edit Song' : 'Add Song'}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Last Last"
                className="w-full h-11 px-4 rounded-xl bg-card border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Duration</label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g., 3:45"
                className="w-full h-11 px-4 rounded-xl bg-card border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Slug *</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g., burna-boy-last-last-mp3-download"
              className="w-full h-11 px-4 rounded-xl bg-card border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Artist</label>
              <select
                value={artistId}
                onChange={(e) => setArtistId(e.target.value)}
                className="w-full h-11 px-4 rounded-xl bg-card border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground"
              >
                <option value="">Select artist</option>
                {artists.map((artist) => (
                  <option key={artist.id} value={artist.id}>{artist.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Album</label>
              <select
                value={albumId}
                onChange={(e) => setAlbumId(e.target.value)}
                className="w-full h-11 px-4 rounded-xl bg-card border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground"
              >
                <option value="">Select album</option>
                {albums.map((album) => (
                  <option key={album.id} value={album.id}>{album.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full h-11 px-4 rounded-xl bg-card border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground"
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Genre</label>
              <input
                type="text"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                placeholder="e.g., Afrobeats"
                className="w-full h-11 px-4 rounded-xl bg-card border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Release Date</label>
              <input
                type="date"
                value={releaseDate}
                onChange={(e) => setReleaseDate(e.target.value)}
                className="w-full h-11 px-4 rounded-xl bg-card border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">Cover Image</label>
            
            {coverUrl && (
              <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                <img
                  src={coverUrl}
                  alt="Cover preview"
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <span className="text-sm text-muted-foreground truncate flex-1">{coverUrl}</span>
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  setUploadingCover(true);
                  try {
                    const fileExt = file.name.split(".").pop();
                    const fileName = `cover-${Date.now()}.${fileExt}`;
                    const filePath = `songs/${fileName}`;

                    const { error: uploadError } = await supabase.storage
                      .from("uploads")
                      .upload(filePath, file);

                    if (uploadError) throw uploadError;

                    const { data: { publicUrl } } = supabase.storage
                      .from("uploads")
                      .getPublicUrl(filePath);

                    setCoverUrl(publicUrl);
                    toast({ title: "Cover uploaded successfully" });
                  } catch (error) {
                    toast({
                      title: "Failed to upload cover",
                      description: error instanceof Error ? error.message : "Unknown error",
                      variant: "destructive",
                    });
                  } finally {
                    setUploadingCover(false);
                  }
                }}
                disabled={uploadingCover}
                className="flex-1 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 file:cursor-pointer"
              />
              {uploadingCover && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
            </div>

            <div className="text-xs text-muted-foreground">Or enter URL directly:</div>
            <input
              type="url"
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder="https://example.com/cover.jpg"
              className="w-full h-11 px-4 rounded-xl bg-card border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Download URL</label>
            <input
              type="url"
              value={downloadUrl}
              onChange={(e) => setDownloadUrl(e.target.value)}
              placeholder="https://example.com/song.mp3"
              className="w-full h-11 px-4 rounded-xl bg-card border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the song..."
              rows={2}
              className="w-full px-4 py-3 rounded-xl bg-card border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground placeholder:text-muted-foreground resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Lyrics</label>
            <textarea
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              placeholder="Song lyrics..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-card border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground placeholder:text-muted-foreground resize-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_trending"
              checked={isTrending}
              onChange={(e) => setIsTrending(e.target.checked)}
              className="w-5 h-5 rounded border-border bg-card text-primary focus:ring-primary/20"
            />
            <label htmlFor="is_trending" className="text-sm font-medium text-foreground">
              Mark as Trending
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="gradient" className="flex-1" disabled={loading}>
              {loading ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SongForm;
