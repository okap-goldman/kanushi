import { useRef, useEffect, useState } from "react";
import { Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface PostContentProps {
  content: string;
  caption?: string;
  mediaType: "text" | "image" | "video" | "audio";
  isExpanded: boolean;
  setIsExpanded: (value: boolean) => void;
}

export function PostContent({ content, caption, mediaType, isExpanded, setIsExpanded }: PostContentProps) {
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLIFrameElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const audioContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mediaType === "audio") {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting && audioRef.current && isAudioPlaying) {
              audioRef.current.pause();
              setIsAudioPlaying(false);
            }
          });
        },
        {
          threshold: 0.5,
        }
      );

      if (audioContainerRef.current) {
        observer.observe(audioContainerRef.current);
      }

      return () => {
        observer.disconnect();
      };
    }
  }, [mediaType, isAudioPlaying]);

  useEffect(() => {
    if (mediaType !== "video" || !videoContainerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!videoRef.current?.contentWindow) return;

          if (entry.isIntersecting) {
            videoRef.current.contentWindow.postMessage(
              '{"event":"command","func":"playVideo","args":""}',
              "*"
            );
          } else {
            videoRef.current.contentWindow.postMessage(
              '{"event":"command","func":"pauseVideo","args":""}',
              "*"
            );
          }
        });
      },
      {
        threshold: 0.5,
      }
    );

    observer.observe(videoContainerRef.current);

    return () => {
      observer.disconnect();
    };
  }, [mediaType]);

  const toggleAudio = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(content);
      setupAudioEvents();
    }

    if (isAudioPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsAudioPlaying(!isAudioPlaying);
  };

  const setupAudioEvents = () => {
    if (!audioRef.current) return;
    
    audioRef.current.addEventListener('timeupdate', updateProgress);
    audioRef.current.addEventListener('loadedmetadata', () => {
      setDuration(audioRef.current?.duration || 0);
    });
    audioRef.current.addEventListener('ended', () => {
      setIsAudioPlaying(false);
    });
    
    // Initial duration setup
    if (audioRef.current.duration) {
      setDuration(audioRef.current.duration);
    }
  };

  const updateProgress = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };
  
  // Clean up audio when component unmounts
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener('timeupdate', updateProgress);
        audioRef.current.removeEventListener('ended', () => {});
      }
    };
  }, []);

  const renderTruncatedText = (text: string) => {
    if (text.length <= 140 || isExpanded) {
      return <p className="text-sm whitespace-pre-wrap">{text}</p>;
    }
    return (
      <div>
        <p className="text-sm whitespace-pre-wrap">{text.slice(0, 140)}...</p>
        <button
          className="text-sm text-muted-foreground hover:underline"
          onClick={() => setIsExpanded(true)}
        >
          すべて表示
        </button>
      </div>
    );
  };

  const renderMedia = () => {
    switch (mediaType) {
      case "image":
        return (
          <img
            src={content}
            alt="Post content"
            className="w-full h-auto rounded-md object-cover max-h-96"
          />
        );
      case "video":
        return (
          <div ref={videoContainerRef} className="aspect-video w-full">
            <iframe
              ref={videoRef}
              src={`${content}?enablejsapi=1`}
              className="w-full h-full rounded-md"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        );
      case "audio":
        return (
          <div ref={audioContainerRef} className="w-full rounded-md overflow-hidden">
            <Card className="p-4 bg-muted/30">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={toggleAudio}
                >
                  {isAudioPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5 ml-0.5" />
                  )}
                  <span className="sr-only">音声を{isAudioPlaying ? '一時停止' : '再生'}</span>
                </Button>
                <div className="flex-1">
                  <div className="font-medium text-sm">{caption || "Audio"}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full mt-3">
                <input 
                  type="range" 
                  min={0} 
                  max={duration || 100} 
                  value={currentTime} 
                  onChange={handleSliderChange}
                  className="w-full h-1.5 accent-primary cursor-pointer" 
                />
              </div>
            </Card>
          </div>
        );
      case "text":
      default:
        return renderTruncatedText(content);
    }
  };

  return (
    <div className="space-y-4">
      {mediaType === "text" ? (
        renderMedia()
      ) : (
        <>
          {renderMedia()}
          {caption && renderTruncatedText(caption)}
        </>
      )}
    </div>
  );
}