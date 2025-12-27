import { useState, useMemo } from 'react';
import { X, Link2, Loader2, Music, Check, AlertCircle, ListMusic, Disc } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ImportedSong {
  title: string;
  artist: string;
  thumbnail: string;
  audioUrl: string;
  platform: string;
}

interface PlaylistVideo {
  videoId: string;
  title: string;
  thumbnail: string;
  author: string;
}

interface SongImporterProps {
  onClose: () => void;
  onSuccess: () => void;
}

type ImportStatus = 'pending' | 'loading' | 'success' | 'error';
type ImportMode = 'urls' | 'playlist';

interface ImportResult {
  url: string;
  status: ImportStatus;
  song?: ImportedSong;
  error?: string;
}

const SongImporter = ({ onClose, onSuccess }: SongImporterProps) => {
  const [urls, setUrls] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [importMode, setImportMode] = useState<ImportMode>('urls');
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [playlistVideos, setPlaylistVideos] = useState<PlaylistVideo[]>([]);
  const [playlistTitle, setPlaylistTitle] = useState('');
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
  const [createAsAlbum, setCreateAsAlbum] = useState(false);
  const [albumName, setAlbumName] = useState('');
  const [loadingPlaylist, setLoadingPlaylist] = useState(false);
  const { toast } = useToast();

  const progress = useMemo(() => {
    if (results.length === 0) return 0;
    const completed = results.filter(r => r.status === 'success' || r.status === 'error').length;
    return Math.round((completed / results.length) * 100);
  }, [results]);

  const parseUrls = (text: string): string[] => {
    return text
      .split(/[\n,]/)
      .map(url => url.trim())
      .filter(url => url.length > 0 && (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('music.youtube.com') || url.includes('audiomack.com')));
  };

  const fetchSongData = async (url: string): Promise<ImportedSong> => {
    const { data, error } = await supabase.functions.invoke('fetch-song', {
      body: { url },
    });

    if (error) throw new Error(error.message);
    if (!data.success) throw new Error(data.error);

    return data.data;
  };

  const fetchPlaylist = async () => {
    if (!playlistUrl.includes('list=')) {
      toast({ title: 'Error', description: 'Please enter a valid YouTube playlist URL', variant: 'destructive' });
      return;
    }

    setLoadingPlaylist(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-playlist', {
        body: { url: playlistUrl },
      });

      if (error) throw new Error(error.message);
      if (!data.success) throw new Error(data.error);

      setPlaylistVideos(data.data.videos);
      setPlaylistTitle(data.data.playlistTitle);
      setAlbumName(data.data.playlistTitle);
      setSelectedVideos(new Set(data.data.videos.map((v: PlaylistVideo) => v.videoId)));

      toast({ title: 'Playlist Loaded', description: `Found ${data.data.videos.length} videos` });
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: error instanceof Error ? error.message : 'Failed to load playlist', 
        variant: 'destructive' 
      });
    } finally {
      setLoadingPlaylist(false);
    }
  };

  const generateDescription = async (title: string, artist: string): Promise<string> => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-description', {
        body: { title, artist, type: 'description' },
      });
      
      if (error || !data?.description) {
        return `${title} by ${artist}. Stream and download now.`;
      }
      
      return data.description;
    } catch {
      return `${title} by ${artist}. Stream and download now.`;
    }
  };

  const generateSummary = async (title: string, artist: string): Promise<string> => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-description', {
        body: { title, artist, type: 'summary' },
      });
      
      if (error || !data?.summary) {
        return '';
      }
      
      return data.summary;
    } catch {
      return '';
    }
  };

  const getOrCreateArtist = async (artistName: string): Promise<string | null> => {
    if (!artistName || artistName === 'Unknown Artist') return null;

    const cleanName = artistName.replace(/ - Topic$/i, '').trim();
    const artistSlug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const { data: existing } = await supabase
      .from('artists')
      .select('id')
      .eq('slug', artistSlug)
      .maybeSingle();

    if (existing) return existing.id;

    const { data: newArtist, error } = await supabase
      .from('artists')
      .insert({
        name: cleanName,
        slug: artistSlug,
        genre: 'Music',
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating artist:', error);
      return null;
    }

    return newArtist.id;
  };

  const getOrCreateAlbum = async (name: string, artistId: string | null): Promise<string | null> => {
    if (!name) return null;

    const albumSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const { data: existing } = await supabase
      .from('albums')
      .select('id')
      .eq('slug', albumSlug)
      .maybeSingle();

    if (existing) return existing.id;

    const { data: newAlbum, error } = await supabase
      .from('albums')
      .insert({
        title: name,
        slug: albumSlug,
        artist_id: artistId,
        genre: 'Music',
        track_count: 0,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating album:', error);
      return null;
    }

    return newAlbum.id;
  };

  const saveSongToDatabase = async (song: ImportedSong, albumId: string | null = null): Promise<void> => {
    const artistId = await getOrCreateArtist(song.artist);
    const cleanArtist = song.artist.replace(/ - Topic$/i, '').trim();

    const slug = `${cleanArtist}-${song.title}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-mp3-download';

    const [description, summary] = await Promise.all([
      generateDescription(song.title, song.artist),
      generateSummary(song.title, song.artist),
    ]);

    const { error } = await supabase.from('songs').insert({
      title: song.title,
      slug,
      cover_url: song.thumbnail || null,
      download_url: song.audioUrl,
      genre: song.platform === 'youtube' ? 'Music' : 'Hip Hop',
      description,
      lyrics: summary,
      artist_id: artistId,
      album_id: albumId,
    });

    if (error) {
      if (error.message.includes('duplicate')) {
        throw new Error('Song already exists');
      }
      throw error;
    }
  };

  const processUrl = async (url: string, index: number, albumId: string | null = null): Promise<boolean> => {
    setResults(prev => prev.map((r, idx) => idx === index ? { ...r, status: 'loading' } : r));

    try {
      const song = await fetchSongData(url);
      await saveSongToDatabase(song, albumId);
      setResults(prev => prev.map((r, idx) => idx === index ? { ...r, status: 'success', song } : r));
      return true;
    } catch (error) {
      setResults(prev => prev.map((r, idx) => idx === index ? { 
        ...r, 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Import failed' 
      } : r));
      return false;
    }
  };

  const handleImport = async () => {
    let urlList: string[] = [];

    if (importMode === 'playlist') {
      urlList = Array.from(selectedVideos).map(
        videoId => `https://www.youtube.com/watch?v=${videoId}`
      );
    } else {
      urlList = parseUrls(urls);
    }
    
    if (urlList.length === 0) {
      toast({ title: 'Error', description: 'Please select or enter valid URLs', variant: 'destructive' });
      return;
    }

    setLoading(true);
    setResults(urlList.map(url => ({ url, status: 'pending' })));

    // Create album if needed
    let albumId: string | null = null;
    if (createAsAlbum && albumName) {
      // Get first artist from playlist videos if available
      let firstArtistId: string | null = null;
      if (importMode === 'playlist' && playlistVideos.length > 0) {
        firstArtistId = await getOrCreateArtist(playlistVideos[0].author);
      }
      albumId = await getOrCreateAlbum(albumName, firstArtistId);
    }

    const CONCURRENT_LIMIT = 2; // Lower for RapidAPI rate limits
    let successCount = 0;
    
    for (let i = 0; i < urlList.length; i += CONCURRENT_LIMIT) {
      const batch = urlList.slice(i, i + CONCURRENT_LIMIT);
      const batchPromises = batch.map((url, batchIndex) => 
        processUrl(url, i + batchIndex, albumId)
      );
      
      const batchResults = await Promise.all(batchPromises);
      successCount += batchResults.filter(Boolean).length;
      
      if (i + CONCURRENT_LIMIT < urlList.length) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Longer delay for API limits
      }
    }

    // Update album track count
    if (albumId && successCount > 0) {
      await supabase
        .from('albums')
        .update({ track_count: successCount })
        .eq('id', albumId);
    }

    setLoading(false);

    if (successCount > 0) {
      toast({ 
        title: 'Import Complete', 
        description: `Successfully imported ${successCount} of ${urlList.length} songs${albumId ? ' to album' : ''}` 
      });
    }
  };

  const handleDone = () => {
    onSuccess();
    onClose();
  };

  const toggleVideoSelection = (videoId: string) => {
    setSelectedVideos(prev => {
      const next = new Set(prev);
      if (next.has(videoId)) {
        next.delete(videoId);
      } else {
        next.add(videoId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedVideos.size === playlistVideos.length) {
      setSelectedVideos(new Set());
    } else {
      setSelectedVideos(new Set(playlistVideos.map(v => v.videoId)));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-2xl glass-card p-6 animate-fade-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-foreground">Import Songs</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Import from URLs or a YouTube playlist
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {results.length === 0 ? (
          <>
            {/* Mode Toggle */}
            <div className="flex gap-2 mb-4">
              <Button
                variant={importMode === 'urls' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setImportMode('urls')}
                className="gap-2"
              >
                <Link2 className="w-4 h-4" />
                Individual URLs
              </Button>
              <Button
                variant={importMode === 'playlist' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setImportMode('playlist')}
                className="gap-2"
              >
                <ListMusic className="w-4 h-4" />
                Playlist
              </Button>
            </div>

            {importMode === 'urls' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <Link2 className="w-4 h-4 inline mr-2" />
                    URLs
                  </label>
                  <textarea
                    value={urls}
                    onChange={(e) => setUrls(e.target.value)}
                    placeholder={`https://www.youtube.com/watch?v=...
https://music.youtube.com/watch?v=...
https://youtu.be/...`}
                    rows={6}
                    className="w-full px-4 py-3 rounded-xl bg-card border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground placeholder:text-muted-foreground resize-none font-mono text-sm"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label className="mb-2 block">Playlist URL</Label>
                  <div className="flex gap-2">
                    <Input
                      value={playlistUrl}
                      onChange={(e) => setPlaylistUrl(e.target.value)}
                      placeholder="https://www.youtube.com/playlist?list=..."
                      className="flex-1"
                    />
                    <Button 
                      onClick={fetchPlaylist} 
                      disabled={loadingPlaylist || !playlistUrl}
                    >
                      {loadingPlaylist ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Load'}
                    </Button>
                  </div>
                </div>

                {playlistVideos.length > 0 && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{playlistTitle}</span>
                      <Button variant="ghost" size="sm" onClick={toggleSelectAll}>
                        {selectedVideos.size === playlistVideos.length ? 'Deselect All' : 'Select All'}
                      </Button>
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-2 border border-border rounded-xl p-2">
                      {playlistVideos.map((video) => (
                        <div 
                          key={video.videoId}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                          onClick={() => toggleVideoSelection(video.videoId)}
                        >
                          <Checkbox 
                            checked={selectedVideos.has(video.videoId)}
                            onCheckedChange={() => toggleVideoSelection(video.videoId)}
                          />
                          <img 
                            src={video.thumbnail} 
                            alt="" 
                            className="w-12 h-9 object-cover rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{video.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{video.author}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {selectedVideos.size} of {playlistVideos.length} selected
                    </p>
                  </>
                )}
              </div>
            )}

            {/* Album Option */}
            <div className="mt-4 p-4 rounded-xl bg-muted/50 space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="createAlbum"
                  checked={createAsAlbum}
                  onCheckedChange={(checked) => setCreateAsAlbum(!!checked)}
                />
                <Label htmlFor="createAlbum" className="flex items-center gap-2 cursor-pointer">
                  <Disc className="w-4 h-4" />
                  Create as Album
                </Label>
              </div>
              {createAsAlbum && (
                <Input
                  value={albumName}
                  onChange={(e) => setAlbumName(e.target.value)}
                  placeholder="Album name..."
                />
              )}
            </div>

            <div className="flex gap-3 pt-6">
              <Button variant="outline" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                variant="gradient" 
                className="flex-1 gap-2" 
                onClick={handleImport}
                disabled={loading || (importMode === 'urls' ? !urls.trim() : selectedVideos.size === 0)}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Music className="w-4 h-4" />
                    Import {importMode === 'playlist' ? `${selectedVideos.size} Songs` : 'Songs'}
                  </>
                )}
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">
                  {loading ? 'Importing...' : 'Import Complete'}
                </span>
                <span className="text-sm font-medium text-primary">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {results.filter(r => r.status === 'success').length} succeeded, {results.filter(r => r.status === 'error').length} failed of {results.length} total
              </p>
            </div>

            <div className="space-y-3 max-h-[350px] overflow-y-auto">
              {results.map((result, index) => (
                <div 
                  key={index} 
                  className={`flex items-center gap-3 p-3 rounded-xl border ${
                    result.status === 'success' 
                      ? 'bg-green-500/10 border-green-500/30' 
                      : result.status === 'error'
                      ? 'bg-destructive/10 border-destructive/30'
                      : 'bg-muted/50 border-border'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {result.status === 'loading' && (
                      <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    )}
                    {result.status === 'success' && (
                      <Check className="w-5 h-5 text-green-500" />
                    )}
                    {result.status === 'error' && (
                      <AlertCircle className="w-5 h-5 text-destructive" />
                    )}
                    {result.status === 'pending' && (
                      <Music className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    {result.song ? (
                      <div>
                        <p className="font-medium text-foreground truncate">{result.song.title}</p>
                        <p className="text-sm text-muted-foreground truncate">{result.song.artist}</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm text-foreground truncate">{result.url}</p>
                        {result.error && (
                          <p className="text-xs text-destructive mt-1">{result.error}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-6">
              {loading ? (
                <Button variant="outline" className="flex-1" disabled>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Processing...
                </Button>
              ) : (
                <>
                  <Button variant="outline" className="flex-1" onClick={() => {
                    setResults([]);
                    setPlaylistVideos([]);
                    setSelectedVideos(new Set());
                  }}>
                    Import More
                  </Button>
                  <Button variant="gradient" className="flex-1" onClick={handleDone}>
                    Done
                  </Button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SongImporter;
