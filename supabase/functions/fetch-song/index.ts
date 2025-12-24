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

// Y2Mate API endpoints (their domains change often, so we try multiple)
const Y2MATE_HOSTS = [
  'https://www.y2mate.com',
  'https://v6.www-y2mate.com',
  'https://v5.www-y2mate.com',
];

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
  const errors: string[] = [];

  // Step 1: Analyze the video URL (try multiple hosts)
  const analyzeFormData = new URLSearchParams();
  analyzeFormData.append('k_query', url);
  analyzeFormData.append('k_page', 'home');
  analyzeFormData.append('hl', 'en');
  analyzeFormData.append('q_auto', '0');

  for (const host of Y2MATE_HOSTS) {
    const analyzeUrl = `${host}/mates/analyzeV2/ajax`;
    const convertUrl = `${host}/mates/convertV2/index`;

    try {
      console.log(`Analyzing URL with Y2Mate host: ${host}`);

      const analyzeResponse = await fetch(analyzeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          // Some hosts block default agents; mimic a browser UA
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Origin': host,
          'Referer': `${host}/`,
        },
        body: analyzeFormData.toString(),
      });

      if (!analyzeResponse.ok) {
        errors.push(`${host}: analyze HTTP ${analyzeResponse.status}`);
        continue;
      }

      const analyzeData = await analyzeResponse.json();
      console.log(`Y2Mate analyze response (${host}):`, JSON.stringify(analyzeData));

      if (analyzeData.mess) {
        errors.push(`${host}: analyze mess ${analyzeData.mess}`);
        continue;
      }

      if (!analyzeData.links || !analyzeData.vid) {
        errors.push(`${host}: analyze missing links/vid`);
        continue;
      }

      const videoId: string = analyzeData.vid;
      const title: string = analyzeData.title || 'Unknown Title';

      // Find a MP3 key (prefer 128kbps)
      const mp3Links = analyzeData.links?.mp3 || {};
      let selectedKey: string | null = null;
      let selectedQuality = '';

      for (const k of Object.keys(mp3Links)) {
        const link = mp3Links[k];
        if (!link?.k) continue;
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
        errors.push(`${host}: no mp3 key`);
        continue;
      }

      console.log(`Selected MP3 quality (${host}): ${selectedQuality}`);

      // Step 2: Convert
      const convertFormData = new URLSearchParams();
      convertFormData.append('vid', videoId);
      convertFormData.append('k', selectedKey);

      const convertResponse = await fetch(convertUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Origin': host,
          'Referer': `${host}/`,
        },
        body: convertFormData.toString(),
      });

      if (!convertResponse.ok) {
        errors.push(`${host}: convert HTTP ${convertResponse.status}`);
        continue;
      }

      const convertData = await convertResponse.json();
      console.log(`Y2Mate convert response (${host}):`, JSON.stringify(convertData));

      if (convertData.mess) {
        errors.push(`${host}: convert mess ${convertData.mess}`);
        continue;
      }

      if (!convertData.dlink) {
        errors.push(`${host}: convert missing dlink`);
        continue;
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
      const msg = error instanceof Error ? error.message : 'unknown error';
      errors.push(`${host}: ${msg}`);
      continue;
    }
  }

  return {
    success: false,
    error: `Y2Mate failed on all hosts. Errors: ${errors.join('; ')}`,
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
