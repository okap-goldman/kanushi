import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Conversation } from "@/lib/messageService";
import { formatRelativeTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface ConversationItemProps {
  conversation: Conversation;
  isActive?: boolean;
  onClick?: () => void;
}

export function ConversationItem({ 
  conversation, 
  isActive = false,
  onClick 
}: ConversationItemProps) {
  // Get other participants (assuming display properties are set in the service)
  const displayName = conversation.display_name || "Chat";
  const displayImage = conversation.display_image || "";
  
  // Get last message preview
  const lastMessage = conversation.last_message;
  const lastMessagePreview = lastMessage ? getMessagePreview(lastMessage) : "Start a conversation";
  
  // Format the timestamp
  const timestamp = lastMessage ? formatRelativeTime(new Date(lastMessage.created_at)) : "";

  return (
    <div 
      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
        isActive ? 'bg-accent' : 'hover:bg-muted'
      }`}
      onClick={onClick}
    >
      <Avatar className="h-12 w-12">
        <AvatarImage src={displayImage} />
        <AvatarFallback>
          {displayName.substring(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <h3 className="font-medium text-sm truncate">{displayName}</h3>
          <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
            {timestamp}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground truncate max-w-[180px]">
            {lastMessagePreview}
          </p>
          
          {conversation.unread_count > 0 && (
            <Badge variant="default" className="ml-2 text-[10px] h-5 min-w-5 flex items-center justify-center rounded-full">
              {conversation.unread_count}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper function to generate a preview of the message based on content type
function getMessagePreview(message: Conversation['last_message']) {
  if (!message) return "";
  
  switch (message.content_type) {
    case 'text':
      // Truncate long text
      return message.content.length > 30 
        ? `${message.content.substring(0, 30)}...` 
        : message.content;
    case 'image':
      return '📷 Photo';
    case 'video':
      return '🎥 Video';
    case 'audio':
      return '🎵 Audio';
    default:
      return "New message";
  }
}