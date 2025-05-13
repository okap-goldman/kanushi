-- サンプルデータ挿入スクリプト for Kanushi

-- テストユーザーの確認（既に存在する場合はスキップ）
DO $$
DECLARE
    sakura_exists BOOLEAN;
    taro_exists BOOLEAN;
    haruka_exists BOOLEAN;
    admin_exists BOOLEAN;
BEGIN
    -- 各ユーザーが存在するか確認
    SELECT EXISTS (SELECT 1 FROM profiles WHERE id = 'd0e8c69f-73e4-4f9a-80e3-363a0070159a') INTO sakura_exists;
    SELECT EXISTS (SELECT 1 FROM profiles WHERE id = 'c2e8d7b6-5a4b-3c2d-1e0f-9a8b7c6d5e4f') INTO taro_exists;
    SELECT EXISTS (SELECT 1 FROM profiles WHERE id = 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d') INTO haruka_exists;
    SELECT EXISTS (SELECT 1 FROM profiles WHERE id = 'f1e2d3c4-b5a6-7987-8765-4321abcdef98') INTO admin_exists;
    
    -- ユーザー1: 田中さくら (存在しない場合のみ挿入)
    IF NOT sakura_exists THEN
        INSERT INTO profiles (id, name, image, username, bio) 
        VALUES ('d0e8c69f-73e4-4f9a-80e3-363a0070159a', '田中さくら', 'https://i.pravatar.cc/150?img=1', 'sakura', '瞑想と自然が大好きな東京出身のフリーランスライター。');
    END IF;
    
    -- ユーザー2: 鈴木太郎 (存在しない場合のみ挿入)
    IF NOT taro_exists THEN
        INSERT INTO profiles (id, name, image, username, bio) 
        VALUES ('c2e8d7b6-5a4b-3c2d-1e0f-9a8b7c6d5e4f', '鈴木太郎', 'https://i.pravatar.cc/150?img=8', 'taro', '京都在住のヨガインストラクター。心と体の調和を大切にしています。');
    END IF;
    
    -- ユーザー3: 佐藤はるか (存在しない場合のみ挿入)
    IF NOT haruka_exists THEN
        INSERT INTO profiles (id, name, image, username, bio) 
        VALUES ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '佐藤はるか', 'https://i.pravatar.cc/150?img=5', 'haruka', '自然療法とハーブティーに関する研究をしています。');
    END IF;
    
    -- ユーザー4: 管理者ユーザー (存在しない場合のみ挿入)
    IF NOT admin_exists THEN
        INSERT INTO profiles (id, name, image, username, bio) 
        VALUES ('f1e2d3c4-b5a6-7987-8765-4321abcdef98', '管理者', 'https://i.pravatar.cc/150?img=12', 'admin', 'サイト管理者');
    END IF;
END $$;

-- 投稿データ
-- 田中さくら (ユーザー1) の投稿
INSERT INTO posts (user_id, content_type, text_content, media_url, timeline_type)
VALUES
('d0e8c69f-73e4-4f9a-80e3-363a0070159a', 'text', '今日は鎌倉で瞑想してきました。心が落ち着く素晴らしい時間でした。', NULL, 'family'),
('d0e8c69f-73e4-4f9a-80e3-363a0070159a', 'image', '鎌倉の美しい竹林で撮影した写真です。', 'https://images.unsplash.com/photo-1503564996084-61b533a0e9a8', 'family'),
('d0e8c69f-73e4-4f9a-80e3-363a0070159a', 'text', 'おすすめの瞑想アプリを見つけました。毎日の習慣にしています。', NULL, 'watch');

-- 鈴木太郎 (ユーザー2) の投稿
INSERT INTO posts (user_id, content_type, text_content, media_url, timeline_type)
VALUES
('c2e8d7b6-5a4b-3c2d-1e0f-9a8b7c6d5e4f', 'text', '今日のヨガクラスはとても活気がありました。参加者の皆さんに感謝します。', NULL, 'family'),
('c2e8d7b6-5a4b-3c2d-1e0f-9a8b7c6d5e4f', 'image', '京都の朝のヨガセッション', 'https://images.unsplash.com/photo-1545389336-cf090694435e', 'watch'),
('c2e8d7b6-5a4b-3c2d-1e0f-9a8b7c6d5e4f', 'video', 'シンプルな朝のヨガルーティーン', 'https://example.com/sample-video.mp4', 'family');

