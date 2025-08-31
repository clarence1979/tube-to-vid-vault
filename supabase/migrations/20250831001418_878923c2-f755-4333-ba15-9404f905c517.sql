-- Create download_requests table for YouTube downloader
CREATE TABLE public.download_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  youtube_url TEXT NOT NULL,
  video_id TEXT NOT NULL,
  title TEXT,
  thumbnail_url TEXT,
  duration TEXT,
  channel_name TEXT,
  views TEXT,
  format TEXT NOT NULL CHECK (format IN ('mp4', 'mp3')),
  quality TEXT CHECK (quality IN ('1080p', '720p', '480p', '360p')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  download_url TEXT,
  file_size BIGINT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.download_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Users can view their own download requests" 
ON public.download_requests 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own download requests" 
ON public.download_requests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own download requests" 
ON public.download_requests 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own download requests" 
ON public.download_requests 
FOR DELETE 
USING (auth.uid() = user_id);

-- Allow anonymous users (for demo purposes)
CREATE POLICY "Anonymous users can create download requests" 
ON public.download_requests 
FOR INSERT 
WITH CHECK (user_id IS NULL);

CREATE POLICY "Anonymous users can view download requests" 
ON public.download_requests 
FOR SELECT 
USING (user_id IS NULL);

CREATE POLICY "Anonymous users can update download requests" 
ON public.download_requests 
FOR UPDATE 
USING (user_id IS NULL);

-- Create index for better performance
CREATE INDEX idx_download_requests_user_id ON public.download_requests(user_id);
CREATE INDEX idx_download_requests_video_id ON public.download_requests(video_id);
CREATE INDEX idx_download_requests_status ON public.download_requests(status);
CREATE INDEX idx_download_requests_created_at ON public.download_requests(created_at DESC);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_download_requests_updated_at
BEFORE UPDATE ON public.download_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();