import { useState } from 'react';
import { Avatar } from "../ui/avatar";
import { cn } from "../../lib/utils";

interface StoryCircleProps {
  userId: string;
  username: string;
  profileImage: string;
  hasUnviewedStory: boolean;
  isActive?: boolean;
  onClick: () => void;
}

export default function StoryCircle({
  userId,
  username,
  profileImage,
  hasUnviewedStory,
  isActive = false,
  onClick
}: StoryCircleProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="flex flex-col items-center justify-center cursor-pointer mx-2"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        className={cn(
          "rounded-full p-[2px] mb-1", 
          hasUnviewedStory 
            ? "bg-gradient-to-tr from-purple-500 to-pink-500" 
            : "bg-gray-300",
          isActive && "scale-110 transition-transform duration-200"
        )}
      >
        <div 
          className={cn(
            "rounded-full p-[2px] bg-white",
            isHovered && "scale-105 transition-transform duration-200",
            isActive && "scale-105 transition-transform duration-200"
          )}
        >
          <Avatar 
            className="w-14 h-14 border-2 border-white"
          >
            <img 
              src={profileImage} 
              alt={username} 
              className="w-full h-full object-cover rounded-full"
            />
          </Avatar>
        </div>
      </div>
      <span className="text-xs text-center font-medium truncate w-16">
        {username.length > 10 ? `${username.substring(0, 8)}...` : username}
      </span>
    </div>
  );
}