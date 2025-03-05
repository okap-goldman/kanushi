import { useState, useEffect, useContext } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Search as SearchIcon, MessageCircle } from 'lucide-react';
import PostCard from '@/components/post/post-card';
import ChatMessage from './chat-message';
import { searchByKeyword, isQuestion } from '@/lib/services/search';
import { sendChatMessage, getUserDailyQuestionCount, getChatHistory, type ChatMessage as ChatMessageType } from '@/lib/services/ai-chat';
import { AuthContext } from '@/contexts/auth-context';

// サジェストされた質問
const SUGGESTED_QUESTIONS = [
  '目醒めを深めるためのおすすめの瞑想法は？',
  '他の人の目醒め体験を知りたい',
  '目醒めと日常生活の関係について',
  '自分の内なる声を聴く方法は？',
];

export default function SearchPage() {
  const { user } = useContext(AuthContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessageType[]>([]);
  const [searchResults, setSearchResults] = useState({ users: [], posts: [], events: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [remainingQuestions, setRemainingQuestions] = useState(5);

  // 残りの質問回数を取得
  useEffect(() => {
    if (user) {
      const fetchQuestionCount = async () => {
        const count = await getUserDailyQuestionCount(user.uid);
        setRemainingQuestions(5 - count);
      };
      fetchQuestionCount();
    }
  }, [user]);

  // チャット履歴を取得
  useEffect(() => {
    if (user) {
      const fetchChatHistory = async () => {
        const history = await getChatHistory(user.uid);
        setChatHistory(history);
      };
      fetchChatHistory();
    }
  }, [user]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    
    try {
      // 検索か質問かを判定
      if (isQuestion(searchQuery)) {
        // 質問の場合
        if (user && remainingQuestions > 0) {
          const newMessage: ChatMessageType = {
            id: String(Date.now()),
            role: 'user',
            content: searchQuery,
            timestamp: new Date().toISOString()
          };
          
          setChatHistory([...chatHistory, newMessage]);
          
          // AIの応答を取得
          const response = await sendChatMessage(user.uid, searchQuery);
          setChatHistory(prev => [...prev, response]);
          
          // 残りの質問回数を更新
          setRemainingQuestions(prev => prev - 1);
        }
        
        // チャットタブに切り替え
        setActiveTab('chat');
      } else {
        // 検索の場合
        const results = await searchByKeyword(searchQuery);
        setSearchResults(results);
        
        // 検索結果タブに切り替え
        setActiveTab('search');
      }
    } catch (error) {
      console.error('検索/チャットエラー:', error);
    } finally {
      setIsLoading(false);
      setSearchQuery('');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !user || remainingQuestions <= 0) return;
    
    setIsLoading(true);
    
    try {
      const newMessage: ChatMessageType = {
        id: String(Date.now()),
        role: 'user',
        content: chatInput,
        timestamp: new Date().toISOString()
      };
      
      setChatHistory([...chatHistory, newMessage]);
      
      // AIの応答を取得
      const response = await sendChatMessage(user.uid, chatInput);
      setChatHistory(prev => [...prev, response]);
      
      // 残りの質問回数を更新
      setRemainingQuestions(prev => prev - 1);
    } catch (error) {
      console.error('チャットエラー:', error);
    } finally {
      setIsLoading(false);
      setChatInput('');
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setChatInput(question);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-16">
      <div className="container mx-auto px-4">
        {/* 検索バー */}
        <div className="sticky top-16 bg-gray-50 py-4 z-10">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="キーワードで検索 または 質問を入力"
              className="flex-1"
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading}>
              <SearchIcon className="h-4 w-4" />
            </Button>
          </form>
        </div>

        {/* タブ付きコンテンツ */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="w-full">
            <TabsTrigger value="chat" className="flex-1">
              AIチャット
            </TabsTrigger>
            <TabsTrigger value="search" className="flex-1">
              検索結果
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="mt-6">
            <div className="bg-white rounded-lg shadow-sm">
              {/* チャット履歴 */}
              <div className="p-4 space-y-4 min-h-[400px] max-h-[600px] overflow-y-auto">
                {chatHistory.length > 0 ? (
                  chatHistory.map((message) => (
                    <ChatMessage key={message.id} message={message} />
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-10">
                    <p>質問をして会話を始めましょう</p>
                  </div>
                )}
              </div>

              {/* サジェストされた質問 */}
              <div className="p-4 border-t border-gray-100">
                <p className="text-sm text-gray-500 mb-2">おすすめの質問：</p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_QUESTIONS.map((question) => (
                    <Button
                      key={question}
                      variant="outline"
                      size="sm"
                      onClick={() => handleSuggestedQuestion(question)}
                      disabled={isLoading || remainingQuestions <= 0}
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              </div>

              {/* メッセージ入力 */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-100">
                <div className="flex gap-2">
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="質問を入力（1日5回まで）"
                    className="flex-1"
                    disabled={isLoading || remainingQuestions <= 0}
                  />
                  <Button type="submit" disabled={isLoading || remainingQuestions <= 0}>
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  残り質問回数: {remainingQuestions}回
                </p>
              </form>
            </div>
          </TabsContent>

          <TabsContent value="search" className="mt-6">
            <div className="space-y-4">
              {searchResults.users && searchResults.users.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">ユーザー</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {searchResults.users.map((user) => (
                      <div key={user.user_id} className="bg-white p-4 rounded-lg shadow-sm flex items-center gap-3">
                        <img
                          src={user.profile_icon_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                          alt={user.user_name}
                          className="w-10 h-10 rounded-full"
                        />
                        <div>
                          <p className="font-medium">{user.user_name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {searchResults.posts && searchResults.posts.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">投稿</h3>
                  <div className="space-y-4">
                    {searchResults.posts.map((post) => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>
                </div>
              )}
              
              {searchResults.events && searchResults.events.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">イベント</h3>
                  <div className="space-y-4">
                    {searchResults.events.map((event) => (
                      <div key={event.id} className="bg-white p-4 rounded-lg shadow-sm">
                        <h4 className="font-medium">{event.event_name}</h4>
                        <p className="text-sm text-gray-500">{event.event_start}</p>
                        <p className="mt-2">{event.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {(!searchResults.users || searchResults.users.length === 0) && 
               (!searchResults.posts || searchResults.posts.length === 0) && 
               (!searchResults.events || searchResults.events.length === 0) && (
                <div className="text-center text-gray-500 py-10">
                  <p>検索結果がありません</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}  