-- Create profiles table (for users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  image TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('text', 'image', 'video', 'audio')),
  text_content TEXT,
  media_url TEXT,
  audio_url TEXT,
  thumbnail_url TEXT,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  timeline_type TEXT NOT NULL CHECK (timeline_type IN ('family', 'watch', 'all')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create likes table (for tracking user likes)
CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (post_id, user_id)
);

-- Create function to increment like count
CREATE OR REPLACE FUNCTION increment_like_count(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE posts
  SET likes_count = likes_count + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to decrement like count
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

-- Insert sample profiles data
INSERT INTO profiles (id, name, image, username, bio)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'かずぴー⭐︎ 【泉谷 和久】', 'https://kuripura.s3.us-east-1.amazonaws.com/kazup.jpg', 'kazu993_ascensionlife', '泉谷和久です。スピリチュアルな学びと日常を発信しています。'),
  ('00000000-0000-0000-0000-000000000002', 'Shota | 宇宙くん', 'https://cdn.peraichi.com/userData/5e92b452-dcb8-4abc-a728-72d20a0000fe/img/660caeff26c50/original.jpg', 'uchu_kun__shota', '日々の気づきを共有しています。'),
  ('00000000-0000-0000-0000-000000000003', 'Kanako | スピリチュアルヒーラー', 'https://kuripura.s3.us-east-1.amazonaws.com/Kanako.jpg', 'nkmrknk694', 'ヒーラー・占い師として活動しています。'),
  ('00000000-0000-0000-0000-000000000004', '内なる光', 'https://api.dicebear.com/7.x/avataaars/svg?seed=4', 'inner_light', 'スピリチュアルな気づきを共有しています。');

-- Insert sample posts data
INSERT INTO posts (id, user_id, content_type, text_content, media_url, thumbnail_url, likes_count, comments_count, timeline_type)
VALUES
  -- Text post
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 
   'text',
   '僕の朝のルーティーン
    
朝起きて、まずは自分の部屋にご挨拶します✨

部屋を神殿として扱っているので♪

家はもちろんですが、特に自分の部屋のエネルギーは、自分の心の深いところと繋がってるので、扱い方を丁寧にするのがお勧めです🏠

部屋の状態と、心の裏側はとても似た姿をしています❤️', 
   NULL, NULL, 15, 3, 'family'),
  
  -- Image post
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003',
   'image',
   '🃏11月のカードリーディング🃏

各々のなかの正義がはっきりさせる。
自分はどうしたいのか、
どう生きてどう在りたいのか。
私の中の大切なものってなんだっけ？
そこがハッキリしてないと
この先どうしたらいいのかが分からなくなりやすい。
誰かが決めてくれることじゃない。
慈愛を自分自身に向け、
内に秘めたものととことん向き合う時期。

各々の中の正義がハッキリしてくるからこそ
言い方ものの伝え方をより丁寧に。
自分の中から溢れ出る情熱や熱量を
相手の中にも正義があることを踏まえた上で
いかに丁寧に誠実に表現していくかがポイント。',
   'https://kuripura.s3.us-east-1.amazonaws.com/image.jpg',
   'https://kuripura.s3.us-east-1.amazonaws.com/image.jpg',
   42, 7, 'family'),
  
  -- Audio post
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002',
   'audio',
   'ただバスケを見た話。笑',
   NULL,
   NULL,
   8, 1, 'family'),
  
  -- Video post
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000004',
   'video',
   'この動画から多くの気づきを得ました。皆さんにもシェアしたいと思います。',
   'https://www.youtube.com/embed/dQw4w9WgXcQ',
   NULL,
   23, 5, 'family'),
   
  -- Watch timeline - Text post
  ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001',
   'text',
   '瞑想の効果について、科学的な視点から解説します📚

最近の研究によると、定期的な瞑想は:
・ストレス軽減
・集中力向上
・免疫力アップ
・睡眠の質改善

などの効果があることが分かっています。

瞑想は特別なものではなく、誰でも始められる心の習慣です。
まずは1日5分から始めてみませんか？

#マインドフルネス #瞑想効果 #セルフケア',
   NULL,
   NULL,
   31, 4, 'watch'),
   
  -- Watch timeline - Image post
  ('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001',
   'image',
   '今日の瞑想風景🌟 

宇宙とつながる特別な時間を過ごしました。
静寂の中で感じる無限の可能性。
みなさんも、自分だけの特別な瞑想空間を
見つけてみてください✨

#瞑想 #スピリチュアル #宇宙 #気づき',
   'https://images.unsplash.com/photo-1532798442725-41036acc7489',
   'https://images.unsplash.com/photo-1532798442725-41036acc7489',
   56, 9, 'watch'),
   
  -- Watch timeline - Audio post
  ('10000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001',
   'audio',
   '今日の瞑想音声です。心の平安を見つける瞑想の基礎について解説しています。',
   NULL,
   NULL,
   17, 3, 'watch');

-- Insert sample comments
INSERT INTO comments (post_id, user_id, content)
VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', '素晴らしい習慣ですね！私も取り入れてみます✨'),
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'シンプルだけど効果的な方法ですね👏'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'このリーディング、心に響きました🙏'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004', '「自分の中の正義」という考え方が新鮮です！'),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '声のトーンがとても落ち着きます🎵'),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000003', 'この動画からたくさんの気づきをもらいました！'),
  ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000002', '科学的な視点からの解説、とても分かりやすいです👍'),
  ('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000003', '素敵な瞑想スペースですね！場所はどこですか？'),
  ('10000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000004', 'この音声ガイド、毎朝聴いています。おすすめです！');

-- Insert sample likes
INSERT INTO likes (post_id, user_id)
VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003'),
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002'),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000003'),
  ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000002'),
  ('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000003'),
  ('10000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000004');

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Public posts are viewable by everyone"
  ON posts FOR SELECT
  USING (true);

CREATE POLICY "Public comments are viewable by everyone"
  ON comments FOR SELECT
  USING (true);

CREATE POLICY "Public likes are viewable by everyone"
  ON likes FOR SELECT
  USING (true);

-- Create policies for authenticated inserts
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Authenticated users can insert posts"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authenticated users can insert comments"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authenticated users can insert likes"
  ON likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policies for row updates (owner only)
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE
  USING (auth.uid() = author_id);

-- Create policies for row deletions (owner only)
CREATE POLICY "Users can delete own profile"
  ON profiles FOR DELETE
  USING (auth.uid() = id);

CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE
  USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own likes"
  ON likes FOR DELETE
  USING (auth.uid() = user_id);