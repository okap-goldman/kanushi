import { Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { Post, TextPost, VideoPost } from '../types/post';

// ユーザー認証情報付きのリクエスト用の型定義
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
  };
}

export const createPost = async (req: AuthenticatedRequest, res: Response) => {
  // 認証ミドルウェアでreq.userにユーザー情報が格納されていることを想定
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const {
    title,
    text_content,
    post_type,
    visibility,
    description,
    video_file,
  }: {
    title?: string;
    text_content?: string;
    post_type: string;
    visibility: 'public' | 'private' | 'followers';
    description?: string;
    video_file?: File;
  } = req.body;

  if (!['public', 'private', 'followers'].includes(visibility)) {
    return res.status(400).json({
      statusCode: 400,
      message: 'Invalid visibility'
    });
  }

  // 投稿タイプに応じた処理分岐
  try {
    let newPost;

    if (post_type === 'text') {
      // テキスト投稿のバリデーション
      if (!text_content) {
        return res.status(400).json({ message: 'Missing required fields: text_content' });
      }

      // titleが存在する場合は、文字数制限を設ける（例：100文字）
      if (title && title.length > 100) {
        return res.status(400).json({ message: 'Title must be less than 100 characters' });
      }

      // text_contentの文字数制限を設ける（最大10,000文字）
      if (text_content.length > 10000) {
        return res.status(400).json({ message: 'Text content must be less than 10,000 characters' });
      }

      const { data, error } = await supabase
        .from('POSTS')
        .insert<TextPost>({
          user_id: userId,
          title: title,
          text_content: text_content,
          post_type: 'text',
          visibility: visibility,
        })
        .select();

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error('Failed to create post');
      }

      newPost = data[0];
    } 
    else if (post_type === 'video') {
      // 動画投稿のバリデーション
      if (!video_file) {
        return res.status(400).json({ message: 'Missing required fields: video_file' });
      }

      // ここではYouTube APIとの連携を仮実装
      // 実際の実装では、YouTubeにアップロードし、URLを取得する処理が必要
      const youtube_url = await uploadVideoToYouTube(video_file, title || 'Untitled', description || '');
      const thumbnail_url = `https://img.youtube.com/vi/${extractVideoId(youtube_url)}/hqdefault.jpg`;

      const { data, error } = await supabase
        .from('POSTS')
        .insert<VideoPost>({
          user_id: userId,
          title: title,
          description: description,
          youtube_url: youtube_url,
          thumbnail_url: thumbnail_url,
          post_type: 'video',
          visibility: visibility,
        })
        .select();

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error('Failed to create post');
      }

      newPost = data[0];
    }
    else {
      return res.status(400).json({ message: 'Invalid post type' });
    }

    res.status(201).json(newPost);
  } catch (error) {
    console.error('Error creating post:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    res.status(500).json({ message: errorMessage });
  }
};

// YouTubeにビデオをアップロードする関数（仮実装）
// 実際の実装では、YouTube Data APIを使用して実装する
async function uploadVideoToYouTube(videoFile: File, title: string, description: string): Promise<string> {
  // 実際のアップロード処理の代わりに、ダミーのYouTube URLを返す
  // この部分は後でYouTube Data APIを使った実装に置き換える
  console.log(`Uploading video: ${videoFile.name}, Title: ${title}, Description: ${description}`);
  
  // ダミーのYouTube動画IDを生成
  const dummyVideoId = `video_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
  
  // 本番環境では実際のYouTube URLを返す
  return `https://www.youtube.com/watch?v=${dummyVideoId}`;
}

// YouTube URLからビデオIDを抽出する関数
function extractVideoId(url: string): string {
  const regex = /[?&]v=([^&#]*)/;
  const match = url.match(regex);
  return match ? match[1] : '';
}
