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

// Extract video/audio info and download URL using cobalt API
async function fetchFromCobalt(url: string): Promise<DownloadResponse> {
  try {
    const response = await fetch('https://api.cobalt.tools/api/json', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url,
        vCodec: 'h264',
        vQuality: '720',
        aFormat: 'mp3',
        isAudioOnly: true,
        isNoTTWatermark: true,
        isTTFullAudio: true,
      }),
    });

    const data = await response.json();
    console.log('Cobalt response:', JSON.stringify(data));

    if (data.status === 'error') {
      return { success: false, error: data.text || 'Failed to process URL' };
    }

    if (data.status === 'redirect' || data.status === 'stream') {
      // Detect platform
      let platform: 'youtube' | 'audiomack' | 'unknown' = 'unknown';
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        platform = 'youtube';
      } else if (url.includes('audiomack.com')) {
        platform = 'audiomack';
      }

      return {
        success: true,
        data: {
          title: data.filename?.replace(/\.[^/.]+$/, '') || 'Unknown Title',
          artist: 'Unknown Artist',
          duration: '',
          thumbnail: '',
          audioUrl: data.url,
          platform,
        },
      };
    }

    return { success: false, error: 'Unexpected response from download service' };
  } catch (error) {
    console.error('Cobalt API error:', error);
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
    const isYouTube = validUrl.includes('youtube.com') || validUrl.includes('youtu.be');
    const isAudiomack = validUrl.includes('audiomack.com');

    if (!isYouTube && !isAudiomack) {
      return new Response(
        JSON.stringify({ success: false, error: 'Only YouTube and Audiomack URLs are supported' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch metadata first
    let metadata: { title: string; artist: string; thumbnail: string } | null = null;
    
    if (isYouTube) {
      const ytMeta = await fetchYouTubeMetadata(validUrl);
      if (ytMeta) {
        metadata = { title: ytMeta.title, artist: ytMeta.author, thumbnail: ytMeta.thumbnail };
      }
    } else if (isAudiomack) {
      metadata = await fetchAudiomackMetadata(validUrl);
    }

    // Get download URL
    const downloadResult = await fetchFromCobalt(validUrl);

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
        artist: metadata?.artist || downloadResult.data!.artist,
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
