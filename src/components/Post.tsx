import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { PostHeader } from "./post/PostHeader";
import { PostContent } from "./post/PostContent";
import { PostActions } from "./post/PostActions";
import { PostComments } from "./post/PostComments";
import { Dialog, DialogContent, DialogDescription } from "@/components/ui/dialog";
import { MediaType } from "@/lib/data";
import { getComments } from "@/lib/postService";

interface PostProps {
  author: {
    name: string;
    image: string;
    id: string;
  };
  content: string;
  caption?: string;
  mediaType: MediaType;
  postId: string;
  tags?: { id: string; name: string }[];
}

export function Post({ author, content, caption, mediaType, postId, tags = [] }: PostProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showFullPost, setShowFullPost] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  // 投稿のコメントを取得する関数
  const fetchComments = async () => {
    if (!showComments) return;
    
    setIsLoadingComments(true);
    try {
      const { data, error } = await getComments(postId);
      if (error) throw error;
      if (data) {
        setComments(data);
      }
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    } finally {
      setIsLoadingComments(false);
    }
  };

  // コメントダイアログが開かれた時にコメントを取得
  useEffect(() => {
    if (showComments) {
      fetchComments();
    }
  }, [showComments]);

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
      
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {tags.map(tag => (
            <span 
              key={tag.id}
              className="text-xs px-2 py-0.5 bg-slate-100 text-primary rounded-full"
            >
              #{tag.name}
            </span>
          ))}
        </div>
      )}

      <PostActions
        postId={postId}
        onComment={() => setShowComments(true)}
      />

      <Dialog open={showComments} onOpenChange={setShowComments}>
        <DialogContent className="sm:max-w-md">
          <DialogDescription className="sr-only">
            コメントセクション
          </DialogDescription>
          <PostComments
            postId={postId}
            comments={comments}
            isLoading={isLoadingComments}
            onCommentAdded={fetchComments}
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
              
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {tags.map(tag => (
                    <span 
                      key={tag.id}
                      className="text-xs px-2 py-0.5 bg-slate-100 text-primary rounded-full"
                    >
                      #{tag.name}
                    </span>
                  ))}
                </div>
              )}
              
              <PostActions
                postId={postId}
                onComment={() => setShowComments(true)}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}