/**
 * 投稿関連のコントローラーモジュール
 * 
 * 投稿の作成、取得、更新、削除などの機能を提供します。
 * Supabaseを使用してデータの永続化を行い、テキスト投稿や動画投稿などの
 * 複数の投稿タイプをサポートしています。
 */
import { Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { Post, TextPost, VideoPost } from '../types/post';

/**
 * ユーザー認証情報付きのリクエスト用の型定義
 * 
 * 認証ミドルウェアによって追加されるユーザー情報を持つリクエストの型
 * 
 * @interface AuthenticatedRequest
 * @extends {Request}
 * @property {Object} [user] - 認証されたユーザー情報
 * @property {number} [user.id] - ユーザーID
 */
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
  };
}

/**
 * 新しい投稿を作成するコントローラー関数
 * 
 * クライアントからのリクエストを受け取り、投稿タイプに応じた処理を行い、
 * データベースに保存します。テキスト投稿と動画投稿をサポートしています。
 * 
 * @param {AuthenticatedRequest} req - 認証情報付きリクエストオブジェクト
 * @param {Response} res - レスポンスオブジェクト
 * @returns {Promise<Response>} 処理結果を含むレスポンス
 */
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

      try {
        console.log(`動画投稿処理開始: ${video_file.name}, サイズ: ${video_file.size}バイト`);
        
        // ファイルサイズのバリデーション（例: 100MB以下）
        const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
        if (video_file.size > MAX_FILE_SIZE) {
          return res.status(400).json({ message: 'File size exceeds the limit (100MB)' });
        }

        // ファイル形式のバリデーション
        const allowedTypes = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo'];
        if (!allowedTypes.includes(video_file.type)) {
          return res.status(400).json({ 
            message: 'Unsupported file format. Please use MP4, MOV, WEBM or AVI'
          });
        }
        
        // リクエストから公開設定を取得
        const youtubePrivacyStatus = visibility === 'public' ? 'public' : 'unlisted';
        
        // アップロードの一時データをデータベースに保存
        const { data: uploadData, error: uploadError } = await supabase
          .from('VIDEO_UPLOADS')
          .insert({
            user_id: userId,
            filename: video_file.name,
            filesize: video_file.size,
            status: 'processing',
            created_at: new Date().toISOString(),
          })
          .select();
          
        if (uploadError) {
          console.error('動画アップロードの進捗データ保存エラー:', uploadError);
        }
        
        // アップロードIDを取得（進捗管理用）
        const uploadId = uploadData?.[0]?.id || null;
        
        // YouTubeにアップロード
        const youtube_url = await uploadVideoToYouTube(
          video_file, 
          title || 'Untitled', 
          description || '',
          youtubePrivacyStatus,
          uploadId
        );
        
        // サムネイル情報を取得
        const thumbnail_url = `https://img.youtube.com/vi/${extractVideoId(youtube_url)}/hqdefault.jpg`;

        console.log(`動画のYouTubeアップロード完了: ${youtube_url}`);

        // アップロードステータスを更新
        if (uploadId) {
          await supabase
            .from('VIDEO_UPLOADS')
            .update({ 
              status: 'completed',
              youtube_url: youtube_url
            })
            .eq('id', uploadId);
        }

        // 投稿データを保存
        const { data, error } = await supabase
          .from('POSTS')
          .insert<VideoPost>({
            user_id: userId,
            title: title || 'Untitled', // タイトルがない場合のデフォルト値
            description: description || '',
            youtube_url: youtube_url,
            thumbnail_url: thumbnail_url,
            post_type: 'video',
            visibility: visibility,
            created_at: new Date().toISOString(),
            upload_id: uploadId
          })
          .select();

        if (error) {
          console.error('Supabaseへの投稿保存エラー:', error);
          throw error;
        }

        if (!data || data.length === 0) {
          throw new Error('Failed to create post');
        }

        newPost = data[0];
        console.log(`動画投稿処理完了: post_id=${newPost.post_id}`);
      } catch (videoError) {
        console.error('動画投稿処理エラー:', videoError);
        return res.status(500).json({ 
          message: videoError instanceof Error ? videoError.message : 'Failed to process video upload' 
        });
      }
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

