import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Search as SearchIcon, 
  MessageSquare, 
  Loader2, 
  User, 
  Hash, 
  Calendar, 
  Users, 
  Send,
  PenSquare,
  Video,
  FileText,
  Tag,
  CircleUser
} from "lucide-react";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { useChat } from "@/hooks/use-chat";
import { Post } from "@/components/Post";
import { searchAll, SearchResults, searchPosts, searchUsers, searchTags, searchGroups, searchEvents } from "@/lib/searchService";
import { ContentType } from "@/lib/data";

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
  const [searchResults, setSearchResults] = useState<SearchResults>({
    posts: [],
    users: [],
    tags: [],
    groups: [],
    events: []
  });
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
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
        // Clear the input after sending
        setSearchQuery("");
      } catch (err) {
        console.error("Failed to send message:", err);
        toast({
          title: "メッセージの送信に失敗しました",
          description: "もう一度お試しください",
          variant: "destructive"
        });
      }
    } else {
      // 検索を実行
      setIsSearching(true);
      setHasSearched(true);
      
      try {
        if (resultType === "all") {
          const results = await searchAll(searchQuery);
          setSearchResults(results);
        } else if (resultType === "posts") {
          const { data } = await searchPosts(searchQuery);
          setSearchResults({ ...searchResults, posts: data || [] });
        } else if (resultType === "people") {
          const { data } = await searchUsers(searchQuery);
          setSearchResults({ ...searchResults, users: data || [] });
        } else if (resultType === "tags") {
          const { data } = await searchTags(searchQuery);
          setSearchResults({ ...searchResults, tags: data || [] });
        } else if (resultType === "groups") {
          const { data } = await searchGroups(searchQuery);
          setSearchResults({ ...searchResults, groups: data || [] });
        } else if (resultType === "events") {
          const { data } = await searchEvents(searchQuery);
          setSearchResults({ ...searchResults, events: data || [] });
        }
      } catch (err) {
        console.error("検索エラー:", err);
        toast({
          title: "検索に失敗しました",
          description: "もう一度お試しください",
          variant: "destructive"
        });
      } finally {
        setIsSearching(false);
      }
    }
  };

  // 検索タイプが変更された時にその結果タイプの検索を実行する
  useEffect(() => {
    if (searchQuery && hasSearched) {
      handleResultTypeChange(resultType);
    }
  }, [resultType]);

  const handleQuestionClick = (question: string) => {
    setSearchQuery(question);
    setActiveTab("ai");
    
    // Create a synthetic submit event
    const event = new Event('submit', { cancelable: true }) as React.FormEvent;
    event.preventDefault = () => {}; // Add preventDefault method
    
    // Submit the form with the selected question
    handleSearch(event);
  };

  const handleResultTypeChange = (type: SearchResultType) => {
    setResultType(type);
    
    // 検索クエリがあれば再検索
    if (searchQuery.trim() && hasSearched) {
      const event = new Event('submit', { cancelable: true }) as React.FormEvent;
      event.preventDefault = () => {};
      handleSearch(event);
    }
  };

  // 投稿のメディアタイプを判定する関数
  const getMediaType = (post: any): ContentType => {
    if (post.content_type) return post.content_type as ContentType;
    
    if (post.audio_url) return "audio";
    if (post.media_url && (
      post.media_url.includes('.mp4') || 
      post.media_url.includes('.mov') || 
      post.media_url.includes('.avi')
    )) return "video";
    if (post.media_url) return "image";
    
    return "text";
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
        
        <ScrollArea className="h-[calc(100vh-200px)] pb-8">
          <div className="space-y-0 divide-y pb-8">
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
            <div className="flex gap-2">
              <div className="relative flex-1">
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
              <Button 
                type="submit" 
                disabled={isLoading || !searchQuery.trim()}
                size="icon"
                variant="default"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
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
              {isSearching && (
                <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-primary" />
              )}
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

            {searchQuery && hasSearched && (
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
                    {/* 投稿の検索結果 */}
                    {(resultType === "all" || resultType === "posts") && searchResults.posts.length > 0 && (
                      <div className="space-y-4">
                        {resultType === "all" && (
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium flex items-center">
                              <PenSquare className="h-4 w-4 mr-2" />
                              投稿
                            </h4>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleResultTypeChange("posts")}
                            >
                              すべて見る
                            </Button>
                          </div>
                        )}
                        
                        {searchResults.posts.slice(0, resultType === "all" ? 3 : undefined).map(post => (
                          <Post 
                            key={post.id}
                            postId={post.id}
                            author={{
                              id: post.user_id,
                              name: post.user.full_name || post.user.username,
                              image: post.user.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + post.user_id
                            }}
                            content={post.audio_url || post.media_url || post.text_content}
                            caption={post.text_content}
                            mediaType={getMediaType(post)}
                            tags={post.tags}
                          />
                        ))}
                      </div>
                    )}

                    {/* ユーザーの検索結果 */}
                    {(resultType === "all" || resultType === "people") && searchResults.users.length > 0 && (
                      <div className="space-y-2">
                        {resultType === "all" && (
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium flex items-center">
                              <CircleUser className="h-4 w-4 mr-2" />
                              人物
                            </h4>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleResultTypeChange("people")}
                            >
                              すべて見る
                            </Button>
                          </div>
                        )}
                        
                        {searchResults.users.slice(0, resultType === "all" ? 3 : undefined).map(user => (
                          <Card key={user.id} className="p-3 hover:bg-accent transition-colors">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-full overflow-hidden">
                                <img 
                                  src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`} 
                                  alt={user.full_name || user.username}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div>
                                <h4 className="font-medium">{user.full_name || user.username}</h4>
                                <p className="text-sm text-muted-foreground">@{user.username}</p>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}

                    {/* タグの検索結果 */}
                    {(resultType === "all" || resultType === "tags") && searchResults.tags.length > 0 && (
                      <div className="space-y-2">
                        {resultType === "all" && (
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium flex items-center">
                              <Tag className="h-4 w-4 mr-2" />
                              タグ
                            </h4>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleResultTypeChange("tags")}
                            >
                              すべて見る
                            </Button>
                          </div>
                        )}
                        
                        <div className="flex flex-wrap gap-2">
                          {searchResults.tags.slice(0, resultType === "all" ? 10 : undefined).map(tag => (
                            <Button 
                              key={tag.id} 
                              variant="outline" 
                              size="sm"
                              className="flex items-center gap-1"
                            >
                              <span>#{tag.name}</span>
                              <span className="text-xs bg-primary/10 rounded px-1">
                                {tag.post_count}
                              </span>
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* グループの検索結果 */}
                    {(resultType === "all" || resultType === "groups") && searchResults.groups.length > 0 && (
                      <div className="space-y-2">
                        {resultType === "all" && (
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium flex items-center">
                              <Users className="h-4 w-4 mr-2" />
                              グループ
                            </h4>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleResultTypeChange("groups")}
                            >
                              すべて見る
                            </Button>
                          </div>
                        )}
                        
                        {searchResults.groups.slice(0, resultType === "all" ? 3 : undefined).map(group => (
                          <Card key={group.id} className="p-3 hover:bg-accent transition-colors">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-full overflow-hidden">
                                <img 
                                  src={group.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${group.name}`}
                                  alt={group.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div>
                                <h4 className="font-medium">{group.name}</h4>
                                <p className="text-xs text-muted-foreground">
                                  メンバー {group.member_count}人
                                </p>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}

                    {/* イベントの検索結果 */}
                    {(resultType === "all" || resultType === "events") && searchResults.events.length > 0 && (
                      <div className="space-y-2">
                        {resultType === "all" && (
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium flex items-center">
                              <Calendar className="h-4 w-4 mr-2" />
                              イベント
                            </h4>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleResultTypeChange("events")}
                            >
                              すべて見る
                            </Button>
                          </div>
                        )}
                        
                        {searchResults.events.slice(0, resultType === "all" ? 3 : undefined).map(event => (
                          <Card key={event.id} className="p-3 hover:bg-accent transition-colors">
                            <div className="flex items-start space-x-3">
                              {event.image_url && (
                                <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0">
                                  <img 
                                    src={event.image_url}
                                    alt={event.title}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              <div>
                                <h4 className="font-medium">{event.title}</h4>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(event.start_date).toLocaleDateString()} @ {event.location}
                                </p>
                                <p className="text-sm mt-1 line-clamp-2">
                                  {event.description}
                                </p>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}

                    {/* 検索結果がない場合 */}
                    {(
                      (resultType === "all" && 
                        searchResults.posts.length === 0 && 
                        searchResults.users.length === 0 && 
                        searchResults.tags.length === 0 && 
                        searchResults.groups.length === 0 && 
                        searchResults.events.length === 0
                      ) ||
                      (resultType === "posts" && searchResults.posts.length === 0) ||
                      (resultType === "people" && searchResults.users.length === 0) ||
                      (resultType === "tags" && searchResults.tags.length === 0) ||
                      (resultType === "groups" && searchResults.groups.length === 0) ||
                      (resultType === "events" && searchResults.events.length === 0)
                    ) && (
                      <div className="text-center text-sm text-muted-foreground py-10">
                        検索結果が見つかりませんでした
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </Card>
            )}

            {(!searchQuery || !hasSearched) && (
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
            <div className="flex gap-2">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="質問を入力"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button 
                type="submit" 
                disabled={!searchQuery.trim()}
                size="icon"
                variant="default"
              >
                <Send className="h-4 w-4" />
              </Button>
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