import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Post } from "@/components/Post";
import { useState, useEffect } from "react";
import { getPosts } from "@/lib/postService";
import { Post as PostType } from "@/lib/data";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import StoriesRow from "@/components/stories/StoriesRow";
import CreateStoryDialog from "@/components/stories/CreateStoryDialog";
import { getStories, viewStory, createStory, UserStories } from "@/lib/storyService";
import { supabase } from "@/lib/supabase";

const Index = () => {
  const [timelineType, setTimelineType] = useState<"family" | "watch">("family");
  const [showWatchConfirm, setShowWatchConfirm] = useState(false);
  const [posts, setPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // ストーリー関連の状態
  const [userStories, setUserStories] = useState<UserStories[]>([]);
  const [loadingStories, setLoadingStories] = useState(true);
  const [createStoryOpen, setCreateStoryOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{id: string; image: string} | null>(null);

  // 投稿を取得
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const { data, error } = await getPosts(timelineType);
        
        if (error) {
          throw error;
        }
        
        if (data) {
          setPosts(data);
        }
      } catch (err) {
        console.error('Error fetching posts:', err);
        setError('投稿の読み込み中にエラーが発生しました。');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPosts();
  }, [timelineType]);
  
  // 現在のユーザー情報を取得
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: userData } = await supabase.auth.getUser();
      
      if (userData?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, image')
          .eq('id', userData.user.id)
          .single();
          
        if (profile) {
          setCurrentUser({
            id: profile.id,
            image: profile.image
          });
        }
      }
    };
    
    getCurrentUser();
  }, []);
  
  // ストーリーを取得
  useEffect(() => {
    const fetchStories = async () => {
      setLoadingStories(true);
      
      try {
        const stories = await getStories();
        setUserStories(stories);
      } catch (err) {
        console.error('Error fetching stories:', err);
      } finally {
        setLoadingStories(false);
      }
    };
    
    fetchStories();
    
    // リアルタイム更新をリッスン（新しいストーリーが追加された場合に更新）
    const storiesSubscription = supabase
      .channel('public:stories')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stories' }, () => {
        fetchStories();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(storiesSubscription);
    };
  }, []);

  const handleTimelineChange = (type: "family" | "watch") => {
    if (type === "watch") {
      setShowWatchConfirm(true);
    } else {
      setTimelineType(type);
    }
  };
  
  // ストーリー表示時のハンドラー
  const handleStoryView = async (storyId: string) => {
    await viewStory(storyId);
  };
  
  // ストーリー作成のハンドラー
  const handleCreateStory = () => {
    setCreateStoryOpen(true);
  };
  
  // ストーリー保存のハンドラー
  const handleStorySubmit = async (data: { file: File; caption: string; contentType: "image" | "video" }) => {
    try {
      const newStory = await createStory(data.file, data.caption, data.contentType);
      if (newStory) {
        // 成功したら自動的にストーリーリストが更新される（リアルタイムサブスクリプションで）
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error creating story:", error);
      return false;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-8">
        <div className="flex justify-center gap-2 mb-4">
          <Button
            variant={timelineType === "family" ? "default" : "outline"}
            onClick={() => handleTimelineChange("family")}
          >
            ファミリー
          </Button>
          <Button
            variant={timelineType === "watch" ? "default" : "outline"}
            onClick={() => handleTimelineChange("watch")}
          >
            ウォッチ
          </Button>
        </div>
        
        {/* ストーリーズ行 */}
        {loadingStories ? (
          <div className="max-w-xl mx-auto mb-4 bg-card rounded-xl shadow-sm p-4">
            <div className="flex items-center space-x-4 overflow-x-auto">
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-full bg-muted animate-pulse"></div>
                <div className="w-12 h-3 mt-1 bg-muted animate-pulse rounded"></div>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-full bg-muted animate-pulse"></div>
                <div className="w-12 h-3 mt-1 bg-muted animate-pulse rounded"></div>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-full bg-muted animate-pulse"></div>
                <div className="w-12 h-3 mt-1 bg-muted animate-pulse rounded"></div>
              </div>
            </div>
          </div>
        ) : currentUser ? (
          <div className="max-w-xl mx-auto mb-4 bg-card rounded-xl shadow-sm">
            <StoriesRow
              userStories={userStories}
              currentUserId={currentUser.id}
              currentUserImage={currentUser.image || ""}
              onCreateStory={handleCreateStory}
              onStoryView={handleStoryView}
            />
          </div>
        ) : null}

        <div className="space-y-4 max-w-xl mx-auto">
          {loading ? (
            // Loading skeletons
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="p-4 space-y-4 border rounded-lg">
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-32 w-full" />
                <div className="flex space-x-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </div>
            ))
          ) : error ? (
            <div className="p-4 text-center text-red-500">
              {error}
              <Button 
                variant="outline" 
                className="mt-2"
                onClick={() => getPosts(timelineType).then(({data}) => data && setPosts(data))}
              >
                再試行
              </Button>
            </div>
          ) : posts.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              投稿がありません
            </div>
          ) : (
            posts.map((post) => (
              <Post 
                key={post.id} 
                author={post.author}
                content={post.content}
                caption={post.caption}
                mediaType={post.media_type}
                postId={post.id}
                tags={post.tags}
              />
            ))
          )}
        </div>
      </main>

      <AlertDialog open={showWatchConfirm} onOpenChange={setShowWatchConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ウォッチタイムラインの表示</AlertDialogTitle>
            <AlertDialogDescription>
              ウォッチタイムラインを表示しますか？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setTimelineType("watch");
                setShowWatchConfirm(false);
              }}
            >
              表示する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* ストーリー作成ダイアログ */}
      <CreateStoryDialog
        isOpen={createStoryOpen}
        onOpenChange={setCreateStoryOpen}
        onSubmit={handleStorySubmit}
      />
    </div>
  );
};

export default Index;