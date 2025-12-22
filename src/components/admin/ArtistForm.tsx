import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Artist {
  id?: string;
  name: string;
  slug: string;
  image_url: string | null;
  bio: string | null;
  genre: string | null;
}

interface ArtistFormProps {
  artist?: Artist | null;
  onClose: () => void;
  onSuccess: () => void;
}

const ArtistForm = ({ artist, onClose, onSuccess }: ArtistFormProps) => {
  const [name, setName] = useState(artist?.name || '');
  const [slug, setSlug] = useState(artist?.slug || '');
  const [imageUrl, setImageUrl] = useState(artist?.image_url || '');
  const [bio, setBio] = useState(artist?.bio || '');
  const [genre, setGenre] = useState(artist?.genre || '');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const isEditing = !!artist?.id;

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  useEffect(() => {
    if (!isEditing && name) {
      setSlug(generateSlug(name));
    }
  }, [name, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) {
      toast({ title: 'Error', description: 'Name and slug are required', variant: 'destructive' });
      return;
    }

    setLoading(true);

    const data = {
      name: name.trim(),
      slug: slug.trim(),
      image_url: imageUrl.trim() || null,
      bio: bio.trim() || null,
      genre: genre.trim() || null,
    };

    let error;

    if (isEditing) {
      const result = await supabase.from('artists').update(data).eq('id', artist.id);
      error = result.error;
    } else {
      const result = await supabase.from('artists').insert(data);
      error = result.error;
    }

    setLoading(false);

    if (error) {
      toast({ 
        title: 'Error', 
        description: error.message.includes('duplicate') ? 'An artist with this slug already exists' : error.message, 
        variant: 'destructive' 
      });
    } else {
      toast({ title: 'Success', description: `Artist ${isEditing ? 'updated' : 'created'} successfully` });
      onSuccess();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md glass-card p-6 animate-fade-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">
            {isEditing ? 'Edit Artist' : 'Add Artist'}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Burna Boy"
              className="w-full h-11 px-4 rounded-xl bg-card border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Slug *</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g., burna-boy"
              className="w-full h-11 px-4 rounded-xl bg-card border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground placeholder:text-muted-foreground"
            />
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
            <label className="block text-sm font-medium text-foreground mb-2">Image URL</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/artist.jpg"
              className="w-full h-11 px-4 rounded-xl bg-card border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Brief biography of the artist..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-card border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground placeholder:text-muted-foreground resize-none"
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

export default ArtistForm;
