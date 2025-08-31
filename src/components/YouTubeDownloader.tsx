import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { VideoInfo } from './VideoInfo';
import { Download, Youtube, Link, Sparkles } from 'lucide-react';

interface VideoData {
  title: string;
  thumbnail: string;
  duration: string;
  channelName: string;
  views: string;
}

export const YouTubeDownloader = () => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  const isValidYouTubeUrl = (url: string) => {
    const patterns = [
      /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/,
      /^https?:\/\/youtu\.be\/[\w-]+/,
      /^https?:\/\/(www\.)?youtube\.com\/embed\/[\w-]+/
    ];
    return patterns.some(pattern => pattern.test(url));
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      toast({
        title: "Error",
        description: "Please enter a YouTube URL",
        variant: "destructive",
      });
      return;
    }

    if (!isValidYouTubeUrl(url)) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid YouTube URL",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setProgress(0);

    // Simulate API call to get video info
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    setTimeout(() => {
      setProgress(100);
      // Mock video data - in real app this would come from YouTube API
      setVideoData({
        title: "Sample YouTube Video Title - Amazing Content!",
        thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
        duration: "3:42",
        channelName: "Sample Channel",
        views: "1.2M"
      });
      setIsLoading(false);
      toast({
        title: "Video Found!",
        description: "Video information loaded successfully",
      });
    }, 2000);
  };

  const handleDownload = async (format: 'mp4' | 'mp3') => {
    setIsDownloading(true);
    setProgress(0);

    // Simulate download progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        return prev + 5;
      });
    }, 100);

    setTimeout(() => {
      setProgress(100);
      setIsDownloading(false);
      toast({
        title: "Download Complete!",
        description: `Video downloaded as ${format.toUpperCase()} format`,
      });
      
      // Reset after successful download
      setTimeout(() => {
        setVideoData(null);
        setUrl('');
        setProgress(0);
      }, 2000);
    }, 3000);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Main Input Card */}
      <Card className="bg-gradient-card shadow-card border-0 backdrop-blur-sm">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="p-3 bg-gradient-primary rounded-full shadow-elegant">
              <Youtube className="h-8 w-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              YouTube Downloader
            </CardTitle>
          </div>
          <p className="text-muted-foreground">
            Enter a YouTube URL to download your favorite videos
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleUrlSubmit} className="space-y-4">
            <div className="relative">
              <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isLoading || isDownloading}
                className="pl-10 h-12 text-lg transition-smooth focus:shadow-elegant"
              />
            </div>
            
            {isLoading && (
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-muted-foreground text-center">
                  Fetching video information...
                </p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading || isDownloading}
              className="w-full h-12 text-lg font-semibold bg-gradient-primary hover:shadow-hover transition-smooth group"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground mr-2" />
                  Analyzing Video...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2 group-hover:animate-pulse" />
                  Get Video Info
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Video Info and Download */}
      {videoData && (
        <VideoInfo
          videoData={videoData}
          isDownloading={isDownloading}
          progress={progress}
          onDownload={handleDownload}
        />
      )}

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <Card className="bg-gradient-card shadow-card border-0 hover:shadow-hover transition-smooth">
          <CardContent className="p-6 text-center">
            <Download className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-semibold mb-2">High Quality</h3>
            <p className="text-sm text-muted-foreground">
              Download videos in HD quality up to 1080p
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-card shadow-card border-0 hover:shadow-hover transition-smooth">
          <CardContent className="p-6 text-center">
            <Youtube className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Fast Processing</h3>
            <p className="text-sm text-muted-foreground">
              Quick video analysis and download preparation
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-card shadow-card border-0 hover:shadow-hover transition-smooth">
          <CardContent className="p-6 text-center">
            <Sparkles className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-semibent mb-2">Multiple Formats</h3>
            <p className="text-sm text-muted-foreground">
              Support for MP4 video and MP3 audio formats
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};