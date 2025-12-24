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

// Cobalt public instance list (community-maintained)
const COBALT_INSTANCE_LIST_URL = 'https://instances.cobalt.best/api';
const COBALT_USER_AGENT = 'lovable-music-app/1.0 (+https://lovable.dev)';

let cachedInstances: { expiresAt: number; instances: string[] } | null = null;

async function getCobaltInstances(): Promise<string[]> {
  const now = Date.now();
  if (cachedInstances && cachedInstances.expiresAt > now) return cachedInstances.instances;

  try {
    const res = await fetch(COBALT_INSTANCE_LIST_URL, {
      headers: { 'User-Agent': COBALT_USER_AGENT, 'Accept': 'application/json' },
    });

    if (!res.ok) throw new Error(`instance list HTTP ${res.status}`);

    const list = await res.json();

    const instances = (Array.isArray(list) ? list : [])
      .filter((i: any) => i?.online === true)
      .filter((i: any) => i?.protocol === 'https')
      .filter((i: any) => i?.services?.youtube === true || i?.services?.['youtube music'] === true)
      .map((i: any) => `${i.protocol}://${i.api}`)
      // Prefer higher score when available
      .sort((a: any, b: any) => (Number(b?.score ?? 0) - Number(a?.score ?? 0)))
      .slice(0, 10);

    if (instances.length === 0) throw new Error('no online instances found');

    cachedInstances = { expiresAt: now + 10 * 60 * 1000, instances };
    return instances;
  } catch (e) {
    console.warn('Failed to fetch Cobalt instance list, using fallback list:', e);

    // Minimal hardcoded fallback (may change/expire)
    const fallback = ['https://cobalt-api.kwiatekmiki.com'].slice(0, 1);
    cachedInstances = { expiresAt: now + 2 * 60 * 1000, instances: fallback };
    return fallback;
  }
}

// Use Cobalt API v10+ format with instance fallback
async function fetchFromCobalt(url: string): Promise<DownloadResponse> {
  const errors: string[] = [];
  const instances = await getCobaltInstances();

  for (const instance of instances) {
    try {
      console.log(`Trying Cobalt instance: ${instance}`);

      const response = await fetch(`${instance}/`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': COBALT_USER_AGENT,
        },
        body: JSON.stringify({
          url,
          videoQuality: '720',
          youtubeVideoCodec: 'h264',
          filenameStyle: 'pretty',
          downloadMode: 'audio',
        }),
      });

      const data = await response.json();
      console.log(`Cobalt response from ${instance}:`, JSON.stringify(data));

      if (data.status === 'error') {
        const errorCode = String(data?.error?.code ?? data?.error ?? 'unknown');

        // Some instances require auth; skip them automatically
        if (errorCode.includes('jwt') || errorCode.includes('auth')) {
          errors.push(`${instance}: ${errorCode}`);
          continue;
        }

        errors.push(`${instance}: ${errorCode}`);
        continue;
      }

      if (data.status === 'tunnel' || data.status === 'redirect') {
        const videoId = extractYouTubeVideoId(url);
        return {
          success: true,
          data: {
            title: 'Unknown Title',
            artist: 'Unknown Artist',
            duration: '',
            thumbnail: videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : '',
            audioUrl: data.url,
            platform: 'youtube',
          },
        };
      }

      if (data.status === 'picker' && Array.isArray(data.picker) && data.picker.length > 0) {
        const audioOption = data.picker.find((p: any) => p?.type === 'audio') || data.picker[0];
        const videoId = extractYouTubeVideoId(url);

        return {
          success: true,
          data: {
            title: 'Unknown Title',
            artist: 'Unknown Artist',
            duration: '',
            thumbnail: videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : '',
            audioUrl: audioOption.url,
            platform: 'youtube',
          },
        };
      }

      errors.push(`${instance}: Unexpected response status: ${data.status}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Cobalt instance ${instance} error:`, errorMsg);
      errors.push(`${instance}: ${errorMsg}`);
    }
  }

  return {
    success: false,
    error: `All Cobalt instances failed. Errors: ${errors.join('; ')}`,
  };
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

    // Try Cobalt API with multiple instances
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
