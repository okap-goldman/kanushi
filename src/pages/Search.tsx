import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Search as SearchIcon, MessageSquare, Loader2, User, Hash, Calendar, Users } from "lucide-react";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { useChat } from "@/hooks/use-chat";

const SUGGESTED_QUESTIONS = [
  "子どもとの適切な関わり方は？",
  "目醒めとは何ですか？",
  "瞑想の始め方を教えてください",
  "マインドフルネスの実践方法は？",
];

type SearchResultType = "all" | "posts" | "people" | "videos" | "groups" | "pages" | "events" | "tags";

export default function Search() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isChatMode, setIsChatMode] = useState(false);
  const [activeTab, setActiveTab] = useState<"search" | "ai">("search");
  const [resultType, setResultType] = useState<SearchResultType>("all");
  const { toast } = useToast();
  
  // Use our chat hook for OpenRouter integration
  const {
    messages: chatMessages,
    isLoading,
    error,
    sendMessage,
    resetChat
  } = useChat({
    systemPrompt: "あなたは親切で有益なアシスタントです。質問に対して包括的かつ有益な回答を日本語で提供してください。",
    onError: (error) => {
      toast({
        title: "エラーが発生しました",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Transform messages to the UI format
  const messages = chatMessages.map(msg => ({
    isAi: msg.role === 'assistant',
    message: msg.content
  }));

  // Handle search/question submission
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    if (activeTab === "ai") {
      setIsChatMode(true);
      
      try {
        await sendMessage(searchQuery);
      } catch (err) {
        console.error("Failed to send message:", err);
        toast({
          title: "メッセージの送信に失敗しました",
          description: "もう一度お試しください",
          variant: "destructive"
        });
      }
    } else {
      // Handle regular search - this would connect to your search service
      console.log("Searching for:", searchQuery, "Result type:", resultType);
      // In a real implementation, you would fetch search results here
    }
  };

  const handleQuestionClick = (question: string) => {
    setSearchQuery(question);
    setActiveTab("ai");
    handleSearch(new Event('submit') as any);
  };

  const handleResultTypeChange = (type: SearchResultType) => {
    setResultType(type);
    // In a real implementation, you would refresh search results here
  };

  if (isChatMode) {
    return (
      <div className="container max-w-3xl mx-auto px-4 pt-20 pb-24">
        <div className="flex justify-between items-center mb-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              setIsChatMode(false);
              resetChat();
            }}
          >
            ← 戻る
          </Button>
          
          {error && (
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={() => window.location.reload()}
            >
              再読み込み
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="space-y-0 divide-y">
            {messages.map((msg, index) => (
              <ChatMessage key={index} isAi={msg.isAi} message={msg.message} />
            ))}
            
            {isLoading && (
              <div className="flex justify-center items-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}
          </div>
        </ScrollArea>
        
        <form onSubmit={handleSearch} className="fixed bottom-24 left-0 right-0 bg-background p-4">
          <div className="container max-w-3xl mx-auto relative">
            <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="メッセージを入力..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              disabled={isLoading}
            />
            {isLoading && (
              <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-primary" />
            )}
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 pt-20 pb-24">
      <Tabs 
        defaultValue="search" 
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "search" | "ai")}
        className="w-full"
      >
        <TabsList className="grid grid-cols-2 w-full mb-4">
          <TabsTrigger value="search">検索</TabsTrigger>
          <TabsTrigger value="ai">AIに質問</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-4">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="検索キーワードを入力"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <ScrollArea className="whitespace-nowrap pb-2">
              <div className="flex space-x-2 w-full overflow-x-auto">
                <Button 
                  variant={resultType === "all" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => handleResultTypeChange("all")}
                >
                  すべて
                </Button>
                <Button 
                  variant={resultType === "posts" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => handleResultTypeChange("posts")}
                >
                  投稿
                </Button>
                <Button 
                  variant={resultType === "people" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => handleResultTypeChange("people")}
                >
                  人物
                </Button>
                <Button 
                  variant={resultType === "videos" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => handleResultTypeChange("videos")}
                >
                  動画
                </Button>
                <Button 
                  variant={resultType === "groups" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => handleResultTypeChange("groups")}
                >
                  グループ
                </Button>
                <Button 
                  variant={resultType === "pages" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => handleResultTypeChange("pages")}
                >
                  ページ
                </Button>
                <Button 
                  variant={resultType === "events" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => handleResultTypeChange("events")}
                >
                  イベント
                </Button>
                <Button 
                  variant={resultType === "tags" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => handleResultTypeChange("tags")}
                >
                  タグ
                </Button>
              </div>
            </ScrollArea>

            {searchQuery && (
              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium">検索結果</h3>
                  {resultType !== "all" && (
                    <Button variant="ghost" size="sm" onClick={() => handleResultTypeChange("all")}>
                      すべて見る
                    </Button>
                  )}
                </div>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    <div className="text-center text-sm text-muted-foreground py-10">
                      検索結果はここに表示されます
                    </div>
                  </div>
                </ScrollArea>
              </Card>
            )}

            {!searchQuery && (
              <Card className="p-4">
                <h3 className="text-sm font-medium mb-3">最近</h3>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                    >
                      <User className="h-4 w-4 mr-2" />
                      <span>ユーザー検索履歴</span>
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                    >
                      <Hash className="h-4 w-4 mr-2" />
                      <span>タグ検索履歴</span>
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>イベント検索履歴</span>
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      <span>グループ検索履歴</span>
                    </Button>
                  </div>
                </ScrollArea>
              </Card>
            )}
          </form>
        </TabsContent>

        <TabsContent value="ai" className="space-y-4">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="質問を入力"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Card className="p-4">
              <h3 className="text-sm font-medium mb-3">おすすめの質問</h3>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {SUGGESTED_QUESTIONS.map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full justify-start gap-2"
                      onClick={() => handleQuestionClick(question)}
                    >
                      <MessageSquare className="h-4 w-4" />
                      {question}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </Card>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}