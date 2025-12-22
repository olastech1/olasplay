import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, artist, type = 'description' } = await req.json();
    
    if (!title) {
      return new Response(
        JSON.stringify({ error: 'Title is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    let systemPrompt: string;
    let userPrompt: string;

    if (type === 'summary') {
      systemPrompt = `You are a music journalist and critic who writes insightful song analyses. Write in a conversational, engaging tone. Format your response with clear sections using line breaks. Do not use markdown headers or bullet points.`;
      
      userPrompt = artist 
        ? `Write a detailed song analysis for "${title}" by ${artist}. Include:

1. MOOD & ATMOSPHERE: Describe the emotional tone and vibe of the song (2-3 sentences)

2. MUSICAL STYLE: Discuss the genre, instrumentation, and production style (2-3 sentences)

3. THEMES: What themes or messages might this song explore based on the title and artist's style (2-3 sentences)

4. WHO WILL LOVE IT: Describe the ideal listener for this track (1-2 sentences)

Keep the total length around 150-200 words. Be specific and evocative.`
        : `Write a detailed song analysis for "${title}". Include mood, musical style, potential themes, and who might enjoy it. Keep it around 150 words.`;
    } else {
      systemPrompt = 'You are a music curator who writes short, catchy descriptions for songs. Keep descriptions under 50 words. Do not use quotes around the description. Be direct and engaging.';
      
      userPrompt = artist 
        ? `Write a short, engaging description (2-3 sentences max) for a song titled "${title}" by ${artist}. Focus on the mood, genre appeal, and what makes it worth listening to. Be concise and catchy.`
        : `Write a short, engaging description (2-3 sentences max) for a song titled "${title}". Focus on the mood, genre appeal, and what makes it worth listening to. Be concise and catchy.`;
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded, please try again later' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('Failed to generate content');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim() || '';

    return new Response(
      JSON.stringify(type === 'summary' ? { summary: content } : { description: content }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating description:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
