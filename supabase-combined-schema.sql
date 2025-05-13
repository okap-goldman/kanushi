-- Kanushiアプリケーション用の統合Supabase Schema

-- 既存のテーブルが存在する場合はCASCADEで削除
DROP TABLE IF EXISTS story_views CASCADE;
DROP TABLE IF EXISTS stories CASCADE;
DROP TABLE IF EXISTS message_reactions CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversation_participants CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS likes CASCADE;
DROP TABLE IF EXISTS comments CASCADE; 
DROP TABLE IF EXISTS post_tags CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Create profiles table (for users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  image TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create posts table
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('text', 'image', 'video', 'audio')),
  text_content TEXT,
  media_url TEXT,
  audio_url TEXT,
  thumbnail_url TEXT,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  timeline_type TEXT DEFAULT 'family' CHECK (timeline_type IN ('family', 'watch', 'all')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create comments table
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tags table
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create post_tags junction table
CREATE TABLE post_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (post_id, tag_id)
);

-- Create likes table (for tracking user likes)
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (post_id, user_id)
);

-- Create conversations table to track conversations between users
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create conversation_participants to track users in each conversation
-- This supports both 1:1 and group conversations
CREATE TABLE conversation_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_admin BOOLEAN DEFAULT FALSE,
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

-- Create messages table to store actual messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT,
  content_type TEXT DEFAULT 'text' CHECK (content_type IN ('text', 'image', 'video', 'audio')),
  media_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Create message_reactions table to track emoji reactions
CREATE TABLE message_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reaction TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id, reaction)
);

-- Create stories table
CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('image', 'video')),
  media_url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '24 hours'
);

-- Create story_views table to track who viewed a story
CREATE TABLE story_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(story_id, user_id)
);

-- Functions and Triggers for Posts

-- Functions to manage like counts
CREATE OR REPLACE FUNCTION increment_like_count(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE posts
  SET likes_count = likes_count + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_like_count(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE posts
  SET likes_count = likes_count - 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to increment comment count
CREATE OR REPLACE FUNCTION increment_comment_count(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE posts
  SET comments_count = comments_count + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- Functions and Triggers for Messages

-- Functions to update conversation timestamps
CREATE OR REPLACE FUNCTION update_conversation_timestamp(conversation_id_param UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE conversations
  SET updated_at = NOW()
  WHERE id = conversation_id_param;
END;
$$ LANGUAGE plpgsql;

-- Note: Instead of trigger, call this function directly from application code
-- when inserting a new message: update_conversation_timestamp(conversation_id);

-- Functions to manage message read status
CREATE OR REPLACE FUNCTION update_participant_last_read(conversation_id_param UUID, user_id_param UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE conversation_participants
  SET last_read_at = NOW()
  WHERE conversation_id = conversation_id_param AND user_id = user_id_param;
END;
$$ LANGUAGE plpgsql;

-- Note: Instead of trigger, call this function directly from application code
-- when sending a message: update_participant_last_read(conversation_id, user_id);

-- Functions and Triggers for Stories

-- Instead of using triggers, we'll create a stored procedure that can be called directly
CREATE OR REPLACE FUNCTION increment_story_view(story_id_param UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE stories
  SET views_count = views_count + 1
  WHERE id = story_id_param;
END;
$$ LANGUAGE plpgsql;

-- Function to delete expired stories
CREATE OR REPLACE FUNCTION delete_expired_stories()
RETURNS VOID AS $$
BEGIN
  DELETE FROM stories
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Helper function to create a new 1:1 conversation
CREATE OR REPLACE FUNCTION create_direct_conversation(user1_id UUID, user2_id UUID)
RETURNS UUID AS $$
DECLARE
  conversation_id UUID;
  existing_conversation_id UUID;
BEGIN
  -- Check if there's already a direct conversation between these users
  SELECT cp1.conversation_id INTO existing_conversation_id
  FROM conversation_participants cp1
  JOIN conversation_participants cp2 ON cp1.conversation_id = cp2.conversation_id
  JOIN (
    -- Get only conversations with exactly 2 participants
    SELECT conversation_id, COUNT(*) as participant_count
    FROM conversation_participants
    GROUP BY conversation_id
    HAVING COUNT(*) = 2
  ) counts ON counts.conversation_id = cp1.conversation_id
  WHERE cp1.user_id = user1_id AND cp2.user_id = user2_id;
  
  -- Return existing conversation if found
  IF existing_conversation_id IS NOT NULL THEN
    RETURN existing_conversation_id;
  END IF;
  
  -- Create new conversation
  INSERT INTO conversations DEFAULT VALUES RETURNING id INTO conversation_id;
  
  -- Add participants
  INSERT INTO conversation_participants (conversation_id, user_id)
  VALUES (conversation_id, user1_id), (conversation_id, user2_id);
  
  RETURN conversation_id;
END;
$$ LANGUAGE plpgsql;

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_conversation_as_read(conversation_id_param UUID, user_id_param UUID)
RETURNS VOID AS $$
BEGIN
  -- Update last_read_at timestamp
  UPDATE conversation_participants
  SET last_read_at = NOW()
  WHERE conversation_id = conversation_id_param AND user_id = user_id_param;
  
  -- Mark all messages as read
  UPDATE messages
  SET is_read = TRUE
  WHERE conversation_id = conversation_id_param
    AND user_id <> user_id_param
    AND created_at <= NOW();
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can delete own profile"
  ON profiles FOR DELETE
  USING (auth.uid() = id);

-- RLS Policies for posts
CREATE POLICY "Public posts are viewable by everyone"
  ON posts FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert posts"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for comments
CREATE POLICY "Public comments are viewable by everyone"
  ON comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert comments"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for likes
CREATE POLICY "Public likes are viewable by everyone"
  ON likes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert likes"
  ON likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes"
  ON likes FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for tags
CREATE POLICY "Public tags are viewable by everyone"
  ON tags FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert tags"
  ON tags FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can update tags"
  ON tags FOR UPDATE
  USING (auth.uid() IN (
    SELECT id FROM profiles WHERE username = 'admin'
  ));

CREATE POLICY "Admins can delete tags"
  ON tags FOR DELETE
  USING (auth.uid() IN (
    SELECT id FROM profiles WHERE username = 'admin'
  ));

-- RLS Policies for post_tags
CREATE POLICY "Public post_tags are viewable by everyone"
  ON post_tags FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert post_tags"
  ON post_tags FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM posts WHERE id = post_id
    )
  );

CREATE POLICY "Users can update own post_tags"
  ON post_tags FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM posts WHERE id = post_id
    )
  );

CREATE POLICY "Users can delete own post_tags"
  ON post_tags FOR DELETE
  USING (
    auth.uid() IN (
      SELECT user_id FROM posts WHERE id = post_id
    )
  );

-- RLS Policies for conversations
CREATE POLICY "Users can view conversations they're part of"
  ON conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = conversations.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Any user can create a conversation"
  ON conversations FOR INSERT
  WITH CHECK (true);

-- RLS Policies for conversation_participants
CREATE POLICY "Users can view participants of their conversations"
  ON conversation_participants FOR SELECT
  USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add participants if they are in conversation"
  ON conversation_participants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = conversation_participants.conversation_id AND user_id = auth.uid()
    )
  );

