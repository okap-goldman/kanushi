import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Video, Mic, BookText, History } from "lucide-react";
import { useState } from "react";
import { TextPostForm } from "@/components/post/TextPostForm";
import { VideoPostForm } from "@/components/post/VideoPostForm";
import { createPost } from "@/controllers/posts";
import { useToast } from "@/hooks/use-toast";

interface CreatePostDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

// API レスポンスの型定義
interface PostResponse {
  post_id?: number;
  [key: string]: any;
}

export function CreatePostDialog({ isOpen, onClose }: CreatePostDialogProps) {
  const [selectedPostType, setSelectedPostType] = useState<string | null>(null);
  const { toast } = useToast();

  const postTypes = [
    { icon: Video, label: "動画・画像", value: "media" },
    { icon: Mic, label: "音声", value: "audio" },
    { icon: BookText, label: "テキスト", value: "text" },
    { icon: History, label: "ストーリーズ", value: "story" },
  ];

  const handlePostTypeSelect = (type: string) => {
    setSelectedPostType(type);
  };

  const handleTextSubmit = async (title: string, text_content: string) => {
    try {
      // @ts-ignore createPost の仮実装のため、型エラーを一時的に無視
      const response = await createPost({
        body: {
          title,
          text_content,
          post_type: 'text',
          visibility: 'public', // 仮の値
        },
      });

      if (response && response.post_id) {
        toast({
          title: "投稿成功",
          description: "テキスト投稿が作成されました。",
        });
        onClose();
        setSelectedPostType(null); // フォームをリセット
      } else {
        throw new Error('Failed to create post');
      }
    } catch (error) {
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : "投稿に失敗しました。",
        variant: "destructive",
      });
    }
  };

  const handleVideoSubmit = async (videoFile: File, description: string, isPublic: boolean) => {
    try {
      // @ts-ignore createPost の仮実装のため、型エラーを一時的に無視
      const response = await createPost({
        body: {
          video_file: videoFile,
          description,
          post_type: 'video',
          visibility: isPublic ? 'public' : 'private',
        },
      });

      if (response && response.post_id) {
        toast({
          title: "投稿成功",
          description: "動画投稿が作成されました。YouTubeへのアップロードを開始しました。",
        });
        onClose();
        setSelectedPostType(null); // フォームをリセット
      } else {
        throw new Error('Failed to create post');
      }
    } catch (error) {
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : "投稿に失敗しました。",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新規投稿を作成</DialogTitle>
        </DialogHeader>
        {!selectedPostType ? (
          <div className="grid grid-cols-2 gap-4">
            {postTypes.map(({ icon: Icon, label, value }) => (
              <Button
                key={value}
                variant="outline"
                className="h-24 flex flex-col gap-2"
                onClick={() => handlePostTypeSelect(value)}
              >
                <Icon className="h-8 w-8" />
                <span>{label}</span>
              </Button>
            ))}
          </div>
        ) : (
          <>
            {selectedPostType === 'text' && (
              <TextPostForm onSubmit={handleTextSubmit} />
            )}
            {selectedPostType === 'media' && (
              <VideoPostForm onSubmit={handleVideoSubmit} />
            )}
            {(selectedPostType === 'audio' || selectedPostType === 'story') && (
              <div className="p-4 text-center">
                <p>この機能は現在開発中です。</p>
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedPostType(null)}
                  className="mt-4"
                >
                  戻る
                </Button>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
