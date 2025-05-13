import { useEffect, useState } from "react";
import { Conversation, getConversations } from "@/lib/messageService";
import { ConversationItem } from "@/components/chat/ConversationItem";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";

export default function Messages() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Load conversations
    const loadConversations = async () => {
      setIsLoading(true);
      
      try {
        // In a real app, you would get the current user ID from auth
        // For now, we'll use a sample ID
        const currentUserId = "00000000-0000-0000-0000-000000000001";
        
        const { data, error } = await getConversations(currentUserId);
        
        if (error) {
          console.error("Error loading conversations:", error);
          return;
        }
        
        if (data) {
          setConversations(data);
        }
      } catch (error) {
        console.error("Error loading conversations:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadConversations();
    
    // Set up periodic refresh (every 30 seconds)
    const refreshInterval = setInterval(loadConversations, 30000);
    
    return () => clearInterval(refreshInterval);
  }, []);
  
  // Filter conversations by search query
  const filteredConversations = conversations.filter(conversation => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    
    // Search by display name
    if (conversation.display_name?.toLowerCase().includes(searchLower)) {
      return true;
    }
    
    // Search in last message
    if (conversation.last_message?.content?.toLowerCase().includes(searchLower)) {
      return true;
    }
    
    // Search by participant name
    return conversation.participants.some(
      p => p.user.name.toLowerCase().includes(searchLower)
    );
  });
  
  // Navigate to new message
  const handleNewMessage = () => {
    navigate("/messages/new");
  };
  
  // Navigate to conversation
  const handleConversationClick = (conversationId: string) => {
    navigate(`/messages/${conversationId}`);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <h1 className="text-xl font-bold">メッセージ</h1>
        <Button 
          onClick={handleNewMessage}
          size="icon" 
          variant="ghost"
        >
          <Plus size={24} />
        </Button>
      </div>
      
      <div className="px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            placeholder="検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 rounded-full bg-muted/50"
          />
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex-1 flex justify-center items-center">
          <Spinner size="lg" />
        </div>
      ) : filteredConversations.length === 0 ? (
        <div className="flex-1 flex flex-col justify-center items-center p-6 text-center">
          <p className="text-muted-foreground mb-4">
            {searchQuery 
              ? "検索結果がありません"
              : "メッセージはまだありません"}
          </p>
          <Button onClick={handleNewMessage}>
            新しいメッセージを作成
          </Button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto divide-y divide-border">
          {filteredConversations.map(conversation => (
            <ConversationItem 
              key={conversation.id}
              conversation={conversation}
              onClick={() => handleConversationClick(conversation.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}