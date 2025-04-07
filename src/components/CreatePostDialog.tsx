/**
 * 投稿作成ダイアログモジュール
 * 
 * ユーザーが新しい投稿を作成するためのダイアログコンポーネントを提供します。
 * テキスト、動画、音声、ストーリーなど、複数の投稿タイプをサポートしています。
 */
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Video, Mic, BookText, History } from "lucide-react";
import { useState } from "react";
import { TextPostForm } from "@/components/post/TextPostForm";
import { VideoPostForm } from "@/components/post/VideoPostForm";
import { createPost } from "@/controllers/posts";
import { useToast } from "@/hooks/use-toast";

/**
 * 投稿作成ダイアログのプロパティ型定義
 * 
 * @interface CreatePostDialogProps
 * @property {boolean} isOpen - ダイアログが開いているかどうかを示すフラグ
 * @property {Function} onClose - ダイアログを閉じる際に呼び出されるコールバック関数
 */
interface CreatePostDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * APIレスポンスの型定義
 * 
 * @interface PostResponse
 * @property {number} post_id - 作成された投稿のID
 * @property {unknown} [key: string] - その他のプロパティ
 */
interface PostResponse {
  post_id: number;
  [key: string]: unknown;
}

/**
 * 投稿作成ダイアログコンポーネント
 * 
 * ユーザーが選択した投稿タイプに基づいて適切なフォームを表示し、
 * 投稿の作成処理を行います。作成中はローディング表示、成功・失敗時には
 * トースト通知を表示します。
 * 
 * @param {CreatePostDialogProps} props - コンポーネントのプロパティ
 * @param {boolean} props.isOpen - ダイアログの表示状態
 * @param {Function} props.onClose - ダイアログを閉じるコールバック
 * @returns {JSX.Element} 投稿作成ダイアログコンポーネント
 */
export function CreatePostDialog({ isOpen, onClose }: CreatePostDialogProps) {
  const [selectedPostType, setSelectedPostType] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  /**
   * 投稿タイプの定義
   * アイコン、ラベル、値を含むオブジェクトの配列
   */
  const postTypes = [
    { icon: Video, label: "動画・画像", value: "media" },
    { icon: Mic, label: "音声", value: "audio" },
    { icon: BookText, label: "テキスト", value: "text" },
    { icon: History, label: "ストーリーズ", value: "story" },
  ];

  /**
   * 投稿タイプを選択した際のハンドラー
   * 
   * @param {string} type - 選択された投稿タイプ
   */
  const handlePostTypeSelect = (type: string) => {
    setSelectedPostType(type);
  };

  /**
   * テキスト投稿フォームの送信ハンドラー
   * 
   * タイトルとテキスト内容を受け取り、APIを通じて投稿を作成します。
   * 成功時にはトースト通知を表示し、ダイアログを閉じます。
   * 
   * @param {string} title - 投稿のタイトル
   * @param {string} text_content - 投稿のテキスト内容
   */
  const handleTextSubmit = async (title: string, text_content: string) => {
    try {
      // @ts-expect-error createPost の仮実装のため、型エラーを一時的に無視
      const response = await createPost({
        body: {
          title,
          text_content,
          post_type: 'text',
          visibility: 'public', // 仮の値
        },
      }) as PostResponse;

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

  /**
   * 動画投稿フォームの送信ハンドラー
   * 
   * 動画ファイル、説明文、公開設定を受け取り、APIを通じて投稿を作成します。
   * 処理中はローディング表示を行い、成功時にはトースト通知を表示し、ダイアログを閉じます。
   * 
   * @param {File} videoFile - アップロードする動画ファイル
   * @param {string} description - 動画の説明文
   * @param {boolean} isPublic - 公開設定（true: 公開、false: 非公開）
   */
  const handleVideoSubmit = async (videoFile: File, description: string, isPublic: boolean) => {
    if (!videoFile) {
      toast({
        title: "エラー",
        description: "動画ファイルが選択されていません。",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      console.log(`動画投稿を開始: ${videoFile.name}, サイズ: ${videoFile.size}バイト`);
      
      // @ts-expect-error createPost の仮実装のため、型エラーを一時的に無視
      const response = await createPost({
        body: {
          video_file: videoFile,
          title: description.substring(0, 50), // 説明文の最初の50文字をタイトルとして使用
          description,
          post_type: 'video',
          visibility: isPublic ? 'public' : 'private',
        },
      }) as PostResponse;

      if (response && response.post_id) {
        console.log(`動画投稿成功: post_id=${response.post_id}`);
        toast({
          title: "投稿成功",
          description: "動画投稿が作成されました。YouTubeへのアップロードを開始しました。",
        });
        onClose();
        setSelectedPostType(null); // フォームをリセット
      } else {
        throw new Error('レスポンスにpost_idが含まれていません');
      }
    } catch (error) {
      console.error('動画投稿エラー:', error);
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : "投稿に失敗しました。再度お試しください。",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open && !isLoading) {
        onClose();
      }
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新規投稿を作成</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
            <p className="text-sm text-gray-500">処理中...</p>
          </div>
        ) : !selectedPostType ? (
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
