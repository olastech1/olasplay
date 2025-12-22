import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Users } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import ArtistForm from '@/components/admin/ArtistForm';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface Artist {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  bio: string | null;
  genre: string | null;
  followers: number;
  song_count: number;
  created_at: string;
}

const AdminArtists = () => {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingArtist, setEditingArtist] = useState<Artist | null>(null);
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  const fetchArtists = async () => {
    const { data, error } = await supabase
      .from('artists')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Error', description: 'Failed to fetch artists', variant: 'destructive' });
    } else {
      setArtists(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchArtists();
  }, []);

  const handleDelete = async (id: string) => {
    if (!isAdmin) {
      toast({ title: 'Access Denied', description: 'Only admins can delete artists', variant: 'destructive' });
      return;
    }

    if (!confirm('Are you sure? This will also delete all songs by this artist.')) return;

    const { error } = await supabase.from('artists').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: 'Failed to delete artist', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Artist deleted successfully' });
      fetchArtists();
    }
  };

  const handleEdit = (artist: Artist) => {
    setEditingArtist(artist);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingArtist(null);
    fetchArtists();
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingArtist(null);
  };

  const filteredArtists = artists.filter((artist) =>
    artist.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Artists</h1>
            <p className="text-muted-foreground mt-1">Manage artists and musicians</p>
          </div>
          {isAdmin && (
            <Button variant="gradient" className="gap-2" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4" />
              Add Artist
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search artists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-12 pr-4 rounded-xl bg-card border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Artists Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {loading ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">Loading...</div>
          ) : filteredArtists.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No artists found</p>
              {isAdmin && (
                <Button variant="outline" className="mt-4 gap-2" onClick={() => setShowForm(true)}>
                  <Plus className="w-4 h-4" />
                  Add your first artist
                </Button>
              )}
            </div>
          ) : (
            filteredArtists.map((artist) => (
              <div key={artist.id} className="glass-card p-4">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-muted flex-shrink-0">
                    {artist.image_url ? (
                      <img src={artist.image_url} alt={artist.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{artist.name}</h3>
                    <p className="text-sm text-muted-foreground">{artist.genre || 'No genre'}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span>{artist.followers} followers</span>
                      <span>{artist.song_count} songs</span>
                    </div>
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-border">
                    <Button variant="ghost" size="sm" className="gap-1" onClick={() => handleEdit(artist)}>
                      <Edit2 className="w-3 h-3" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(artist.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Artist Form Modal */}
      {showForm && (
        <ArtistForm
          artist={editingArtist}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}
    </AdminLayout>
  );
};

export default AdminArtists;
