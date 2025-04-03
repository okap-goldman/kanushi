export interface Post {
  post_id?: number;
  user_id: number;
  post_type: string;
  created_at?: string;
  updated_at?: string;
  visibility: 'public' | 'private' | 'followers';
}

export interface TextPost extends Post {
  title?: string;
  text_content: string;
}

export interface VideoPost extends Post {
  title?: string;
  description?: string;
  youtube_url: string;
  thumbnail_url?: string;
  upload_id?: number | null;
}