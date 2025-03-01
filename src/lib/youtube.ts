import { auth } from './firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

// YouTube API関連のエラークラス
export class YouTubeUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'YouTubeUploadError';
  }
}

// YouTube APIの認証情報を取得する関数
export const getYouTubeAuthToken = async (): Promise<string> => {
  try {
    // 現在のユーザーを取得
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new YouTubeUploadError('ログインが必要です。');
    }

    // GoogleAuthProviderを作成し、YouTubeのスコープを追加
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/youtube.upload');
    
    // ポップアップでGoogle認証を行う
    const result = await signInWithPopup(auth, provider);
    
    // GoogleAuthProviderからトークンを取得
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential) {
      throw new YouTubeUploadError('認証情報の取得に失敗しました。');
    }
    
    return credential.accessToken || '';
  } catch (error) {
    console.error('YouTube認証エラー:', error);
    throw new YouTubeUploadError('YouTube認証に失敗しました。もう一度お試しください。');
  }
};

interface UploadVideoOptions {
  title?: string;
  description?: string;
  isPublic: boolean;
}

// 動画をYouTubeにアップロードする関数
export const uploadVideo = async (
  videoBlob: Blob,
  options: UploadVideoOptions
): Promise<string> => {
  try {
    // YouTube APIの認証トークンを取得
    const accessToken = await getYouTubeAuthToken();
    
    // FormDataを作成
    const formData = new FormData();
    
    // メタデータを作成
    const metadata = {
      snippet: {
        title: options.title || `動画投稿 ${new Date().toLocaleString('ja-JP')}`,
        description: options.description || '',
        categoryId: '22', // People & Blogs
      },
      status: {
        privacyStatus: options.isPublic ? 'public' : 'unlisted',
        embeddable: true,
      },
    };
    
    // メタデータをBlobに変換してFormDataに追加
    const metadataBlob = new Blob([JSON.stringify(metadata)], { type: 'application/json' });
    formData.append('metadata', metadataBlob);
    
    // 動画ファイルをFormDataに追加
    formData.append('video', videoBlob, 'video.webm');
    
    // YouTube Data API v3を使用して動画をアップロード
    const response = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?part=snippet,status&uploadType=multipart', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('YouTube APIエラー:', errorData);
      throw new YouTubeUploadError('動画のアップロードに失敗しました。もう一度お試しください。');
    }
    
    const data = await response.json();
    return `https://www.youtube.com/embed/${data.id}`;
  } catch (error) {
    console.error('動画アップロードエラー:', error);
    if (error instanceof YouTubeUploadError) {
      throw error;
    }
    throw new YouTubeUploadError('動画のアップロードに失敗しました。もう一度お試しください。');
  }
};

// YouTubeの埋め込みURLを生成する関数
export const getYouTubeEmbedUrl = (videoId: string): string => {
  return `https://www.youtube.com/embed/${videoId}`;
};

// YouTubeの動画IDを埋め込みURLから抽出する関数
export const getYouTubeVideoId = (embedUrl: string): string | null => {
  const match = embedUrl.match(/embed\/([^/?]+)/);
  return match ? match[1] : null;
};
