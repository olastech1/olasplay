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

// Use Cobalt API (free, uses yt-dlp under the hood)
async function fetchFromCobalt(url: string): Promise<DownloadResponse> {
  try {
    console.log('Fetching from Cobalt API for URL:', url);

    // Cobalt API - free and open source
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
    console.log('Cobalt API response:', JSON.stringify(data));

    if (data.status === 'error') {
      return { success: false, error: data.text || 'Failed to process URL' };
    }

    if (data.status === 'redirect' || data.status === 'stream') {
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

    if (data.status === 'picker' && data.picker && data.picker.length > 0) {
      // For playlists or multiple options, take the first audio
      const audioOption = data.picker.find((p: any) => p.type === 'audio') || data.picker[0];
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

    return { success: false, error: 'Unexpected response from Cobalt API' };
  } catch (error) {
    console.error('Cobalt API error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Download failed' };
  }
}

// Alternative: Use a different free service if Cobalt fails
async function fetchFromAlternativeService(url: string): Promise<DownloadResponse> {
  try {
    const videoId = extractYouTubeVideoId(url);
    if (!videoId) {
      return { success: false, error: 'Could not extract video ID' };
    }

    console.log('Trying alternative service for video ID:', videoId);

    // Try y2mate-style API (many free clones available)
    const response = await fetch('https://api.vevioz.com/api/button/mp3/' + videoId);
    
    if (!response.ok) {
      return { success: false, error: 'Alternative service unavailable' };
    }

    const html = await response.text();
    
    // Extract download link from HTML response
    const linkMatch = html.match(/href="(https:\/\/[^"]+\.mp3[^"]*)"/);
    
    if (linkMatch && linkMatch[1]) {
      return {
        success: true,
        data: {
          title: 'Unknown Title',
          artist: 'Unknown Artist',
          duration: '',
          thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          audioUrl: linkMatch[1],
          platform: 'youtube',
        },
      };
    }

    return { success: false, error: 'Could not extract download link' };
  } catch (error) {
    console.error('Alternative service error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Download failed' };
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

    // Try Cobalt API first (free, uses yt-dlp)
    let downloadResult = await fetchFromCobalt(validUrl);

    // If Cobalt fails for YouTube, try alternative service
    if (!downloadResult.success && isYouTube) {
      console.log('Cobalt failed, trying alternative service...');
      downloadResult = await fetchFromAlternativeService(validUrl);
    }

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