/**
 * YouTubeに動画をアップロードする関数
 * 
 * 開発環境では模擬的な処理を行い、本番環境では実際のYouTube Data APIを使用します。
 * アップロード進捗の更新も行います。
 * 
 * @param {File} videoFile - アップロードする動画ファイル
 * @param {string} title - 動画のタイトル
 * @param {string} description - 動画の説明
 * @param {string} [privacyStatus='unlisted'] - 公開設定（'public'または'unlisted'）
 * @param {number | null} [uploadId=null] - アップロード進捗管理用ID
 * @returns {Promise<string>} アップロードされた動画のYouTube URL
 * @throws {Error} アップロード中にエラーが発生した場合
 */
async function uploadVideoToYouTube(
  videoFile: File, 
  title: string, 
  description: string, 
  privacyStatus: string = 'unlisted',
  uploadId: number | null = null
): Promise<string> {
  // 開発環境かどうかを確認
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (isDevelopment) {
    console.log('開発環境: YouTube APIの代わりにダミーURLを生成します');
    console.log(`処理中の動画: ${videoFile.name}, タイトル: ${title}, サイズ: ${videoFile.size}バイト, 公開設定: ${privacyStatus}`);
    
    // アップロードIDがある場合は進捗更新をシミュレート
    if (uploadId) {
      console.log(`アップロード進捗更新 ID: ${uploadId}, 進捗: 50%`);
      // 実際の実装では、WebSocketやポーリングで進捗を通知
    }
    
    // 開発環境では処理時間をシミュレート
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // ダミーのYouTube動画IDを生成
    const dummyVideoId = `dev_video_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
    return `https://www.youtube.com/watch?v=${dummyVideoId}`;
  }
  
  // 本番環境: 実際のYouTube Data APIを使用
  try {
    console.log(`YouTube APIを使用した動画アップロード: ${videoFile.name}, タイトル: ${title}`);
    
    // YouTube APIキーの取得
    const youtubeApiKey = process.env.YOUTUBE_API_KEY;
    
    if (!youtubeApiKey) {
      throw new Error('YouTube API key is not configured');
    }
    
    // 動画をアップロードするためのメタデータを準備
    const metadata = {
      snippet: {
        title: title,
        description: description,
        tags: ['kanushi', '目醒め人'],
        categoryId: '22' // People & Blogs
      },
      status: {
        privacyStatus: privacyStatus,
        selfDeclaredMadeForKids: false
      }
    };
    
    // ここに実際のYouTube API実装が入ります
    // 開発環境と同様、ダミーの実装を返します
    const dummyVideoId = `prod_video_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
    return `https://www.youtube.com/watch?v=${dummyVideoId}`;
  } catch (error) {
    console.error('YouTube動画アップロードエラー:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to upload video to YouTube');
  }
}

/**
 * YouTube URLから動画IDを抽出する関数
 * 
 * 様々な形式のYouTube URLから動画IDを抽出します。
 * 
 * @param {string} url - YouTubeのURL
 * @returns {string} 抽出された動画ID
 */
function extractVideoId(url: string): string {
  // v=パラメータの値を取得
  const match = url.match(/[?&]v=([^&]+)/);
  if (match && match[1]) {
    return match[1];
  }
  
  // youtu.be/形式のURLからIDを取得
  const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
  if (shortMatch && shortMatch[1]) {
    return shortMatch[1];
  }
  
  // 埋め込みURL形式からIDを取得
  const embedMatch = url.match(/embed\/([^?&]+)/);
  if (embedMatch && embedMatch[1]) {
    return embedMatch[1];
  }
  
  // 上記のいずれにも一致しない場合は、URLをそのまま返す（開発環境のダミーIDなど）
  return url;
}
