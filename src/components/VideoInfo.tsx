import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Download, Play, Clock, Eye, User } from 'lucide-react';
import { useState } from 'react';

interface VideoData {
  video_id: string;
  title: string;
  thumbnail_url: string;
  duration: string;
  channel_name: string;
  views: string;
  description?: string;
}

interface VideoInfoProps {
  videoData: VideoData;
  isDownloading: boolean;
  progress: number;
  onDownload: (format: 'mp4' | 'mp3', quality?: string) => void;
}

export const VideoInfo = ({ videoData, isDownloading, progress, onDownload }: VideoInfoProps) => {
  const [selectedQuality, setSelectedQuality] = useState('720p');

  return (
    <Card className="bg-gradient-card shadow-card border-0 overflow-hidden animate-pulse-glow">
      <CardContent className="p-0">
        {/* Video Preview */}
        <div className="relative aspect-video bg-muted">
          <img
            src={videoData.thumbnail_url}
            alt={videoData.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to a placeholder if image fails to load
              e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='360' viewBox='0 0 640 360'%3E%3Crect width='640' height='360' fill='%23f3f4f6'/%3E%3Ctext x='320' y='180' text-anchor='middle' dy='0.35em' fill='%236b7280' font-family='Arial, sans-serif' font-size='24'%3EVideo Thumbnail%3C/text%3E%3C/svg%3E";
            }}
          />
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <Play className="h-16 w-16 text-white drop-shadow-lg" />
          </div>
          <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-sm font-medium">
            {videoData.duration}
          </div>
        </div>

        {/* Video Info */}
        <div className="p-6 space-y-4">
          <div className="space-y-3">
            <h2 className="text-xl font-bold leading-tight line-clamp-2">
              {videoData.title}
            </h2>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span>{videoData.channel_name}</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>{videoData.views} views</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{videoData.duration}</span>
              </div>
            </div>
          </div>

          {/* Download Progress */}
          {isDownloading && (
            <div className="space-y-2">
              <Progress value={progress} className="h-3" />
              <p className="text-sm text-muted-foreground text-center">
                Downloading... {progress}%
              </p>
            </div>
          )}

          {/* Download Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => onDownload('mp4', selectedQuality)}
              disabled={isDownloading}
              className="bg-gradient-primary hover:shadow-hover transition-smooth group"
            >
              <Download className="h-4 w-4 mr-2 group-hover:animate-bounce" />
              Download MP4
            </Button>
            
            <Button
              onClick={() => onDownload('mp3', selectedQuality)}
              disabled={isDownloading}
              variant="outline"
              className="hover:bg-primary hover:text-primary-foreground transition-smooth group"
            >
              <Download className="h-4 w-4 mr-2 group-hover:animate-bounce" />
              Download MP3
            </Button>
          </div>

          {/* Quality Options */}
          <div className="flex flex-wrap gap-2 pt-2">
            <span className="text-sm text-muted-foreground">Quality:</span>
            {['1080p', '720p', '480p', '360p'].map((quality) => (
              <button
                key={quality}
                onClick={() => setSelectedQuality(quality)}
                className={`px-2 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                  selectedQuality === quality
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-primary hover:text-primary-foreground'
                }`}
              >
                {quality}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};