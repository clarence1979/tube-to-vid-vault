import { YouTubeDownloader } from '@/components/YouTubeDownloader';
import heroBackground from '@/assets/hero-background.jpg';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-background relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-5"
        style={{ backgroundImage: `url(${heroBackground})` }}
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/90 to-background/95" />
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
            YouTube to MP4
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Download your favorite YouTube videos in high quality. Fast, free, and easy to use.
          </p>
        </div>

        {/* Main Downloader */}
        <div className="flex justify-center">
          <YouTubeDownloader />
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center text-muted-foreground">
          <p className="text-sm">
            Please respect copyright laws and YouTube's terms of service when downloading content.
          </p>
          <p className="text-xs mt-2 opacity-75">
            This is a demonstration interface. Actual downloading requires proper backend implementation.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Index;