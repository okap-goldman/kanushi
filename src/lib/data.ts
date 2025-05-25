// Data models and types for the application

// Post types
export type ContentType = "text" | "image" | "video" | "audio";

export interface Author {
  id: string;
  name: string;
  image: string;
}

export interface Tag {
  id: string;
  name: string;
}

export interface Post {
  id: string;
  user_id: string;                // DB field
  author_id?: string;             // For API compatibility
  author: Author;
  content_type: ContentType;      // DB field
  text_content: string;           // DB field
  media_url?: string | null;      // DB field
  audio_url?: string | null;      // DB field
  thumbnail_url?: string | null;  // DB field
  content?: string;               // For API compatibility
  caption?: string;               // For API compatibility
  media_type?: ContentType;       // For API compatibility
  created_at: string;
  updated_at?: string;
  likes_count: number;
  comments_count: number;
  timeline_type?: "family" | "watch" | "all"; // Virtual field for UI
  tags?: Tag[];                  // Tags associated with the post
}

export interface Comment {
  id: string;
  post_id: string;
  user_id?: string;     // Actual DB field
  author_id: string;    // For API compatibility
  author: Author;
  content: string;
  created_at: string;
}

// API response types
export interface ApiResponse<T> {
  data: T | null;
  error: Error | null;
}