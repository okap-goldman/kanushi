import { Heart, MessageSquare, Flame, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { toggleLike, checkLiked } from "@/lib/postService";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

interface PostActionsProps {
  postId: string;
  onComment: () => void;
}

export function PostActions({ postId, onComment }: PostActionsProps) {
  const [liked, setLiked] = useState(false);
  const [kuratta, setKuratta] = useState(false);
  const [kurattaText, setKurattaText] = useState("");
  const [showKurattaDialog, setShowKurattaDialog] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isCheckingLike, setIsCheckingLike] = useState(true);
  const [isSubmittingKuratta, setIsSubmittingKuratta] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  // ユーザーIDが利用可能な場合はそちらを使用し、そうでない場合はフォールバック
  // フォールバックは管理者ユーザー (f1e2d3c4-b5a6-7987-8765-4321abcdef98) または "内なる光"ユーザー
  const currentUserId = user?.id || "f1e2d3c4-b5a6-7987-8765-4321abcdef98";

  useEffect(() => {
    // 投稿にいいねしているかチェック
    const checkIfLiked = async () => {
      try {
        setIsCheckingLike(true);
        const { data, error } = await checkLiked(postId, currentUserId);
        if (error) throw error;
        setLiked(!!data);
      } catch (err) {
        console.error('Failed to check like status:', err);
      } finally {
        setIsCheckingLike(false);
      }
    };
    
    checkIfLiked();
  }, [postId, currentUserId]);

  const handleLike = async () => {
    if (isLiking) return;
    
    try {
      setIsLiking(true);
      const { data, error } = await toggleLike(postId, currentUserId);
      
      if (error) throw error;
      
      if (data) {
        setLiked(data.liked);
        toast({
          title: data.liked ? "投稿にいいねしました" : "いいねを取り消しました",
        });
      }
    } catch (err) {
      console.error('Failed to toggle like:', err);
      toast({
        title: "いいねの処理に失敗しました",
        variant: "destructive"
      });
    } finally {
      setIsLiking(false);
    }
  };

  const handleKuratta = async () => {
    if (!kurattaText.trim() || isSubmittingKuratta) return;
    
    setIsSubmittingKuratta(true);
    
    try {
      // ここで「くらった」データを保存する処理を実装
      // 現在は単純にコンソールに出力して状態を変更
      console.log("「くらった」テキスト:", kurattaText, "投稿ID:", postId);
      
      // 成功したと仮定
      setKuratta(true);
      setShowKurattaDialog(false);
      toast({
        title: "魂に響いた部分を共有しました",
      });
    } catch (err) {
      console.error('Failed to submit kuratta:', err);
      toast({
        title: "共有に失敗しました",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingKuratta(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <Button
        variant="ghost"
        size="sm"
        className="flex items-center gap-2 group"
        onClick={handleLike}
        disabled={isCheckingLike || isLiking}
      >
        {isCheckingLike || isLiking ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Heart 
            className={cn(
              "h-5 w-5 transition-all duration-300 ease-in-out",
              liked && "fill-red-500 text-red-500 scale-125 animate-heartBeat"
            )} 
          />
        )}
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className="flex items-center gap-2"
        onClick={onComment}
      >
        <MessageSquare className="h-5 w-5" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className="flex items-center gap-2"
        onClick={() => !kuratta && setShowKurattaDialog(true)}
        disabled={kuratta}
      >
        <Flame className={`h-5 w-5 ${kuratta ? "fill-orange-500 text-orange-500" : ""}`} />
      </Button>

      <Dialog open={showKurattaDialog} onOpenChange={setShowKurattaDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>どんなことが魂に響きましたか？</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="どんなことが魂に響きましたか？自由に入力してください"
              value={kurattaText}
              onChange={(e) => setKurattaText(e.target.value)}
              className="min-h-[100px]"
              disabled={isSubmittingKuratta}
            />
          </div>
          <DialogFooter className="mt-4">
            <Button
              onClick={handleKuratta}
              className="w-full"
              disabled={!kurattaText.trim() || isSubmittingKuratta}
            >
              {isSubmittingKuratta ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : null}
              送信
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}