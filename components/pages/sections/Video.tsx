import { Blurs } from '@/components/ui/Blurs';

const VideoSection = () => {
  return (
    <div className="relative z-0 mx-auto hidden max-w-screen-xl px-6 py-40 sm:block sm:px-8">
      <Blurs />
      <div className="overflow-hidden rounded-lg border border-neutral-900">
        <video controls autoPlay muted loop width="100%">
          <source
            src="https://res.cloudinary.com/djp21wtxm/video/upload/v1684478419/landing_juljzq.mp4"
            type="video/webm"
          />
        </video>
      </div>
    </div>
  );
};

export default VideoSection;
