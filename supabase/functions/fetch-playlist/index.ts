import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PlaylistRequest {
  url: string;
}

interface VideoItem {
  videoId: string;
  title: string;
  thumbnail: string;
  author: string;
}

interface PlaylistResponse {
  success: boolean;
  data?: {
    playlistTitle: string;
    videos: VideoItem[];
  };
  error?: string;
}

// Extract playlist ID from YouTube URL
function extractPlaylistId(url: string): string | null {
  const match = url.match(/[?&]list=([^&]+)/);
  return match ? match[1] : null;
}

// Fetch playlist data using YouTube's oEmbed and page scraping
async function fetchPlaylistVideos(playlistId: string): Promise<PlaylistResponse> {
  try {
    console.log('Fetching playlist:', playlistId);

    // Use YouTube's internal API (no key needed, works for public playlists)
    const playlistUrl = `https://www.youtube.com/playlist?list=${playlistId}`;
    
    const response = await fetch(playlistUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!response.ok) {
      return { success: false, error: `Failed to fetch playlist: HTTP ${response.status}` };
    }

    const html = await response.text();

    // Extract ytInitialData from the page
    const dataMatch = html.match(/var ytInitialData = ({.+?});<\/script>/);
    if (!dataMatch) {
      return { success: false, error: 'Could not parse playlist data' };
    }

    const ytData = JSON.parse(dataMatch[1]);

    // Navigate to playlist contents
    const playlistContents =
      ytData?.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents?.[0]?.playlistVideoListRenderer?.contents;

    if (!playlistContents || !Array.isArray(playlistContents)) {
      return { success: false, error: 'Could not find playlist videos' };
    }

    // Extract playlist title
    const playlistTitle =
      ytData?.metadata?.playlistMetadataRenderer?.title || 'Unknown Playlist';

    // Extract video items
    const videos: VideoItem[] = [];

    for (const item of playlistContents) {
      const videoRenderer = item?.playlistVideoRenderer;
      if (!videoRenderer) continue;

      const videoId = videoRenderer.videoId;
      if (!videoId) continue;

      const title =
        videoRenderer.title?.runs?.[0]?.text ||
        videoRenderer.title?.simpleText ||
        'Unknown Title';

      const thumbnail =
        videoRenderer.thumbnail?.thumbnails?.[0]?.url ||
        `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

      const author =
        videoRenderer.shortBylineText?.runs?.[0]?.text ||
        videoRenderer.ownerText?.runs?.[0]?.text ||
        'Unknown Artist';

      videos.push({
        videoId,
        title,
        thumbnail,
        author,
      });
    }

    if (videos.length === 0) {
      return { success: false, error: 'No videos found in playlist' };
    }

    console.log(`Found ${videos.length} videos in playlist: ${playlistTitle}`);

    return {
      success: true,
      data: {
        playlistTitle,
        videos,
      },
    };
  } catch (error) {
    console.error('Playlist fetch error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch playlist',
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url }: PlaylistRequest = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing playlist URL:', url);

    // Extract playlist ID
    const playlistId = extractPlaylistId(url);

    if (!playlistId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Could not extract playlist ID from URL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await fetchPlaylistVideos(playlistId);

    return new Response(
      JSON.stringify(result),
      {
        status: result.success ? 200 : 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Processing failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
