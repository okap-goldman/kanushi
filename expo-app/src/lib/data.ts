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

// User/Profile types
export interface UserProfile {
  id: string;
  name: string;
  username: string;
  email?: string;
  bio?: string;
  image?: string;
  location?: string;
  birth_date?: string;
  followers_count: number;
  following_count: number;
  posts_count: number;
  created_at: string;
  updated_at?: string;
}

// Message types
export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender?: UserProfile;
  receiver?: UserProfile;
}

export interface Conversation {
  id: string;
  participant_ids: string[];
  last_message?: Message;
  unread_count?: number;
  created_at: string;
  updated_at?: string;
  participants?: UserProfile[];
}

// Event types
export interface Event {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  location?: string;
  image_url?: string;
  organizer_id: string;
  organizer?: UserProfile;
  attendees_count: number;
  created_at: string;
  updated_at?: string;
}

// Shop/E-commerce types
export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  stock_quantity: number;
  category?: string;
  seller_id: string;
  seller?: UserProfile;
  created_at: string;
  updated_at?: string;
}

export interface OrderItem {
  id: string;
  product_id: string;
  product?: Product;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  user_id: string;
  items: OrderItem[];
  total_amount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  created_at: string;
  updated_at?: string;
}

// Story types
export interface Story {
  id: string;
  user_id: string;
  user?: UserProfile;
  content_type: ContentType;
  content_url: string;
  caption?: string;
  viewers_count: number;
  created_at: string;
  expires_at: string;
}

// Search types
export interface SearchResult {
  id: string;
  type: 'user' | 'post' | 'event' | 'product';
  title: string;
  description?: string;
  image_url?: string;
  relevance_score?: number;
}