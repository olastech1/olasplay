import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Y2Mate hosts to test
const Y2MATE_HOSTS = [
  'https://www.y2mate.com',
  'https://v6.www-y2mate.com',
  'https://v5.www-y2mate.com',
];

// Test URL (a popular short video for quick testing)
const TEST_VIDEO_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

interface HealthCheckResult {
  host: string;
  status: 'ok' | 'error';
  latencyMs: number;
  error?: string;
}

async function testHost(host: string): Promise<HealthCheckResult> {
  const startTime = Date.now();
  const analyzeUrl = `${host}/mates/analyzeV2/ajax`;

  try {
    const formData = new URLSearchParams();
    formData.append('k_query', TEST_VIDEO_URL);
    formData.append('k_page', 'home');
    formData.append('hl', 'en');
    formData.append('q_auto', '0');

    const response = await fetch(analyzeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Origin': host,
        'Referer': `${host}/`,
      },
      body: formData.toString(),
    });

    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      return { host, status: 'error', latencyMs, error: `HTTP ${response.status}` };
    }

    const data = await response.json();

    if (data.mess) {
      return { host, status: 'error', latencyMs, error: data.mess };
    }

    if (!data.links || !data.vid) {
      return { host, status: 'error', latencyMs, error: 'No links/vid in response' };
    }

    // Check if mp3 links exist
    const mp3Links = data.links?.mp3 || {};
    if (Object.keys(mp3Links).length === 0) {
      return { host, status: 'error', latencyMs, error: 'No MP3 formats available' };
    }

    return { host, status: 'ok', latencyMs };
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    return {
      host,
      status: 'error',
      latencyMs,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting provider health check...');

    // Test all hosts in parallel
    const results = await Promise.all(Y2MATE_HOSTS.map(testHost));

    console.log('Health check results:', JSON.stringify(results));

    // Find the first working host (prefer by latency)
    const workingHosts = results
      .filter((r) => r.status === 'ok')
      .sort((a, b) => a.latencyMs - b.latencyMs);

    const bestHost = workingHosts[0]?.host || null;

    console.log('Best working host:', bestHost);

    // Save to database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Upsert the cached host into site_settings
    const { error: upsertError } = await supabase
      .from('site_settings')
      .upsert(
        {
          key: 'y2mate_cached_host',
          value: bestHost || '',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      );

    if (upsertError) {
      console.error('Failed to save cached host:', upsertError);
    }

    // Also save the full health report
    const { error: reportError } = await supabase
      .from('site_settings')
      .upsert(
        {
          key: 'y2mate_health_report',
          value: JSON.stringify({
            checkedAt: new Date().toISOString(),
            results,
            bestHost,
          }),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      );

    if (reportError) {
      console.error('Failed to save health report:', reportError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        bestHost,
        results,
        checkedAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Health check error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Health check failed',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
