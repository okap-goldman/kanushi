import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Message, 
  Conversation, 
  getConversation, 
  sendMessage, 
  reactToMessage
} from "@/lib/messageService";
import { MessageItem } from "@/components/chat/MessageItem";
import { MessageInput } from "@/components/chat/MessageInput";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Info, Phone, Video } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

export default function MessageDetail() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  // Sample current user ID (in a real app, get from auth)
  const currentUserId = "00000000-0000-0000-0000-000000000001";
  
  useEffect(() => {
    if (!conversationId) return;
    
    const loadConversation = async () => {
      setIsLoading(true);
      
      try {
        const { data, error } = await getConversation(conversationId, currentUserId);
        
        if (error) {
          console.error("Error loading conversation:", error);
          return;
        }
        
        if (data) {
          setConversation(data.conversation);
          setMessages(data.messages);
        }
      } catch (error) {
        console.error("Error loading conversation:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadConversation();
    
    // Set up polling for new messages (every 5 seconds)
    const pollInterval = setInterval(loadConversation, 5000);
    
    return () => clearInterval(pollInterval);
  }, [conversationId, currentUserId]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Handle sending new message
  const handleSendMessage = async (
    content: string, 
    contentType: 'text' | 'image' | 'video' | 'audio', 
    mediaUrl?: string
  ) => {
    if (!conversationId || !content) return;
    
    setIsSending(true);
    
    try {
      const newMessage = {
        conversation_id: conversationId,
        user_id: currentUserId,
        content,
        content_type: contentType,
        media_url: mediaUrl,
        is_read: false
      };
      
      const { data, error } = await sendMessage(newMessage);
      
      if (error) {
        console.error("Error sending message:", error);
        return;
      }
      
      if (data) {
        // Optimistically add the message to the UI
        setMessages(prev => [...prev, data]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };
  
  // Handle message reaction
  const handleReaction = async (messageId: string, reaction: string) => {
    try {
      const { error } = await reactToMessage(messageId, currentUserId, reaction);
      
      if (error) {
        console.error("Error reacting to message:", error);
      }
    } catch (error) {
      console.error("Error reacting to message:", error);
    }
  };
  
  // Go back to messages list
  const handleBack = () => {
    navigate("/messages");
  };
  
  if (isLoading) {
    return (
      <div className="flex-1 flex justify-center items-center h-full">
        <Spinner size="lg" />
      </div>
    );
  }
  
  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center h-full p-6 text-center">
        <p className="text-lg mb-4">会話が見つかりませんでした</p>
        <Button onClick={() => navigate("/messages")}>
          メッセージ一覧に戻る
        </Button>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center p-3 border-b bg-background sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={handleBack} className="mr-1">
          <ArrowLeft size={20} />
        </Button>
        
        <div className="flex items-center flex-1 min-w-0">
          <Avatar className="h-9 w-9 mr-3">
            <AvatarImage src={conversation.display_image} />
            <AvatarFallback>
              {conversation.display_name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <h2 className="font-medium text-sm truncate">
              {conversation.display_name}
            </h2>
            <p className="text-xs text-muted-foreground">
              {conversation.participants.some(p => p.user_id !== currentUserId && p.user.username)
                ? conversation.participants.find(p => p.user_id !== currentUserId)?.user.username
                : ""}
            </p>
          </div>
        </div>
        
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Phone size={20} />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Video size={20} />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Info size={20} />
          </Button>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-background/50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <div className="bg-primary/10 rounded-full p-6 mb-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={conversation.display_image} />
                <AvatarFallback>
                  {conversation.display_name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <h3 className="text-lg font-medium mb-1">{conversation.display_name}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {conversation.participants.some(p => p.user_id !== currentUserId && p.user.username)
                ? `@${conversation.participants.find(p => p.user_id !== currentUserId)?.user.username}`
                : ""}
            </p>
            <p className="text-sm text-muted-foreground">
              会話を始めましょう！
            </p>
          </div>
        ) : (
          <>
            {messages.map(message => (
              <MessageItem 
                key={message.id} 
                message={message} 
                isCurrentUser={message.user_id === currentUserId}
              />
            ))}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      <div className="p-4 border-t bg-background sticky bottom-0">
        <MessageInput 
          onSendMessage={handleSendMessage}
          disabled={isSending}
          placeholder={`${conversation.display_name}へメッセージを送信...`}
        />
      </div>
    </div>
  );
}