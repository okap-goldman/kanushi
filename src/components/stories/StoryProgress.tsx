import { useEffect, useState } from "react";
import { cn } from "../../lib/utils";

interface StoryProgressProps {
  count: number;
  activeIndex: number;
  duration?: number;
  onComplete?: () => void;
  isPaused?: boolean;
}

export default function StoryProgress({
  count,
  activeIndex,
  duration = 5000,
  onComplete,
  isPaused = false
}: StoryProgressProps) {
  const [progress, setProgress] = useState<number[]>(Array(count).fill(0));
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);

  // Reset the progress for the active story when the activeIndex changes
  useEffect(() => {
    const newProgress = [...progress];
    
    // Set previous stories to 100%
    for (let i = 0; i < activeIndex; i++) {
      newProgress[i] = 100;
    }
    
    // Set future stories to 0%
    for (let i = activeIndex + 1; i < count; i++) {
      newProgress[i] = 0;
    }
    
    // Set active story to 0% (or keep its progress if partially viewed)
    if (progress[activeIndex] !== 100) {
      newProgress[activeIndex] = 0;
    }
    
    setProgress(newProgress);
  }, [activeIndex, count]);

  // Update progress of the active story
  useEffect(() => {
    if (isPaused) {
      if (timer) {
        clearInterval(timer);
        setTimer(null);
      }
      return;
    }
    
    // If the active story is already complete, call the onComplete handler
    if (progress[activeIndex] >= 100) {
      onComplete?.();
      return;
    }
    
    const interval = duration / 100;
    
    const timerId = setInterval(() => {
      setProgress(prev => {
        const newProgress = [...prev];
        
        if (newProgress[activeIndex] < 100) {
          newProgress[activeIndex] += 1;
          
          // Call onComplete when progress reaches 100%
          if (newProgress[activeIndex] >= 100 && onComplete) {
            onComplete();
          }
        }
        
        return newProgress;
      });
    }, interval);
    
    setTimer(timerId);
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [activeIndex, count, duration, isPaused, onComplete, progress]);

  return (
    <div className="flex w-full gap-1 mb-2 px-2">
      {progress.map((value, index) => (
        <div 
          key={index}
          className={cn(
            "h-1 flex-1 rounded-full overflow-hidden bg-gray-400/30"
          )}
        >
          <div 
            className={cn(
              "h-full bg-white transition-all",
              index < activeIndex ? "w-full" : "w-0"
            )}
            style={{ width: `${index === activeIndex ? value : index < activeIndex ? 100 : 0}%` }}
          />
        </div>
      ))}
    </div>
  );
}