-- 佐藤はるか (ユーザー3) の投稿
INSERT INTO posts (user_id, content_type, text_content, media_url, timeline_type)
VALUES
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'text', '自家製ハーブティーのレシピ: カモミール、ミント、ラベンダーを混ぜるだけで心が落ち着きます。', NULL, 'family'),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'image', '今日集めたハーブたち', 'https://images.unsplash.com/photo-1515586000433-45406d8e6662', 'family'),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'audio', 'ハーブの効能についての音声メモ', 'https://example.com/sample-audio.mp3', 'watch');

-- コメントデータ
INSERT INTO comments (post_id, user_id, content)
VALUES
-- 田中さくらの最初の投稿へのコメント
((SELECT id FROM posts WHERE user_id = 'd0e8c69f-73e4-4f9a-80e3-363a0070159a' ORDER BY created_at LIMIT 1), 'c2e8d7b6-5a4b-3c2d-1e0f-9a8b7c6d5e4f', '鎌倉はとても良い場所ですね。私もよく行きます。'),
((SELECT id FROM posts WHERE user_id = 'd0e8c69f-73e4-4f9a-80e3-363a0070159a' ORDER BY created_at LIMIT 1), 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'おすすめの瞑想スポットがあれば教えてください！'),

-- 鈴木太郎の投稿へのコメント
((SELECT id FROM posts WHERE user_id = 'c2e8d7b6-5a4b-3c2d-1e0f-9a8b7c6d5e4f' ORDER BY created_at LIMIT 1), 'd0e8c69f-73e4-4f9a-80e3-363a0070159a', '素晴らしいですね！次回参加したいです。'),
((SELECT id FROM posts WHERE user_id = 'c2e8d7b6-5a4b-3c2d-1e0f-9a8b7c6d5e4f' ORDER BY created_at LIMIT 1), 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'ヨガと瞑想の効果について話し合いたいです。'),

