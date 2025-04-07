/**
 * 投稿コンポーネントモジュール
 * 
 * ソーシャルメディア風の投稿表示コンポーネントを提供します。
 * テキスト、画像、動画、音声などの各種メディアタイプをサポートしています。
 */
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { PostHeader } from "./post/PostHeader";
import { PostContent } from "./post/PostContent";
import { PostActions } from "./post/PostActions";
import { PostComments } from "./post/PostComments";
import { Dialog, DialogContent, DialogDescription } from "@/components/ui/dialog";

/**
 * 投稿コンポーネントのプロパティ型定義
 * 
 * @typedef {Object} PostProps
 * @property {Object} author - 投稿者情報
 * @property {string} author.name - 投稿者名
 * @property {string} author.image - 投稿者のプロフィール画像URL
 * @property {string} author.id - 投稿者のID
 * @property {string} content - 投稿内容（テキストまたはメディアのURL）
 * @property {string} [caption] - 画像や動画に添付するキャプション
 * @property {"text" | "image" | "video" | "audio"} mediaType - 投稿のメディアタイプ
 */
interface PostProps {
  author: {
    name: string;
    image: string;
    id: string;
  };
  content: string;
  caption?: string;
  mediaType: "text" | "image" | "video" | "audio";
}

/**
 * 投稿コンポーネント
 * 
 * テキスト、画像、動画、音声などの各種メディアタイプに対応した投稿を表示します。
 * 投稿をクリックすると詳細表示ダイアログが開き、コメントの表示・追加も可能です。
 * 
 * @param {PostProps} props - 投稿コンポーネントのプロパティ
 * @param {Object} props.author - 投稿者情報
 * @param {string} props.content - 投稿内容
 * @param {string} [props.caption] - オプションのキャプション
 * @param {"text" | "image" | "video" | "audio"} props.mediaType - 投稿のメディアタイプ
 * @returns {JSX.Element} 投稿コンポーネント
 */
export function Post({ author, content, caption, mediaType }: PostProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showFullPost, setShowFullPost] = useState(false);

  return (
    <Card className="p-4 space-y-4">
      <PostHeader author={author} />
      
      <div 
        onClick={() => mediaType !== "text" && mediaType !== "audio" && setShowFullPost(true)}
        className={mediaType !== "text" && mediaType !== "audio" ? "cursor-pointer" : ""}
      >
        <PostContent
          content={content}
          caption={caption}
          mediaType={mediaType}
          isExpanded={isExpanded}
          setIsExpanded={setIsExpanded}
        />
      </div>

      <PostActions
        postId="1"
        onComment={() => setShowComments(true)}
      />

      <Dialog open={showComments} onOpenChange={setShowComments}>
        <DialogContent className="sm:max-w-md">
          <DialogDescription className="sr-only">
            コメントセクション
          </DialogDescription>
          <PostComments
            postId="1"
            comments={[
              {
                id: "1",
                author: {
                  name: "テストユーザー",
                  image: "https://api.dicebear.com/7.x/avataaars/svg?seed=test",
                },
                content: "素晴らしい投稿ですね！",
                createdAt: new Date().toISOString(),
              },
            ]}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showFullPost} onOpenChange={setShowFullPost}>
        <DialogContent className="max-w-3xl">
          <DialogDescription className="sr-only">
            投稿の詳細
          </DialogDescription>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PostContent
              content={content}
              mediaType={mediaType}
              isExpanded={true}
              setIsExpanded={setIsExpanded}
            />
            <div className="space-y-4">
              <PostHeader author={author} />
              {caption && (
                <p className="text-sm whitespace-pre-wrap">{caption}</p>
              )}
              <PostActions
                postId="1"
                onComment={() => setShowComments(true)}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}