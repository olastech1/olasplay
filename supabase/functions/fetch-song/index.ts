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

// RapidAPI YouTube MP3 endpoint
const RAPIDAPI_HOST = 'youtube-mp36.p.rapidapi.com';

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

// Use RapidAPI YouTube MP3 to get download link
async function fetchFromRapidAPI(videoId: string): Promise<DownloadResponse> {
  const rapidApiKey = Deno.env.get('RAPIDAPI_KEY');

  if (!rapidApiKey) {
    return { success: false, error: 'RAPIDAPI_KEY not configured' };
  }

  const maxRetries = 5;
  let lastError = '';

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`RapidAPI attempt ${attempt + 1} for video ID: ${videoId}`);

      const response = await fetch(
        `https://${RAPIDAPI_HOST}/dl?id=${videoId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-rapidapi-host': RAPIDAPI_HOST,
            'x-rapidapi-key': rapidApiKey,
          },
        }
      );

      if (!response.ok) {
        lastError = `HTTP ${response.status}`;
        console.error(`RapidAPI HTTP error: ${response.status}`);
        continue;
      }

      const data = await response.json();
      console.log('RapidAPI response:', JSON.stringify(data));

      if (data.status === 'ok' && data.link) {
        return {
          success: true,
          data: {
            title: data.title || 'Unknown Title',
            artist: 'Unknown Artist',
            duration: data.duration || '',
            thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
            audioUrl: data.link,
            platform: 'youtube',
          },
        };
      }

      if (data.status === 'processing') {
        console.log('RapidAPI: still processing, waiting 1.5s...');
        await new Promise((resolve) => setTimeout(resolve, 1500));
        continue;
      }

      if (data.status === 'fail') {
        lastError = data.msg || 'Conversion failed';
        break;
      }

      lastError = data.msg || 'Unknown response status';
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Request failed';
      console.error('RapidAPI error:', lastError);
    }
  }

  return { success: false, error: `RapidAPI failed: ${lastError}` };
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
    const isYouTube =
      validUrl.includes('youtube.com') ||
      validUrl.includes('youtu.be') ||
      validUrl.includes('music.youtube.com');
    const isSoundCloud = validUrl.includes('soundcloud.com');

    if (!isYouTube && !isSoundCloud) {
      return new Response(
        JSON.stringify({ success: false, error: 'Only YouTube and SoundCloud URLs are supported' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract video ID
    const videoId = extractYouTubeVideoId(validUrl);
    if (!videoId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Could not extract video ID from URL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch metadata first (for YouTube)
    let metadata: { title: string; author: string; thumbnail: string } | null = null;
    if (isYouTube) {
      metadata = await fetchYouTubeMetadata(validUrl);
    }

    // Try RapidAPI
    const downloadResult = await fetchFromRapidAPI(videoId);

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
