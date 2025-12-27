import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Music, Download } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import SongForm from '@/components/admin/SongForm';
import SongImporter from '@/components/admin/SongImporter';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
interface Song {
  id: string;
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
  plays: number;
  downloads: number;
  is_trending: boolean;
  created_at: string;
  artists: { name: string } | null;
}

const AdminSongs = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showImporter, setShowImporter] = useState(false);
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [selectedSongIds, setSelectedSongIds] = useState<string[]>([]);
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  const fetchSongs = async () => {
    const { data, error } = await supabase
      .from('songs')
      .select(`
        id, title, slug, artist_id, album_id, category_id, cover_url, duration, genre, 
        release_date, download_url, lyrics, description, plays, downloads, is_trending, created_at,
        artists:artist_id (name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Error', description: 'Failed to fetch songs', variant: 'destructive' });
    } else {
      setSongs(data || []);
      setSelectedSongIds([]);
    }
    setLoading(false);
  };
  useEffect(() => {
    fetchSongs();
  }, []);

  const filteredSongs = songs.filter(
    (song) =>
      song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.artists?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const allVisibleSelected =
    filteredSongs.length > 0 && selectedSongIds.length === filteredSongs.length;
  const someVisibleSelected =
    selectedSongIds.length > 0 && !allVisibleSelected;

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

  const handleBatchDelete = async () => {
    if (!isAdmin) {
      toast({ title: 'Access Denied', description: 'Only admins can delete songs', variant: 'destructive' });
      return;
    }

    if (selectedSongIds.length === 0) {
      toast({ title: 'No songs selected', description: 'Please select at least one song to delete.' });
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedSongIds.length} selected song(s)?`)) return;

    const { error } = await supabase.from('songs').delete().in('id', selectedSongIds);
    if (error) {
      toast({ title: 'Error', description: 'Failed to delete selected songs', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Selected songs deleted successfully' });
      fetchSongs();
    }
  };

  const handleToggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedSongIds([]);
    } else {
      setSelectedSongIds(filteredSongs.map((song) => song.id));
    }
  };

  const handleToggleSelectSong = (id: string) => {
    setSelectedSongIds((prev) =>
      prev.includes(id) ? prev.filter((songId) => songId !== id) : [...prev, id]
    );
  };

  const handleEdit = (song: Song) => {
    setEditingSong(song);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingSong(null);
    fetchSongs();
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingSong(null);
  };

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
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-end">
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  className="gap-2"
                  disabled={selectedSongIds.length === 0}
                  onClick={handleBatchDelete}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete selected
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="gap-2" onClick={() => setShowImporter(true)}>
                  <Download className="w-4 h-4" />
                  Import
                </Button>
                <Button variant="gradient" className="gap-2" onClick={() => setShowForm(true)}>
                  <Plus className="w-4 h-4" />
                  Add Song
                </Button>
              </div>
            </div>
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
                   {isAdmin && (
                     <th className="w-10 p-4 text-center align-middle">
                       <Checkbox
                         checked={someVisibleSelected ? 'indeterminate' : allVisibleSelected}
                         onCheckedChange={handleToggleSelectAll}
                         aria-label="Select all visible songs"
                       />
                     </th>
                   )}
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
                     <td colSpan={isAdmin ? 6 : 5} className="p-8 text-center text-muted-foreground">
                       Loading...
                     </td>
                   </tr>
                 ) : filteredSongs.length === 0 ? (
                   <tr>
                     <td colSpan={isAdmin ? 6 : 5} className="p-8 text-center text-muted-foreground">
                       <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
                       <p>No songs found</p>
                      {isAdmin && (
                        <Button variant="outline" className="mt-4 gap-2" onClick={() => setShowForm(true)}>
                          <Plus className="w-4 h-4" />
                          Add your first song
                        </Button>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredSongs.map((song) => (
                   <tr key={song.id} className="border-b border-border/50 hover:bg-muted/30">
                     {isAdmin && (
                       <td className="p-4 align-middle text-center">
                         <Checkbox
                           checked={selectedSongIds.includes(song.id)}
                           onCheckedChange={() => handleToggleSelectSong(song.id)}
                           aria-label={`Select song ${song.title}`}
                         />
                       </td>
                     )}
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
                           {song.is_trending && (
                             <span className="inline-block text-xs px-2 py-0.5 rounded bg-primary/20 text-primary mt-1">
                               Trending
                             </span>
                           )}
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
                             <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(song)}>
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

      {/* Song Form Modal */}
      {showForm && (
        <SongForm
          song={editingSong}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Song Importer Modal */}
      {showImporter && (
        <SongImporter
          onClose={() => setShowImporter(false)}
          onSuccess={() => {
            setShowImporter(false);
            fetchSongs();
          }}
        />
      )}
    </AdminLayout>
  );
};

export default AdminSongs;
