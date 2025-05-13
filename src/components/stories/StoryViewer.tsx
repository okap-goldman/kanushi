import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent } from "../ui/dialog";
import { Avatar } from "../ui/avatar";
import { cn } from "../../lib/utils";
import StoryProgress from "./StoryProgress";
import { X } from "lucide-react";

interface Story {
  id: string;
  userId: string;
  username: string;
  profileImage: string;
  mediaUrl: string;
  contentType: "image" | "video";
  caption?: string;
  createdAt: string;
}

interface UserStories {
  userId: string;
  username: string;
  profileImage: string;
  stories: Story[];
}

interface StoryViewerProps {
  userStories: UserStories[];
  initialUserIndex?: number;
  initialStoryIndex?: number;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onStoryView?: (storyId: string) => void;
}

export default function StoryViewer({
  userStories,
  initialUserIndex = 0,
  initialStoryIndex = 0,
  isOpen,
  onOpenChange,
  onStoryView
}: StoryViewerProps) {
  const [activeUserIndex, setActiveUserIndex] = useState(initialUserIndex);
  const [activeStoryIndex, setActiveStoryIndex] = useState(initialStoryIndex);
  const [isPaused, setIsPaused] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const activeUser = userStories[activeUserIndex];
  const activeStory = activeUser?.stories[activeStoryIndex];

  // Reset to initial indices when dialog is opened
  useEffect(() => {
    if (isOpen) {
      setActiveUserIndex(initialUserIndex);
      setActiveStoryIndex(initialStoryIndex);
      setIsPaused(false);
    }
  }, [isOpen, initialUserIndex, initialStoryIndex]);

  // Notify when a story is viewed
  useEffect(() => {
    if (isOpen && activeStory && onStoryView) {
      onStoryView(activeStory.id);
    }
  }, [isOpen, activeStory, activeUserIndex, activeStoryIndex, onStoryView]);

  // Auto-play videos when they become active
  useEffect(() => {
    if (activeStory?.contentType === "video" && videoRef.current && !isPaused) {
      videoRef.current.play().catch(error => console.error("Failed to play video:", error));
    }
  }, [activeStory, isPaused]);

  const goToNextStory = () => {
    if (!activeUser) return;
    
    if (activeStoryIndex < activeUser.stories.length - 1) {
      // Go to next story of the same user
      setActiveStoryIndex(activeStoryIndex + 1);
    } else if (activeUserIndex < userStories.length - 1) {
      // Go to first story of the next user
      setActiveUserIndex(activeUserIndex + 1);
      setActiveStoryIndex(0);
    } else {
      // End of all stories, close the viewer
      onOpenChange(false);
    }
  };

  const goToPreviousStory = () => {
    if (activeStoryIndex > 0) {
      // Go to previous story of the same user
      setActiveStoryIndex(activeStoryIndex - 1);
    } else if (activeUserIndex > 0) {
      // Go to last story of the previous user
      setActiveUserIndex(activeUserIndex - 1);
      setActiveStoryIndex(userStories[activeUserIndex - 1].stories.length - 1);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touchX = e.touches[0].clientX;
    const screenWidth = window.innerWidth;
    
    if (touchX < screenWidth / 2) {
      // Left side - go to previous story
      goToPreviousStory();
    } else {
      // Right side - go to next story
      goToNextStory();
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const clickX = e.clientX;
    const screenWidth = window.innerWidth;
    
    if (clickX < screenWidth / 3) {
      // Left side - go to previous story
      goToPreviousStory();
    } else if (clickX > (screenWidth * 2) / 3) {
      // Right side - go to next story
      goToNextStory();
    } else {
      // Middle - pause/play
      setIsPaused(!isPaused);
    }
  };

  if (!activeUser || !activeStory) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-md w-full h-[calc(100vh-4rem)] p-0 rounded-xl overflow-hidden bg-black text-white"
        onTouchStart={handleTouchStart}
        onMouseDown={handleMouseDown}
      >
        <div className="relative h-full flex flex-col">
          {/* Close button */}
          <button 
            className="absolute top-4 right-4 z-50 text-white"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-6 w-6" />
          </button>
          
          {/* Progress bars */}
          <div className="absolute top-2 left-0 right-0 z-40">
            <StoryProgress 
              count={activeUser.stories.length}
              activeIndex={activeStoryIndex}
              onComplete={goToNextStory}
              isPaused={isPaused}
            />
          </div>
          
          {/* User info */}
          <div className="absolute top-6 left-4 right-4 z-40 flex items-center space-x-2">
            <Avatar className="h-10 w-10 border-2 border-white">
              <img src={activeUser.profileImage} alt={activeUser.username} />
            </Avatar>
            <div>
              <div className="font-semibold">{activeUser.username}</div>
              <div className="text-xs opacity-80">
                {new Date(activeStory.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
          
          {/* Story content */}
          <div className="flex-1 flex items-center justify-center h-full w-full bg-neutral-950">
            {activeStory.contentType === "image" ? (
              <img 
                src={activeStory.mediaUrl} 
                alt="Story"
                className="h-full w-full object-contain"
              />
            ) : (
              <video 
                ref={videoRef}
                src={activeStory.mediaUrl}
                className="h-full w-full object-contain"
                playsInline
                muted={false}
                controls={false}
                loop={false}
                onEnded={goToNextStory}
              />
            )}
            
            {/* Caption */}
            {activeStory.caption && (
              <div className="absolute bottom-8 left-0 w-full px-4 py-2 text-center">
                <p className="text-white text-base font-medium drop-shadow-lg">
                  {activeStory.caption}
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}