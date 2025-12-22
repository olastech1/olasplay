import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Music } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface Song {
  id: string;
  title: string;
  slug: string;
  cover_url: string | null;
  genre: string | null;
  plays: number;
  downloads: number;
  created_at: string;
  artists: { name: string } | null;
}

const AdminSongs = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  const fetchSongs = async () => {
    const { data, error } = await supabase
      .from('songs')
      .select(`
        id, title, slug, cover_url, genre, plays, downloads, created_at,
        artists:artist_id (name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Error', description: 'Failed to fetch songs', variant: 'destructive' });
    } else {
      setSongs(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSongs();
  }, []);

  const handleDelete = async (id: string) => {
    if (!isAdmin) {
      toast({ title: 'Access Denied', description: 'Only admins can delete songs', variant: 'destructive' });
      return;
    }

    if (!confirm('Are you sure you want to delete this song?')) return;

    const { error } = await supabase.from('songs').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: 'Failed to delete song', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Song deleted successfully' });
      fetchSongs();
    }
  };

  const filteredSongs = songs.filter(
    (song) =>
      song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.artists?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Songs</h1>
            <p className="text-muted-foreground mt-1">Manage your music library</p>
          </div>
          {isAdmin && (
            <Button variant="gradient" className="gap-2">
              <Plus className="w-4 h-4" />
              Add Song
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search songs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-12 pr-4 rounded-xl bg-card border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Songs Table */}
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 text-muted-foreground font-medium">Song</th>
                  <th className="text-left p-4 text-muted-foreground font-medium hidden md:table-cell">Artist</th>
                  <th className="text-left p-4 text-muted-foreground font-medium hidden lg:table-cell">Genre</th>
                  <th className="text-left p-4 text-muted-foreground font-medium hidden sm:table-cell">Stats</th>
                  <th className="text-right p-4 text-muted-foreground font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      Loading...
                    </td>
                  </tr>
                ) : filteredSongs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No songs found</p>
                      {isAdmin && (
                        <Button variant="outline" className="mt-4 gap-2">
                          <Plus className="w-4 h-4" />
                          Add your first song
                        </Button>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredSongs.map((song) => (
                    <tr key={song.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                            {song.cover_url ? (
                              <img src={song.cover_url} alt={song.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Music className="w-5 h-5 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">{song.title}</p>
                            <p className="text-sm text-muted-foreground md:hidden truncate">
                              {song.artists?.name || 'Unknown Artist'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 hidden md:table-cell text-muted-foreground">
                        {song.artists?.name || 'Unknown'}
                      </td>
                      <td className="p-4 hidden lg:table-cell">
                        <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs">
                          {song.genre || 'N/A'}
                        </span>
                      </td>
                      <td className="p-4 hidden sm:table-cell text-sm text-muted-foreground">
                        <span>{song.plays} plays</span>
                        <span className="mx-2">•</span>
                        <span>{song.downloads} downloads</span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isAdmin && (
                            <>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => handleDelete(song.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSongs;
