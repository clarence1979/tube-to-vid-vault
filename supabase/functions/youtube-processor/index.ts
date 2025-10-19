import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }

  try {
    const { action, youtube_url, format = 'mp4', quality = '720p' } = await req.json();

    console.log('YouTube processor called with:', { action, youtube_url, format, quality });

    if (action === 'get_video_info') {
      return await getVideoInfo(youtube_url);
    } else if (action === 'download_video') {
      return await downloadVideo(youtube_url, format, quality);
    } else {
      return new Response(JSON.stringify({ success: false, error: 'Invalid action' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error in youtube-processor function:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function getVideoInfo(youtubeUrl: string) {
  try {
    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
      throw new Error('Invalid YouTube URL');
    }

    const apiKey = Deno.env.get('YOUTUBE_API_KEY');
    if (!apiKey) {
      throw new Error('YouTube API key not configured');
    }

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
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function downloadVideo(youtubeUrl: string, format: string, quality: string) {
  try {
    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
      throw new Error('Invalid YouTube URL');
    }

    let videoTitle = `video_${videoId}`;

    const ytApiKey = Deno.env.get('YOUTUBE_API_KEY');
    if (ytApiKey) {
      try {
        const response = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${ytApiKey}`
        );

        if (response.ok) {
          const data = await response.json();
          if (data.items && data.items.length > 0) {
            const video = data.items[0];
            videoTitle = video.snippet.title.replace(/[^a-z0-9\s]/gi, '_').replace(/\s+/g, '_').toLowerCase();
          }
        }
      } catch (apiError) {
        console.log('Failed to fetch video title:', apiError);
      }
    }

    const downloadApiUrl = `https://youtube-video-download-info.p.rapidapi.com/dl?id=${videoId}`;

    try {
      const rapidApiKey = Deno.env.get('RAPIDAPI_KEY');
      if (rapidApiKey) {
        const downloadResponse = await fetch(downloadApiUrl, {
          method: 'GET',
          headers: {
            'X-RapidAPI-Key': rapidApiKey,
            'X-RapidAPI-Host': 'youtube-video-download-info.p.rapidapi.com'
          }
        });

        if (downloadResponse.ok) {
          const downloadData = await downloadResponse.json();

          if (downloadData.link && Array.isArray(downloadData.link)) {
            let selectedLink = null;

            if (format === 'mp3') {
              selectedLink = downloadData.link.find((link: any) =>
                link.f === 'mp3' || link.q === 'highestaudio'
              );
            } else {
              const qualityMap: { [key: string]: string } = {
                '1080p': '1080',
                '720p': '720',
                '480p': '480',
                '360p': '360'
              };

              const targetQuality = qualityMap[quality] || '720';
              selectedLink = downloadData.link.find((link: any) =>
                link.q === targetQuality || link.q === `${targetQuality}p`
              );

              if (!selectedLink) {
                selectedLink = downloadData.link.find((link: any) =>
                  link.f === 'mp4' && (link.q === '720' || link.q === '720p')
                );
              }

              if (!selectedLink) {
                selectedLink = downloadData.link.find((link: any) => link.f === 'mp4');
              }
            }

            if (selectedLink && selectedLink.link) {
              return new Response(JSON.stringify({
                success: true,
                download_url: selectedLink.link,
                filename: `${videoTitle}.${format}`,
                video_id: videoId,
                title: videoTitle
              }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              });
            }
          }
        }
      }
    } catch (rapidError) {
      console.log('RapidAPI failed, using fallback:', rapidError);
    }

    const invidousInstances = [
      'https://invidious.privacyredirect.com',
      'https://yewtu.be',
      'https://invidious.snopyta.org'
    ];

    for (const instance of invidousInstances) {
      try {
        const invidiousUrl = `${instance}/api/v1/videos/${videoId}`;
        const invidiousResponse = await fetch(invidiousUrl);

        if (invidiousResponse.ok) {
          const invidiousData = await invidiousResponse.json();

          let selectedFormat = null;

          if (format === 'mp3') {
            const audioFormats = invidiousData.adaptiveFormats?.filter((f: any) =>
              f.type?.includes('audio')
            ) || [];
            selectedFormat = audioFormats[0];
          } else {
            const videoFormats = invidiousData.formatStreams || [];

            const qualityMap: { [key: string]: string } = {
              '1080p': '1080p',
              '720p': '720p',
              '480p': '480p',
              '360p': '360p'
            };

            selectedFormat = videoFormats.find((f: any) =>
              f.qualityLabel === qualityMap[quality] || f.quality === quality
            );

            if (!selectedFormat && videoFormats.length > 0) {
              selectedFormat = videoFormats[0];
            }
          }

          if (selectedFormat && selectedFormat.url) {
            return new Response(JSON.stringify({
              success: true,
              download_url: selectedFormat.url,
              filename: `${videoTitle}.${format}`,
              video_id: videoId,
              title: videoTitle
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }
      } catch (invidiousError) {
        console.log(`Failed to fetch from ${instance}:`, invidiousError);
        continue;
      }
    }

    throw new Error('Unable to generate download link. Please try again later or use a different video.');
  } catch (error) {
    console.error('Error downloading video:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
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
