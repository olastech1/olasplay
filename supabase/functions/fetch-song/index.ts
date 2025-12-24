import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    platform: 'youtube' | 'audiomack' | 'soundcloud' | 'unknown';
  };
  error?: string;
}

// Y2Mate API endpoints
const Y2MATE_ANALYZE_URL = 'https://www.y2mate.com/mates/analyzeV2/ajax';
const Y2MATE_CONVERT_URL = 'https://www.y2mate.com/mates/convertV2/index';

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

// Fetch YouTube metadata using oEmbed (no API key needed)
async function fetchYouTubeMetadata(
  url: string
): Promise<{ title: string; author: string; thumbnail: string } | null> {
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

// Use Y2Mate API to get download link
async function fetchFromY2Mate(url: string): Promise<DownloadResponse> {
  try {
    console.log('Analyzing URL with Y2Mate:', url);

    // Step 1: Analyze the video URL
    const analyzeFormData = new URLSearchParams();
    analyzeFormData.append('k_query', url);
    analyzeFormData.append('k_page', 'home');
    analyzeFormData.append('hl', 'en');
    analyzeFormData.append('q_auto', '0');

    const analyzeResponse = await fetch(Y2MATE_ANALYZE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Origin': 'https://www.y2mate.com',
        'Referer': 'https://www.y2mate.com/',
      },
      body: analyzeFormData.toString(),
    });

    if (!analyzeResponse.ok) {
      return { success: false, error: `Y2Mate analyze failed: HTTP ${analyzeResponse.status}` };
    }

    const analyzeData = await analyzeResponse.json();
    console.log('Y2Mate analyze response:', JSON.stringify(analyzeData));

    if (analyzeData.mess) {
      return { success: false, error: `Y2Mate error: ${analyzeData.mess}` };
    }

    if (!analyzeData.links || !analyzeData.vid) {
      return { success: false, error: 'Y2Mate: No download links found' };
    }

    // Get the video ID and title
    const videoId = analyzeData.vid;
    const title = analyzeData.title || 'Unknown Title';

    // Find the best MP3 link (prefer 128kbps for speed)
    const mp3Links = analyzeData.links?.mp3 || {};
    let selectedKey: string | null = null;
    let selectedQuality = '';

    // Prefer 128kbps, then any available
    for (const key of Object.keys(mp3Links)) {
      const link = mp3Links[key];
      if (link.q === '128kbps' || link.q === '128') {
        selectedKey = link.k;
        selectedQuality = link.q;
        break;
      }
      if (!selectedKey) {
        selectedKey = link.k;
        selectedQuality = link.q;
      }
    }

    if (!selectedKey) {
      return { success: false, error: 'Y2Mate: No MP3 format available' };
    }

    console.log(`Selected MP3 quality: ${selectedQuality}, key: ${selectedKey}`);

    // Step 2: Convert to get download link
    const convertFormData = new URLSearchParams();
    convertFormData.append('vid', videoId);
    convertFormData.append('k', selectedKey);

    const convertResponse = await fetch(Y2MATE_CONVERT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Origin': 'https://www.y2mate.com',
        'Referer': 'https://www.y2mate.com/',
      },
      body: convertFormData.toString(),
    });

    if (!convertResponse.ok) {
      return { success: false, error: `Y2Mate convert failed: HTTP ${convertResponse.status}` };
    }

    const convertData = await convertResponse.json();
    console.log('Y2Mate convert response:', JSON.stringify(convertData));

    if (convertData.mess) {
      return { success: false, error: `Y2Mate convert error: ${convertData.mess}` };
    }

    if (!convertData.dlink) {
      return { success: false, error: 'Y2Mate: No download link returned' };
    }

    return {
      success: true,
      data: {
        title: convertData.title || title,
        artist: 'Unknown Artist',
        duration: '',
        thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        audioUrl: convertData.dlink,
        platform: 'youtube',
      },
    };
  } catch (error) {
    console.error('Y2Mate error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Y2Mate request failed' };
  }
}

serve(async (req) => {
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
    const isSoundCloud = validUrl.includes('soundcloud.com');

    if (!isYouTube && !isSoundCloud) {
      return new Response(
        JSON.stringify({ success: false, error: 'Only YouTube and SoundCloud URLs are supported' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch metadata first (for YouTube)
    let metadata: { title: string; author: string; thumbnail: string } | null = null;
    if (isYouTube) {
      metadata = await fetchYouTubeMetadata(validUrl);
    }

    // Try Y2Mate API
    const downloadResult = await fetchFromY2Mate(validUrl);

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
        platform: isSoundCloud ? 'soundcloud' : downloadResult.data!.platform,
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
