import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Message } from "@/lib/messageService";
import { formatRelativeTime } from "@/lib/utils";

interface MessageItemProps {
  message: Message;
  isCurrentUser: boolean;
}

export function MessageItem({ message, isCurrentUser }: MessageItemProps) {
  const [formattedContent, setFormattedContent] = useState(message.content);
  
  // Process message to handle markdown formatting
  useEffect(() => {
    // Basic Markdown-like formatting
    let formatted = message.content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
      .replace(/`(.*?)`/g, '<code>$1</code>') // Inline code
      .replace(/\n/g, '<br/>'); // Line breaks
    
    setFormattedContent(formatted);
  }, [message.content]);

  return (
    <div className={cn(
      "flex gap-2 max-w-[80%] mb-2",
      isCurrentUser ? "ml-auto flex-row-reverse" : "mr-auto"
    )}>
      {!isCurrentUser && (
        <Avatar className="h-8 w-8 mt-1">
          <AvatarImage src={message.sender?.image} />
          <AvatarFallback>
            {message.sender?.name.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className="flex flex-col">
        <div className={cn(
          "px-3 py-2 rounded-xl text-sm",
          isCurrentUser 
            ? "bg-blue-500 text-white rounded-tr-none" 
            : "bg-gray-200 text-gray-900 rounded-tl-none"
        )}>
          {message.content_type === 'text' && (
            <div dangerouslySetInnerHTML={{ __html: formattedContent }} />
          )}
          
          {message.content_type === 'image' && (
            <div className="flex flex-col gap-2">
              <img 
                src={message.media_url || ''} 
                alt="Image message" 
                className="max-w-full rounded-md"
              />
              {message.content && (
                <div className="mt-1" dangerouslySetInnerHTML={{ __html: formattedContent }} />
              )}
            </div>
          )}
          
          {message.content_type === 'audio' && (
            <div className="flex flex-col gap-2">
              <audio controls className="max-w-full">
                <source src={message.media_url || ''} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
              {message.content && (
                <div className="mt-1" dangerouslySetInnerHTML={{ __html: formattedContent }} />
              )}
            </div>
          )}
          
          {message.content_type === 'video' && (
            <div className="flex flex-col gap-2">
              <video controls className="max-w-full rounded-md">
                <source src={message.media_url || ''} type="video/mp4" />
                Your browser does not support the video element.
              </video>
              {message.content && (
                <div className="mt-1" dangerouslySetInnerHTML={{ __html: formattedContent }} />
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2 mt-1 px-1">
          <span className="text-xs text-gray-500">
            {formatRelativeTime(new Date(message.created_at))}
          </span>
          
          {message.is_read && isCurrentUser && (
            <span className="text-xs text-blue-500">Read</span>
          )}
          
          {message.reactions && message.reactions.length > 0 && (
            <div className="flex gap-1">
              {message.reactions.map(reaction => (
                <span 
                  key={reaction.id} 
                  className="text-sm" 
                  title={reaction.user?.name}
                >
                  {reaction.reaction}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}