-- RLS Policies for messages
CREATE POLICY "Users can view messages in conversations they're part of"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages to their conversations"
  ON messages FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own messages"
  ON messages FOR UPDATE
  USING (
    user_id = auth.uid()
  );

-- RLS Policies for message_reactions
CREATE POLICY "Users can view reactions in conversations they're part of"
  ON message_reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN conversation_participants cp ON m.conversation_id = cp.conversation_id
      WHERE m.id = message_reactions.message_id AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add reactions to messages in their conversations"
  ON message_reactions FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM messages m
      JOIN conversation_participants cp ON m.conversation_id = cp.conversation_id
      WHERE m.id = message_reactions.message_id AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove their own reactions"
  ON message_reactions FOR DELETE
  USING (
    user_id = auth.uid()
  );

-- RLS Policies for stories
CREATE POLICY "Public stories are viewable by everyone"
  ON stories FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert stories"
  ON stories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own stories"
  ON stories FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for story_views
CREATE POLICY "Public story views are viewable by story owner"
  ON story_views FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = story_views.story_id
      AND stories.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can insert story views"
  ON story_views FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Sample data insertion can be added if needed
-- Sample tag data
INSERT INTO tags (name) VALUES 
  ('瞑想'),
  ('スピリチュアル'),
  ('マインドフルネス'),
  ('ヒーリング'),
  ('心の成長'),
  ('ヨガ'),
  ('エネルギーワーク'),
  ('タロット'),
  ('自己啓発'),
  ('自然');

-- 最初にプロフィールが存在するか確認し、必要なら挿入する
DO $$
DECLARE
    user1_exists BOOLEAN;
    user2_exists BOOLEAN;
    user3_exists BOOLEAN;
    user4_exists BOOLEAN;
