import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Heart, Send, Loader2 } from "lucide-react";
import { Comment } from "@/lib/data";
import { createComment } from "@/lib/postService";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";

interface PostCommentsProps {
  postId: string;
  comments: Comment[];
  isLoading?: boolean;
  onCommentAdded?: () => void;
}

export function PostComments({ postId, comments, isLoading = false, onCommentAdded }: PostCommentsProps) {
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      // 現在のところ、仮のユーザーIDを使用 (管理者ユーザー)
      const tempCurrentUserId = "f1e2d3c4-b5a6-7987-8765-4321abcdef98";

      const { data, error } = await createComment({
        post_id: postId,
        author_id: tempCurrentUserId,
        content: newComment
      });

      if (error) throw error;

      setNewComment("");
      toast({
        title: "コメントを投稿しました",
      });

      // コメント追加後に再取得
      if (onCommentAdded) {
        onCommentAdded();
      }
    } catch (err) {
      console.error('Failed to post comment:', err);
      toast({
        title: "コメントの投稿に失敗しました",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { 
        addSuffix: true,
        locale: ja 
      });
    } catch (e) {
      return "不明な日時";
    }
  };

  return (
    <div className="flex flex-col h-[80vh]">
      <div className="text-center py-4 border-b">
        <h2 className="text-lg font-semibold">コメント</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : comments.length === 0 ? (
          <div className="flex justify-center items-center h-full text-muted-foreground">
            コメントはまだありません
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="space-y-2">
              <div className="flex items-start gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={comment.author.image} />
                  <AvatarFallback>{comment.author.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{comment.author.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(comment.created_at)}
                    </p>
                  </div>
                  <p className="text-sm mt-1">{comment.content}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 ml-11">
                <button className="text-xs text-muted-foreground hover:text-foreground">
                  いいね！
                </button>
                <button className="text-xs text-muted-foreground hover:text-foreground">
                  返信する
                </button>
                <button className="text-xs text-muted-foreground hover:text-foreground">
                  翻訳を見る
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="border-t p-4">
        <form onSubmit={handleSubmitComment} className="flex items-center gap-2">
          <Avatar className="w-8 h-8 shrink-0">
            <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=current" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
          <div className="flex-1 relative">
            <Input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="コメントを追加..."
              className="pr-12"
              disabled={isSubmitting}
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-500 disabled:text-gray-300"
              disabled={!newComment.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}