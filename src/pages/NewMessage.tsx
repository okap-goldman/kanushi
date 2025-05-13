import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  getAvailableUsers, 
  ConversationParticipant, 
  createDirectConversation,
  createGroupConversation
} from "@/lib/messageService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Check, Search, X } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";

export default function NewMessage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<ConversationParticipant["user"][]>([]);
  const [selectedUsers, setSelectedUsers] = useState<ConversationParticipant["user"][]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();
  
  // Current user ID (in a real app, get from auth)
  const currentUserId = "00000000-0000-0000-0000-000000000001";
  
  useEffect(() => {
    const loadUsers = async () => {
      setIsLoading(true);
      
      try {
        const { data, error } = await getAvailableUsers(searchQuery, currentUserId);
        
        if (error) {
          console.error("Error loading users:", error);
          return;
        }
        
        if (data) {
          setUsers(data);
        }
      } catch (error) {
        console.error("Error loading users:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUsers();
  }, [searchQuery, currentUserId]);
  
  const handleUserSelect = (user: ConversationParticipant["user"]) => {
    if (selectedUsers.some(u => u.id === user.id)) {
      // Remove if already selected
      setSelectedUsers(prev => prev.filter(u => u.id !== user.id));
    } else {
      // Add to selected
      setSelectedUsers(prev => [...prev, user]);
    }
  };
  
  const handleCreateConversation = async () => {
    if (selectedUsers.length === 0) return;
    
    setIsCreating(true);
    
    try {
      if (selectedUsers.length === 1) {
        // Direct message (1:1)
        const { data, error } = await createDirectConversation(
          currentUserId,
          selectedUsers[0].id
        );
        
        if (error) {
          console.error("Error creating conversation:", error);
          return;
        }
        
        if (data) {
          navigate(`/messages/${data.conversation_id}`);
        }
      } else {
        // Group message
        const { data, error } = await createGroupConversation(
          currentUserId,
          selectedUsers.map(u => u.id)
        );
        
        if (error) {
          console.error("Error creating group conversation:", error);
          return;
        }
        
        if (data) {
          navigate(`/messages/${data.conversation_id}`);
        }
      }
    } catch (error) {
      console.error("Error creating conversation:", error);
    } finally {
      setIsCreating(false);
    }
  };
  
  const handleBack = () => {
    navigate("/messages");
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-xl font-bold">新しいメッセージ</h1>
        </div>
        
        <Button 
          onClick={handleCreateConversation}
          disabled={selectedUsers.length === 0 || isCreating}
          size="sm"
        >
          {isCreating ? <Spinner size="sm" /> : '次へ'}
        </Button>
      </div>
      
      {/* Selected users */}
      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-2 p-4 border-b">
          {selectedUsers.map(user => (
            <Badge key={user.id} variant="secondary" className="flex items-center gap-1 pl-1">
              <Avatar className="h-5 w-5 mr-1">
                <AvatarImage src={user.image} />
                <AvatarFallback>{user.name.substring(0, 2)}</AvatarFallback>
              </Avatar>
              <span className="text-xs">{user.name}</span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-5 w-5 ml-1 p-0"
                onClick={() => handleUserSelect(user)}
              >
                <X size={12} />
              </Button>
            </Badge>
          ))}
        </div>
      )}
      
      <div className="px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            placeholder="検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-muted/50"
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Spinner size="lg" />
          </div>
        ) : users.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            {searchQuery ? "ユーザーが見つかりませんでした" : "利用可能なユーザーがいません"}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {users.map(user => (
              <div 
                key={user.id}
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50"
                onClick={() => handleUserSelect(user)}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.image} />
                    <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <h3 className="font-medium text-sm">{user.name}</h3>
                    {user.username && (
                      <p className="text-xs text-muted-foreground">@{user.username}</p>
                    )}
                  </div>
                </div>
                
                {selectedUsers.some(u => u.id === user.id) && (
                  <Check className="h-5 w-5 text-primary" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}