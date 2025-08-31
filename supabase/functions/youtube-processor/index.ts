import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, youtube_url, format = 'mp4', quality = '720p' } = await req.json();
    
    console.log('YouTube processor called with:', { action, youtube_url, format, quality });

    if (action === 'get_video_info') {
      return await getVideoInfo(youtube_url);
    } else if (action === 'download_video') {
      return await initiateDownload(youtube_url, format, quality);
    } else {
      return new Response(JSON.stringify({ error: 'Invalid action' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error in youtube-processor function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function getVideoInfo(youtubeUrl: string) {
  try {
    // Extract video ID from URL
    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
      throw new Error('Invalid YouTube URL');
    }

    const apiKey = Deno.env.get('YOUTUBE_API_KEY');
    if (!apiKey) {
      throw new Error('YouTube API key not configured');
    }

    // Fetch video details from YouTube Data API
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoId}&key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      throw new Error('Video not found');
    }

    const video = data.items[0];
    const snippet = video.snippet;
    const contentDetails = video.contentDetails;
    const statistics = video.statistics;

    // Convert ISO 8601 duration to readable format
    const duration = parseDuration(contentDetails.duration);
    const views = formatViews(statistics.viewCount);

    const videoData = {
      video_id: videoId,
      title: snippet.title,
      thumbnail_url: snippet.thumbnails.maxres?.url || snippet.thumbnails.high?.url || snippet.thumbnails.default?.url,
      duration,
      channel_name: snippet.channelTitle,
      views,
      description: snippet.description,
    };

    return new Response(JSON.stringify({ success: true, video: videoData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error getting video info:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function initiateDownload(youtubeUrl: string, format: string, quality: string) {
  try {
    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
      throw new Error('Invalid YouTube URL');
    }

    // Create download request in database
    const { data: downloadRequest, error } = await supabase
      .from('download_requests')
      .insert({
        youtube_url: youtubeUrl,
        video_id: videoId,
        format,
        quality,
        status: 'pending',
        progress: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      throw new Error('Failed to create download request');
    }

    // Start background processing
    processDownloadInBackground(downloadRequest.id, youtubeUrl, format, quality);

    return new Response(JSON.stringify({ 
      success: true, 
      download_id: downloadRequest.id,
      message: 'Download initiated successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error initiating download:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

function processDownloadInBackground(downloadId: string, youtubeUrl: string, format: string, quality: string) {
  // Simulate download process with progress updates
  setTimeout(async () => {
    try {
      // Update progress periodically
      const progressSteps = [20, 40, 60, 80, 100];
      
      for (const progress of progressSteps) {
        await supabase
          .from('download_requests')
          .update({ 
            progress,
            status: progress === 100 ? 'completed' : 'processing',
            completed_at: progress === 100 ? new Date().toISOString() : null,
            download_url: progress === 100 ? `https://example.com/downloads/${downloadId}.${format}` : null
          })
          .eq('id', downloadId);

        // Wait between updates
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error('Error processing download:', error);
      await supabase
        .from('download_requests')
        .update({ 
          status: 'failed',
          error_message: error.message 
        })
        .eq('id', downloadId);
    }
  }, 1000);
}

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return null;
}

function parseDuration(duration: string): string {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '0:00';

  const hours = parseInt(match[1]) || 0;
  const minutes = parseInt(match[2]) || 0;
  const seconds = parseInt(match[3]) || 0;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function formatViews(views: string): string {
  const num = parseInt(views);
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B';
  } else if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}