-- 佐藤はるかの投稿へのコメント
((SELECT id FROM posts WHERE user_id = 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d' ORDER BY created_at LIMIT 1), 'd0e8c69f-73e4-4f9a-80e3-363a0070159a', 'このレシピ試してみます！ありがとう！'),
((SELECT id FROM posts WHERE user_id = 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d' ORDER BY created_at LIMIT 1), 'c2e8d7b6-5a4b-3c2d-1e0f-9a8b7c6d5e4f', 'ハーブティーはヨガ後にぴったりですね。');

-- いいねデータ
INSERT INTO likes (post_id, user_id)
VALUES
-- 田中さくらの投稿へのいいね
((SELECT id FROM posts WHERE user_id = 'd0e8c69f-73e4-4f9a-80e3-363a0070159a' ORDER BY created_at LIMIT 1), 'c2e8d7b6-5a4b-3c2d-1e0f-9a8b7c6d5e4f'),
((SELECT id FROM posts WHERE user_id = 'd0e8c69f-73e4-4f9a-80e3-363a0070159a' ORDER BY created_at LIMIT 1), 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'),

-- 鈴木太郎の投稿へのいいね
((SELECT id FROM posts WHERE user_id = 'c2e8d7b6-5a4b-3c2d-1e0f-9a8b7c6d5e4f' ORDER BY created_at LIMIT 1), 'd0e8c69f-73e4-4f9a-80e3-363a0070159a'),
((SELECT id FROM posts WHERE user_id = 'c2e8d7b6-5a4b-3c2d-1e0f-9a8b7c6d5e4f' ORDER BY created_at LIMIT 1), 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'),

-- 佐藤はるかの投稿へのいいね
((SELECT id FROM posts WHERE user_id = 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d' ORDER BY created_at LIMIT 1), 'd0e8c69f-73e4-4f9a-80e3-363a0070159a'),
((SELECT id FROM posts WHERE user_id = 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d' ORDER BY created_at LIMIT 1), 'c2e8d7b6-5a4b-3c2d-1e0f-9a8b7c6d5e4f');

-- 投稿とタグの関連付け
INSERT INTO post_tags (post_id, tag_id)
VALUES
-- 田中さくらの投稿に瞑想タグを付ける
((SELECT id FROM posts WHERE user_id = 'd0e8c69f-73e4-4f9a-80e3-363a0070159a' ORDER BY created_at LIMIT 1), (SELECT id FROM tags WHERE name = '瞑想')),
((SELECT id FROM posts WHERE user_id = 'd0e8c69f-73e4-4f9a-80e3-363a0070159a' ORDER BY created_at LIMIT 1), (SELECT id FROM tags WHERE name = 'マインドフルネス')),

-- 鈴木太郎の投稿にヨガタグを付ける
((SELECT id FROM posts WHERE user_id = 'c2e8d7b6-5a4b-3c2d-1e0f-9a8b7c6d5e4f' ORDER BY created_at LIMIT 1), (SELECT id FROM tags WHERE name = 'ヨガ')),
((SELECT id FROM posts WHERE user_id = 'c2e8d7b6-5a4b-3c2d-1e0f-9a8b7c6d5e4f' ORDER BY created_at LIMIT 1), (SELECT id FROM tags WHERE name = '自己啓発')),

-- 佐藤はるかの投稿に自然タグを付ける
((SELECT id FROM posts WHERE user_id = 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d' ORDER BY created_at LIMIT 1), (SELECT id FROM tags WHERE name = '自然')),
((SELECT id FROM posts WHERE user_id = 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d' ORDER BY created_at LIMIT 1), (SELECT id FROM tags WHERE name = 'ヒーリング'));

-- 会話データ
-- 会話の直接挿入
DO $$
DECLARE
    conv1_id UUID;
    conv2_id UUID;
BEGIN
    -- 田中さくらと鈴木太郎の会話
    INSERT INTO conversations DEFAULT VALUES RETURNING id INTO conv1_id;
    INSERT INTO conversation_participants (conversation_id, user_id)
    VALUES 
    (conv1_id, 'd0e8c69f-73e4-4f9a-80e3-363a0070159a'),
    (conv1_id, 'c2e8d7b6-5a4b-3c2d-1e0f-9a8b7c6d5e4f');

    -- 田中さくらと佐藤はるかの会話
    INSERT INTO conversations DEFAULT VALUES RETURNING id INTO conv2_id;
    INSERT INTO conversation_participants (conversation_id, user_id)
    VALUES 
    (conv2_id, 'd0e8c69f-73e4-4f9a-80e3-363a0070159a'),
    (conv2_id, 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d');
END $$;

-- 会話のメッセージ挿入
DO $$
DECLARE
    conv1_id UUID;
    conv2_id UUID;
BEGIN
    -- 田中さくらと鈴木太郎の会話を取得
    SELECT cp.conversation_id INTO conv1_id
    FROM conversation_participants cp
    JOIN conversation_participants cp2 ON cp.conversation_id = cp2.conversation_id
    WHERE cp.user_id = 'd0e8c69f-73e4-4f9a-80e3-363a0070159a'
    AND cp2.user_id = 'c2e8d7b6-5a4b-3c2d-1e0f-9a8b7c6d5e4f'
    LIMIT 1;
    
    -- 田中さくらと佐藤はるかの会話を取得
    SELECT cp.conversation_id INTO conv2_id
    FROM conversation_participants cp
    JOIN conversation_participants cp2 ON cp.conversation_id = cp2.conversation_id
    WHERE cp.user_id = 'd0e8c69f-73e4-4f9a-80e3-363a0070159a'
    AND cp2.user_id = 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'
    LIMIT 1;
    
    -- 田中さくらと鈴木太郎の会話にメッセージを挿入
    IF conv1_id IS NOT NULL THEN
        INSERT INTO messages (conversation_id, user_id, content, content_type)
        VALUES
        (conv1_id, 'd0e8c69f-73e4-4f9a-80e3-363a0070159a', 'こんにちは、太郎さん。ヨガのクラスについて質問があります。', 'text'),
        (conv1_id, 'c2e8d7b6-5a4b-3c2d-1e0f-9a8b7c6d5e4f', 'こんにちは、さくらさん。どんな質問でしょうか？', 'text'),
        (conv1_id, 'd0e8c69f-73e4-4f9a-80e3-363a0070159a', '初心者向けのクラスはありますか？', 'text');
    END IF;
    
    -- 田中さくらと佐藤はるかの会話にメッセージを挿入
    IF conv2_id IS NOT NULL THEN
        INSERT INTO messages (conversation_id, user_id, content, content_type)
        VALUES
        (conv2_id, 'd0e8c69f-73e4-4f9a-80e3-363a0070159a', 'はるかさん、おすすめのハーブティーを教えてください。', 'text'),
        (conv2_id, 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'さくらさん、リラックスにはラベンダーとカモミールがおすすめです。', 'text');
    END IF;
END $$;

-- ストーリーデータ
INSERT INTO stories (user_id, content_type, media_url, thumbnail_url, caption)
VALUES
('d0e8c69f-73e4-4f9a-80e3-363a0070159a', 'image', 'https://images.unsplash.com/photo-1519834785169-98be25ec3f84', NULL, '朝の瞑想タイム'),
('c2e8d7b6-5a4b-3c2d-1e0f-9a8b7c6d5e4f', 'image', 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b', NULL, '京都の寺院でのヨガ'),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'image', 'https://images.unsplash.com/photo-1564518486639-5dbcebb8677e', NULL, '今日のハーブガーデン');

-- ストーリー閲覧データ
INSERT INTO story_views (story_id, user_id)
VALUES
((SELECT id FROM stories WHERE user_id = 'd0e8c69f-73e4-4f9a-80e3-363a0070159a' LIMIT 1), 'c2e8d7b6-5a4b-3c2d-1e0f-9a8b7c6d5e4f'),
((SELECT id FROM stories WHERE user_id = 'd0e8c69f-73e4-4f9a-80e3-363a0070159a' LIMIT 1), 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'),
((SELECT id FROM stories WHERE user_id = 'c2e8d7b6-5a4b-3c2d-1e0f-9a8b7c6d5e4f' LIMIT 1), 'd0e8c69f-73e4-4f9a-80e3-363a0070159a'),
((SELECT id FROM stories WHERE user_id = 'c2e8d7b6-5a4b-3c2d-1e0f-9a8b7c6d5e4f' LIMIT 1), 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'),
((SELECT id FROM stories WHERE user_id = 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d' LIMIT 1), 'd0e8c69f-73e4-4f9a-80e3-363a0070159a'),
((SELECT id FROM stories WHERE user_id = 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d' LIMIT 1), 'c2e8d7b6-5a4b-3c2d-1e0f-9a8b7c6d5e4f');

-- メッセージ反応
DO $$
DECLARE
    first_message_id UUID;
    second_message_id UUID;
BEGIN
    -- 最初と2番目のメッセージIDを取得
    SELECT id INTO first_message_id FROM messages ORDER BY created_at LIMIT 1;
    SELECT id INTO second_message_id FROM messages ORDER BY created_at OFFSET 1 LIMIT 1;
    
    -- リアクションを挿入
    IF first_message_id IS NOT NULL AND second_message_id IS NOT NULL THEN
        INSERT INTO message_reactions (message_id, user_id, reaction)
        VALUES
        (first_message_id, 'c2e8d7b6-5a4b-3c2d-1e0f-9a8b7c6d5e4f', '👍'),
        (second_message_id, 'd0e8c69f-73e4-4f9a-80e3-363a0070159a', '🙏');
    END IF;
END $$;

-- いいねカウントとコメントカウントの更新
UPDATE posts
SET likes_count = (SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.id),
    comments_count = (SELECT COUNT(*) FROM comments WHERE comments.post_id = posts.id);

-- ストーリービューカウントの更新
UPDATE stories
SET views_count = (SELECT COUNT(*) FROM story_views WHERE story_views.story_id = stories.id);

-- 会話の最終更新日時を更新
UPDATE conversations c
SET updated_at = (
  SELECT MAX(created_at) 
  FROM messages m 
  WHERE m.conversation_id = c.id
);