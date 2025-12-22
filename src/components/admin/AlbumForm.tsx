import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Album {
  id?: string;
  title: string;
  slug: string;
  artist_id: string | null;
  cover_url: string | null;
  genre: string | null;
  release_date: string | null;
}

interface Artist {
  id: string;
  name: string;
}

interface AlbumFormProps {
  album?: Album | null;
  onClose: () => void;
  onSuccess: () => void;
}

const AlbumForm = ({ album, onClose, onSuccess }: AlbumFormProps) => {
  const [title, setTitle] = useState(album?.title || '');
  const [slug, setSlug] = useState(album?.slug || '');
  const [artistId, setArtistId] = useState(album?.artist_id || '');
  const [coverUrl, setCoverUrl] = useState(album?.cover_url || '');
  const [genre, setGenre] = useState(album?.genre || '');
  const [releaseDate, setReleaseDate] = useState(album?.release_date || '');
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const isEditing = !!album?.id;

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  useEffect(() => {
    const fetchArtists = async () => {
      const { data } = await supabase.from('artists').select('id, name').order('name');
      setArtists(data || []);
    };
    fetchArtists();
  }, []);

  useEffect(() => {
    if (!isEditing && title) {
      setSlug(generateSlug(title));
    }
  }, [title, isEditing]);

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
      cover_url: coverUrl.trim() || null,
      genre: genre.trim() || null,
      release_date: releaseDate || null,
    };

    let error;

    if (isEditing) {
      const result = await supabase.from('albums').update(data).eq('id', album.id);
      error = result.error;
    } else {
      const result = await supabase.from('albums').insert(data);
      error = result.error;
    }

    setLoading(false);

    if (error) {
      toast({ 
        title: 'Error', 
        description: error.message.includes('duplicate') ? 'An album with this slug already exists' : error.message, 
        variant: 'destructive' 
      });
    } else {
      toast({ title: 'Success', description: `Album ${isEditing ? 'updated' : 'created'} successfully` });
      onSuccess();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md glass-card p-6 animate-fade-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">
            {isEditing ? 'Edit Album' : 'Add Album'}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Love, Damini"
              className="w-full h-11 px-4 rounded-xl bg-card border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Slug *</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g., love-damini"
              className="w-full h-11 px-4 rounded-xl bg-card border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Artist</label>
            <select
              value={artistId}
              onChange={(e) => setArtistId(e.target.value)}
              className="w-full h-11 px-4 rounded-xl bg-card border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground"
            >
              <option value="">Select an artist</option>
              {artists.map((artist) => (
                <option key={artist.id} value={artist.id}>
                  {artist.name}
                </option>
              ))}
            </select>
          </div>

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

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Cover URL</label>
            <input
              type="url"
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder="https://example.com/cover.jpg"
              className="w-full h-11 px-4 rounded-xl bg-card border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground placeholder:text-muted-foreground"
            />
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

export default AlbumForm;
