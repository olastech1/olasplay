import { useState, useMemo } from 'react';
import { X, Link2, Loader2, Music, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ImportedSong {
  title: string;
  artist: string;
  thumbnail: string;
  audioUrl: string;
  platform: string;
}

interface SongImporterProps {
  onClose: () => void;
  onSuccess: () => void;
}

type ImportStatus = 'pending' | 'loading' | 'success' | 'error';

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
      .filter(url => url.length > 0 && (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('audiomack.com')));
  };

  const fetchSongData = async (url: string): Promise<ImportedSong> => {
    const { data, error } = await supabase.functions.invoke('fetch-song', {
      body: { url },
    });

    if (error) throw new Error(error.message);
    if (!data.success) throw new Error(data.error);

    return data.data;
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

    // Clean artist name (remove " - Topic" suffix from YouTube channels)
    const cleanName = artistName.replace(/ - Topic$/i, '').trim();
    const artistSlug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // Check if artist exists
    const { data: existing } = await supabase
      .from('artists')
      .select('id')
      .eq('slug', artistSlug)
      .maybeSingle();

    if (existing) return existing.id;

    // Create new artist
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

  const saveSongToDatabase = async (song: ImportedSong): Promise<void> => {
    // Get or create artist
    const artistId = await getOrCreateArtist(song.artist);

    // Clean artist name for slug (remove " - Topic" suffix)
    const cleanArtist = song.artist.replace(/ - Topic$/i, '').trim();

    // Generate slug
    const slug = `${cleanArtist}-${song.title}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-mp3-download';

    // Generate AI description and summary in parallel
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
      lyrics: summary, // Store AI summary in lyrics field
      artist_id: artistId,
    });

    if (error) {
      if (error.message.includes('duplicate')) {
        throw new Error('Song already exists');
      }
      throw error;
    }
  };

  const processUrl = async (url: string, index: number): Promise<boolean> => {
    setResults(prev => prev.map((r, idx) => idx === index ? { ...r, status: 'loading' } : r));

    try {
      const song = await fetchSongData(url);
      await saveSongToDatabase(song);
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
    const urlList = parseUrls(urls);
    
    if (urlList.length === 0) {
      toast({ title: 'Error', description: 'Please enter valid YouTube or Audiomack URLs', variant: 'destructive' });
      return;
    }

    setLoading(true);
    setResults(urlList.map(url => ({ url, status: 'pending' })));

    const CONCURRENT_LIMIT = 3;
    let successCount = 0;
    
    // Process URLs in batches of CONCURRENT_LIMIT
    for (let i = 0; i < urlList.length; i += CONCURRENT_LIMIT) {
      const batch = urlList.slice(i, i + CONCURRENT_LIMIT);
      const batchPromises = batch.map((url, batchIndex) => 
        processUrl(url, i + batchIndex)
      );
      
      const batchResults = await Promise.all(batchPromises);
      successCount += batchResults.filter(Boolean).length;
      
      // Small delay between batches to avoid rate limiting
      if (i + CONCURRENT_LIMIT < urlList.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    setLoading(false);

    if (successCount > 0) {
      toast({ 
        title: 'Import Complete', 
        description: `Successfully imported ${successCount} of ${urlList.length} songs` 
      });
    }
  };

  const handleDone = () => {
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-2xl glass-card p-6 animate-fade-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-foreground">Import Songs</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Paste YouTube or Audiomack URLs (one per line)
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {results.length === 0 ? (
          <>
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
https://audiomack.com/artist/song/title
https://youtu.be/...`}
                  rows={8}
                  className="w-full px-4 py-3 rounded-xl bg-card border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground placeholder:text-muted-foreground resize-none font-mono text-sm"
                />
              </div>

              <div className="p-4 rounded-xl bg-muted/50 text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-2">Supported platforms:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>YouTube (youtube.com, youtu.be)</li>
                  <li>Audiomack (audiomack.com)</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3 pt-6">
              <Button variant="outline" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                variant="gradient" 
                className="flex-1 gap-2" 
                onClick={handleImport}
                disabled={loading || !urls.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Music className="w-4 h-4" />
                    Import Songs
                  </>
                )}
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Progress bar */}
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
                  <Button variant="outline" className="flex-1" onClick={() => setResults([])}>
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
