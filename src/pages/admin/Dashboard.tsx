import { useEffect, useState } from 'react';
import { Music, Users, Disc3, FolderOpen, TrendingUp, Download } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';

interface Stats {
  songs: number;
  artists: number;
  albums: number;
  categories: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<Stats>({ songs: 0, artists: 0, albums: 0, categories: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [songsRes, artistsRes, albumsRes, categoriesRes] = await Promise.all([
        supabase.from('songs').select('id', { count: 'exact', head: true }),
        supabase.from('artists').select('id', { count: 'exact', head: true }),
        supabase.from('albums').select('id', { count: 'exact', head: true }),
        supabase.from('categories').select('id', { count: 'exact', head: true }),
      ]);

      setStats({
        songs: songsRes.count || 0,
        artists: artistsRes.count || 0,
        albums: albumsRes.count || 0,
        categories: categoriesRes.count || 0,
      });
      setLoading(false);
    };

    fetchStats();
  }, []);

  const statCards = [
    { name: 'Total Songs', value: stats.songs, icon: Music, color: 'from-primary to-orange-500' },
    { name: 'Total Artists', value: stats.artists, icon: Users, color: 'from-secondary to-purple-500' },
    { name: 'Total Albums', value: stats.albums, icon: Disc3, color: 'from-accent to-cyan-500' },
    { name: 'Categories', value: stats.categories, icon: FolderOpen, color: 'from-green-500 to-emerald-500' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome to OlasPlay Admin Panel
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {statCards.map((stat) => (
            <div key={stat.name} className="glass-card p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">{stat.name}</p>
                  <p className="text-3xl font-bold text-foreground mt-2">
                    {loading ? '...' : stat.value}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <a
              href="/admin/songs"
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
            >
              <Music className="w-6 h-6 text-primary" />
              <span className="text-sm font-medium text-foreground">Add Song</span>
            </a>
            <a
              href="/admin/artists"
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
            >
              <Users className="w-6 h-6 text-secondary" />
              <span className="text-sm font-medium text-foreground">Add Artist</span>
            </a>
            <a
              href="/admin/albums"
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
            >
              <Disc3 className="w-6 h-6 text-accent" />
              <span className="text-sm font-medium text-foreground">Add Album</span>
            </a>
            <a
              href="/admin/categories"
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
            >
              <FolderOpen className="w-6 h-6 text-green-500" />
              <span className="text-sm font-medium text-foreground">Add Category</span>
            </a>
          </div>
        </div>

        {/* Info Banner */}
        <div className="glass-card p-6 border-l-4 border-primary">
          <h3 className="font-semibold text-foreground mb-2">Getting Started</h3>
          <p className="text-muted-foreground text-sm">
            Start by adding categories and artists, then add songs linked to them. 
            All content will be publicly visible on the main website once added.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
