import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Disc3 } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface Album {
  id: string;
  title: string;
  slug: string;
  cover_url: string | null;
  genre: string | null;
  release_date: string | null;
  track_count: number;
  created_at: string;
  artists: { name: string } | null;
}

const AdminAlbums = () => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  const fetchAlbums = async () => {
    const { data, error } = await supabase
      .from('albums')
      .select(`
        id, title, slug, cover_url, genre, release_date, track_count, created_at,
        artists:artist_id (name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Error', description: 'Failed to fetch albums', variant: 'destructive' });
    } else {
      setAlbums(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAlbums();
  }, []);

  const handleDelete = async (id: string) => {
    if (!isAdmin) {
      toast({ title: 'Access Denied', description: 'Only admins can delete albums', variant: 'destructive' });
      return;
    }

    if (!confirm('Are you sure you want to delete this album?')) return;

    const { error } = await supabase.from('albums').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: 'Failed to delete album', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Album deleted successfully' });
      fetchAlbums();
    }
  };

  const filteredAlbums = albums.filter(
    (album) =>
      album.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      album.artists?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Albums</h1>
            <p className="text-muted-foreground mt-1">Manage music albums</p>
          </div>
          {isAdmin && (
            <Button variant="gradient" className="gap-2">
              <Plus className="w-4 h-4" />
              Add Album
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search albums..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-12 pr-4 rounded-xl bg-card border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Albums Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {loading ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">Loading...</div>
          ) : filteredAlbums.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Disc3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No albums found</p>
              {isAdmin && (
                <Button variant="outline" className="mt-4 gap-2">
                  <Plus className="w-4 h-4" />
                  Add your first album
                </Button>
              )}
            </div>
          ) : (
            filteredAlbums.map((album) => (
              <div key={album.id} className="glass-card overflow-hidden">
                <div className="aspect-square bg-muted">
                  {album.cover_url ? (
                    <img src={album.cover_url} alt={album.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Disc3 className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-foreground truncate">{album.title}</h3>
                  <p className="text-sm text-muted-foreground">{album.artists?.name || 'Unknown Artist'}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                      {album.genre || 'N/A'}
                    </span>
                    <span className="text-xs text-muted-foreground">{album.track_count} tracks</span>
                  </div>
                  {isAdmin && (
                    <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-border">
                      <Button variant="ghost" size="sm" className="gap-1">
                        <Edit2 className="w-3 h-3" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(album.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAlbums;
