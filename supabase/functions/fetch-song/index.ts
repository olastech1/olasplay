const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DownloadRequest {
  url: string;
}

interface DownloadResponse {
  success: boolean;
  data?: {
    title: string;
    artist: string;
    duration: string;
    thumbnail: string;
    audioUrl: string;
    platform: 'youtube' | 'audiomack' | 'unknown';
  };
  error?: string;
}

// Extract video ID from various YouTube URL formats
function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|music\.youtube\.com\/watch\?v=)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Fetch from RapidAPI YouTube downloader
async function fetchFromRapidAPI(url: string): Promise<DownloadResponse> {
  const rapidApiKey = Deno.env.get('RAPIDAPI_KEY');
  
  if (!rapidApiKey) {
    return { success: false, error: 'RapidAPI key not configured' };
  }

  try {
    const videoId = extractYouTubeVideoId(url);
    
    if (!videoId) {
      return { success: false, error: 'Could not extract video ID from URL' };
    }

    console.log('Fetching video info for ID:', videoId);

    // Using youtube-mp36 API on RapidAPI
    const response = await fetch(`https://youtube-mp36.p.rapidapi.com/dl?id=${videoId}`, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': rapidApiKey,
        'x-rapidapi-host': 'youtube-mp36.p.rapidapi.com',
      },
    });

    const data = await response.json();
    console.log('RapidAPI response:', JSON.stringify(data));

    if (data.status === 'fail' || !data.link) {
      return { success: false, error: data.msg || 'Failed to get download link' };
    }

    return {
      success: true,
      data: {
        title: data.title || 'Unknown Title',
        artist: 'Unknown Artist',
        duration: data.duration || '',
        thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        audioUrl: data.link,
        platform: 'youtube',
      },
    };
  } catch (error) {
    console.error('RapidAPI error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Download failed' };
  }
}

// Fetch YouTube metadata using oEmbed (no API key needed)
async function fetchYouTubeMetadata(url: string): Promise<{ title: string; author: string; thumbnail: string } | null> {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const response = await fetch(oembedUrl);
    
    if (!response.ok) return null;
    
    const data = await response.json();
    return {
      title: data.title || 'Unknown Title',
      author: data.author_name || 'Unknown Artist',
      thumbnail: data.thumbnail_url || '',
    };
  } catch (error) {
    console.error('YouTube oEmbed error:', error);
    return null;
  }
}

// Fetch Audiomack metadata by scraping (basic approach)
async function fetchAudiomackMetadata(url: string): Promise<{ title: string; artist: string; thumbnail: string } | null> {
  try {
    // Audiomack URLs follow pattern: audiomack.com/artist/song/title
    const urlParts = url.split('/').filter(Boolean);
    const artistIndex = urlParts.findIndex(p => p === 'audiomack.com') + 1;
    
    if (artistIndex > 0 && urlParts.length > artistIndex + 2) {
      const artist = urlParts[artistIndex].replace(/-/g, ' ');
      const title = urlParts[artistIndex + 2]?.replace(/-/g, ' ') || 'Unknown Title';
      
      return {
        title: title.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        artist: artist.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        thumbnail: '',
      };
    }
    
    return null;
  } catch (error) {
    console.error('Audiomack metadata error:', error);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url }: DownloadRequest = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing URL:', url);

    // Validate URL
    const validUrl = url.trim();
    const isYouTube = validUrl.includes('youtube.com') || validUrl.includes('youtu.be') || validUrl.includes('music.youtube.com');
    const isAudiomack = validUrl.includes('audiomack.com');

    if (!isYouTube && !isAudiomack) {
      return new Response(
        JSON.stringify({ success: false, error: 'Only YouTube and Audiomack URLs are supported' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (isAudiomack) {
      // For Audiomack, we can only get metadata without RapidAPI support
      const metadata = await fetchAudiomackMetadata(validUrl);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Audiomack download is not currently supported. Only YouTube is available.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch YouTube metadata first
    const metadata = await fetchYouTubeMetadata(validUrl);

    // Get download URL from RapidAPI
    const downloadResult = await fetchFromRapidAPI(validUrl);

    if (!downloadResult.success) {
      return new Response(
        JSON.stringify(downloadResult),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Merge metadata with download result
    const result: DownloadResponse = {
      success: true,
      data: {
        title: metadata?.title || downloadResult.data!.title,
        artist: metadata?.author || downloadResult.data!.artist,
        duration: downloadResult.data!.duration,
        thumbnail: metadata?.thumbnail || downloadResult.data!.thumbnail,
        audioUrl: downloadResult.data!.audioUrl,
        platform: downloadResult.data!.platform,
      },
    };

    console.log('Final result:', JSON.stringify(result));

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Processing failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
