import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect } from "react";

interface ChatMessageProps {
  isAi?: boolean;
  message: string;
}

export function ChatMessage({ isAi = false, message }: ChatMessageProps) {
  const [formattedMessage, setFormattedMessage] = useState(message);
  
  // Process message to handle markdown formatting
  useEffect(() => {
    // Basic Markdown-like formatting
    let formatted = message
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
      .replace(/`(.*?)`/g, '<code>$1</code>') // Inline code
      .replace(/\n/g, '<br/>'); // Line breaks
    
    setFormattedMessage(formatted);
  }, [message]);

  return (
    <div className={`flex gap-4 ${isAi ? "bg-muted/50" : "bg-background"} p-6`}>
      <Avatar className="h-8 w-8">
        <AvatarImage src={isAi ? "/ai-avatar.png" : "/user-avatar.png"} />
        <AvatarFallback>{isAi ? "AI" : "Me"}</AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-2">
        <p className="text-sm font-medium">{isAi ? "アシスタント" : "あなた"}</p>
        <div 
          className="text-sm text-muted-foreground prose prose-sm max-w-none break-words" 
          dangerouslySetInnerHTML={{ __html: formattedMessage }}
        />
      </div>
    </div>
  );
}