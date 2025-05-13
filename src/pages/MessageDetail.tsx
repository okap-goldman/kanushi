import { useEffect, useState, useRef, useCallback } from "react";
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
import { ArrowLeft, Info, Phone, Video, ArrowUp } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

export default function MessageDetail() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  // Sample current user ID (in a real app, get from auth)
  const currentUserId = "00000000-0000-0000-0000-000000000001";
  
  // Load initial conversation
  const loadInitialConversation = useCallback(async () => {
    if (!conversationId) return;
    
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
        setHasMoreMessages(data.has_more);
      }
    } catch (error) {
      console.error("Error loading conversation:", error);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, currentUserId]);
  
  // Load new messages (polling)
  const loadNewMessages = useCallback(async () => {
    if (!conversationId || messages.length === 0) return;
    
    try {
      // Get the timestamp of the most recent message
      const latestMessageTimestamp = messages[messages.length - 1]?.created_at;
      
      if (!latestMessageTimestamp) return;
      
      const { data, error } = await getConversation(
        conversationId, 
        currentUserId
      );
      
      if (error) {
        console.error("Error loading new messages:", error);
        return;
      }
      
      if (data && data.messages.length > 0) {
        // Find messages that are newer than our latest
        const newMessages = data.messages.filter(
          message => new Date(message.created_at) > new Date(latestMessageTimestamp)
        );
        
        if (newMessages.length > 0) {
          setMessages(prev => [...prev, ...newMessages]);
        }
      }
    } catch (error) {
      console.error("Error polling for new messages:", error);
    }
  }, [conversationId, currentUserId, messages]);
  
  // Load previous messages
  const loadPreviousMessages = async () => {
    if (!conversationId || messages.length === 0 || isLoadingMore) return;
    
    setIsLoadingMore(true);
    
    try {
      // Get the timestamp of the oldest message we have
      const oldestMessageTimestamp = messages[0]?.created_at;
      
      if (!oldestMessageTimestamp) return;
      
      const { data, error } = await getConversation(
        conversationId, 
        currentUserId,
        30, // Limit
        oldestMessageTimestamp // Get messages before this timestamp
      );
      
      if (error) {
        console.error("Error loading previous messages:", error);
        return;
      }
      
      if (data) {
        // Save the current scroll position
        const scrollContainer = messagesContainerRef.current;
        const scrollHeight = scrollContainer?.scrollHeight || 0;
        
        setMessages(prev => [...data.messages, ...prev]);
        setHasMoreMessages(data.has_more);
        
        // Restore scroll position after messages are added
        if (scrollContainer) {
          setTimeout(() => {
            const newScrollHeight = scrollContainer.scrollHeight;
            scrollContainer.scrollTop = newScrollHeight - scrollHeight;
          }, 0);
        }
      }
    } catch (error) {
      console.error("Error loading previous messages:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };
  
  // Set up initial load and polling
  useEffect(() => {
    loadInitialConversation();
    
    // Set up polling for new messages (every 5 seconds)
    const pollInterval = setInterval(loadNewMessages, 5000);
    
    return () => clearInterval(pollInterval);
  }, [conversationId, currentUserId, loadInitialConversation, loadNewMessages]);
  
  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (messagesEndRef.current && !isLoadingMore) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoadingMore]);
  
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
      <div 
        className="flex-1 overflow-y-auto p-4 bg-background/50" 
        ref={messagesContainerRef}
      >
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
            {/* Load more button */}
            {hasMoreMessages && (
              <div className="flex justify-center py-2 mb-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadPreviousMessages}
                  disabled={isLoadingMore}
                  className="flex items-center gap-1"
                >
                  {isLoadingMore ? (
                    <Spinner size="sm" />
                  ) : (
                    <ArrowUp size={16} />
                  )}
                  過去のメッセージを読み込む
                </Button>
              </div>
            )}
            
            {/* Messages */}
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