BEGIN
    -- 各ユーザーが存在するか確認
    SELECT EXISTS (SELECT 1 FROM profiles WHERE id = '00000000-0000-0000-0000-000000000001') INTO user1_exists;
    SELECT EXISTS (SELECT 1 FROM profiles WHERE id = '00000000-0000-0000-0000-000000000002') INTO user2_exists;
    SELECT EXISTS (SELECT 1 FROM profiles WHERE id = '00000000-0000-0000-0000-000000000003') INTO user3_exists;
    SELECT EXISTS (SELECT 1 FROM profiles WHERE id = '00000000-0000-0000-0000-000000000004') INTO user4_exists;
    
    -- ユーザー1: 泉谷和久
    IF NOT user1_exists THEN
        INSERT INTO profiles (id, name, image, username, bio) 
        VALUES ('00000000-0000-0000-0000-000000000001', '泉谷和久', 'https://i.pravatar.cc/150?img=3', 'izutani', '瞑想とスピリチュアルの実践者、東京在住。');
    END IF;
    
    -- ユーザー2: Shota
    IF NOT user2_exists THEN
        INSERT INTO profiles (id, name, image, username, bio) 
        VALUES ('00000000-0000-0000-0000-000000000002', 'Shota', 'https://i.pravatar.cc/150?img=7', 'shota', 'エネルギーワークを探求している。大阪在住。');
    END IF;
    
    -- ユーザー3: Kanako
    IF NOT user3_exists THEN
        INSERT INTO profiles (id, name, image, username, bio) 
        VALUES ('00000000-0000-0000-0000-000000000003', 'Kanako', 'https://i.pravatar.cc/150?img=9', 'kanako', 'タロットカードリーダー、スピリチュアルコーチ。');
    END IF;
    
    -- ユーザー4: 内なる光
    IF NOT user4_exists THEN
        INSERT INTO profiles (id, name, image, username, bio) 
        VALUES ('00000000-0000-0000-0000-000000000004', '内なる光', 'https://i.pravatar.cc/150?img=13', 'inner_light', 'スピリチュアルな旅を共有します。');
    END IF;
END $$;

-- ストーリーズ機能のためのサンプルデータ
-- サンプルストーリーの挿入
INSERT INTO stories (id, user_id, content_type, media_url, thumbnail_url, caption, views_count, created_at, expires_at)
VALUES
  -- 泉谷和久さんのストーリー (画像)
  ('30000000-0000-0000-0000-000000000001', 
   '00000000-0000-0000-0000-000000000001', 
   'image',
   'https://images.unsplash.com/photo-1600618528240-fb9fc964b853',
   'https://images.unsplash.com/photo-1600618528240-fb9fc964b853',
   '今日の瞑想スポット。自然の中で心が落ち着きます✨',
   12,
   NOW() - INTERVAL '3 hours',
   NOW() + INTERVAL '21 hours'),
   
  -- 泉谷和久さんのストーリー2 (画像)
  ('30000000-0000-0000-0000-000000000002', 
   '00000000-0000-0000-0000-000000000001', 
   'image',
   'https://images.unsplash.com/photo-1555396273-367ea4eb4db5',
   'https://images.unsplash.com/photo-1555396273-367ea4eb4db5',
   '新しい本に出会いました。皆さんにもおすすめです📚',
   8,
   NOW() - INTERVAL '5 hours',
   NOW() + INTERVAL '19 hours'),
   
  -- Shotaさんのストーリー (動画)
  ('30000000-0000-0000-0000-000000000003', 
   '00000000-0000-0000-0000-000000000002', 
   'video',
   'https://player.vimeo.com/external/368763144.sd.mp4',
   'https://images.unsplash.com/photo-1533055640609-24b498dfd74c',
   '朝のエネルギーワーク。皆さんも一緒にやってみませんか？',
   24,
   NOW() - INTERVAL '8 hours',
   NOW() + INTERVAL '16 hours'),
   
  -- Kanakoさんのストーリー (画像)
  ('30000000-0000-0000-0000-000000000004', 
   '00000000-0000-0000-0000-000000000003', 
   'image',
   'https://images.unsplash.com/photo-1515940176183-c728f7e115ce',
   'https://images.unsplash.com/photo-1515940176183-c728f7e115ce',
   '今日引いたカード：「変容」✨ 新しい変化を受け入れる時期かもしれません',
   31,
   NOW() - INTERVAL '2 hours',
   NOW() + INTERVAL '22 hours'),
   
  -- 内なる光さんのストーリー (画像)
  ('30000000-0000-0000-0000-000000000005', 
   '00000000-0000-0000-0000-000000000004', 
   'image',
   'https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7',
   'https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7',
   '夕日の美しさに感謝。一日の終わりを静かに見つめる時間',
   15,
   NOW() - INTERVAL '4 hours',
   NOW() + INTERVAL '20 hours');

-- ストーリー閲覧のサンプルデータ
INSERT INTO story_views (story_id, user_id, viewed_at)
VALUES
  -- 泉谷和久さんのストーリーを閲覧したユーザー
  ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', NOW() - INTERVAL '2 hours'),
  ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', NOW() - INTERVAL '1 hour'),
  ('30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', NOW() - INTERVAL '1 hour'),
  
  -- Shotaさんのストーリーを閲覧したユーザー
  ('30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '2 hours'),
  ('30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', NOW() - INTERVAL '3 hours'),
  ('30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', NOW() - INTERVAL '1 hour'),
  
  -- Kanakoさんのストーリーを閲覧したユーザー
  ('30000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '30 minutes'),
  ('30000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000002', NOW() - INTERVAL '1 hour'),
  
  -- 内なる光さんのストーリーを閲覧したユーザー
  ('30000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '1 hour'),
  ('30000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000002', NOW() - INTERVAL '2 hours');