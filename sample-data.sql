-- サンプルデータ挿入スクリプト for Kanushi

-- 既存データの削除
DELETE FROM story_views;
DELETE FROM stories;
DELETE FROM message_reactions;
DELETE FROM messages;
DELETE FROM conversation_participants;
DELETE FROM conversations;
DELETE FROM post_tags;
DELETE FROM likes;
DELETE FROM comments;
DELETE FROM posts;
DELETE FROM profiles WHERE id IN (
  'd0e8c69f-73e4-4f9a-80e3-363a0070159a',
  'c2e8d7b6-5a4b-3c2d-1e0f-9a8b7c6d5e4f',
  'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'f1e2d3c4-b5a6-7987-8765-4321abcdef98'
);

-- テストユーザーの確認（既に存在する場合はスキップ）
DO $$
DECLARE
    sakura_exists BOOLEAN;
    taro_exists BOOLEAN;
    haruka_exists BOOLEAN;
    admin_exists BOOLEAN;
    izutani_exists BOOLEAN;
    shota_exists BOOLEAN;
    kanako_exists BOOLEAN;
    inner_light_exists BOOLEAN;
BEGIN
    -- 各ユーザーが存在するか確認
    SELECT EXISTS (SELECT 1 FROM profiles WHERE id = 'd0e8c69f-73e4-4f9a-80e3-363a0070159a') INTO sakura_exists;
    SELECT EXISTS (SELECT 1 FROM profiles WHERE id = 'c2e8d7b6-5a4b-3c2d-1e0f-9a8b7c6d5e4f') INTO taro_exists;
    SELECT EXISTS (SELECT 1 FROM profiles WHERE id = 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d') INTO haruka_exists;
    SELECT EXISTS (SELECT 1 FROM profiles WHERE id = 'f1e2d3c4-b5a6-7987-8765-4321abcdef98') INTO admin_exists;
    SELECT EXISTS (SELECT 1 FROM profiles WHERE id = '00000000-0000-0000-0000-000000000001') INTO izutani_exists;
    SELECT EXISTS (SELECT 1 FROM profiles WHERE id = '00000000-0000-0000-0000-000000000002') INTO shota_exists;
    SELECT EXISTS (SELECT 1 FROM profiles WHERE id = '00000000-0000-0000-0000-000000000003') INTO kanako_exists;
    SELECT EXISTS (SELECT 1 FROM profiles WHERE id = '00000000-0000-0000-0000-000000000004') INTO inner_light_exists;
    
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
    
    -- fix-stories-sample-data.sqlから追加するユーザー
    -- ユーザー1: 泉谷和久
    IF NOT izutani_exists THEN
        INSERT INTO profiles (id, name, image, username, bio) 
        VALUES ('00000000-0000-0000-0000-000000000001', '泉谷和久', 'https://i.pravatar.cc/150?img=3', 'izutani', '瞑想とスピリチュアルの実践者、東京在住。');
    END IF;
    
    -- ユーザー2: Shota
    IF NOT shota_exists THEN
        INSERT INTO profiles (id, name, image, username, bio) 
        VALUES ('00000000-0000-0000-0000-000000000002', 'Shota', 'https://i.pravatar.cc/150?img=7', 'shota', 'エネルギーワークを探求している。大阪在住。');
    END IF;
    
    -- ユーザー3: Kanako
    IF NOT kanako_exists THEN
        INSERT INTO profiles (id, name, image, username, bio) 
        VALUES ('00000000-0000-0000-0000-000000000003', 'Kanako', 'https://i.pravatar.cc/150?img=9', 'kanako', 'タロットカードリーダー、スピリチュアルコーチ。');
    END IF;
    
    -- ユーザー4: 内なる光
    IF NOT inner_light_exists THEN
        INSERT INTO profiles (id, name, image, username, bio) 
        VALUES ('00000000-0000-0000-0000-000000000004', '内なる光', 'https://i.pravatar.cc/150?img=13', 'inner_light', 'スピリチュアルな旅を共有します。');
    END IF;
END $$;

-- 投稿データ
-- 田中さくら (ユーザー1) の投稿
INSERT INTO posts (user_id, content_type, text_content, media_url, audio_url, thumbnail_url, timeline_type)
VALUES
('d0e8c69f-73e4-4f9a-80e3-363a0070159a', 'text', '今日は鎌倉で瞑想してきました。心が落ち着く素晴らしい時間でした。', NULL, NULL, NULL, 'family'),
('d0e8c69f-73e4-4f9a-80e3-363a0070159a', 'image', '鎌倉の美しい竹林で撮影した写真です。', 'https://images.unsplash.com/photo-1503564996084-61b533a0e9a8', NULL, NULL, 'family'),
('d0e8c69f-73e4-4f9a-80e3-363a0070159a', 'text', 'おすすめの瞑想アプリを見つけました。毎日の習慣にしています。', NULL, NULL, NULL, 'watch'),
('d0e8c69f-73e4-4f9a-80e3-363a0070159a', 'audio', '瞑想中に聞いている自然音です。とても癒されます。', NULL, 'https://www.learningcontainer.com/wp-content/uploads/2020/02/Kalimba.mp3', NULL, 'family'),
('d0e8c69f-73e4-4f9a-80e3-363a0070159a', 'video', '鎌倉での瞑想体験を記録した動画です。初心者向けの瞑想方法も紹介しています。', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', NULL, 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerBlazes.jpg', 'family'),
-- 複数画像のサンプル投稿 (JSONとして複数の画像URLを保存)
('d0e8c69f-73e4-4f9a-80e3-363a0070159a', 'image', '瞑想ワークショップで撮影した写真です。素晴らしい体験でした。', '["https://images.unsplash.com/photo-1506126613408-eca07ce68773", "https://images.unsplash.com/photo-1593811167562-9cef47bfc4d7", "https://images.unsplash.com/photo-1516537219851-920e2670c6e2"]', NULL, NULL, 'family'),
-- 動画と画像が混在したサンプル投稿
('d0e8c69f-73e4-4f9a-80e3-363a0070159a', 'video', '今日の自然散策で見つけた美しい景色と動画です。', '["https://images.unsplash.com/photo-1501854140801-50d01698950b", "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"]', NULL, 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg', 'family');

-- 鈴木太郎 (ユーザー2) の投稿
INSERT INTO posts (user_id, content_type, text_content, media_url, audio_url, thumbnail_url, timeline_type)
VALUES
('c2e8d7b6-5a4b-3c2d-1e0f-9a8b7c6d5e4f', 'text', '今日のヨガクラスはとても活気がありました。参加者の皆さんに感謝します。', NULL, NULL, NULL, 'family'),
('c2e8d7b6-5a4b-3c2d-1e0f-9a8b7c6d5e4f', 'image', '京都の朝のヨガセッション', 'https://images.unsplash.com/photo-1545389336-cf090694435e', NULL, NULL, 'watch'),
('c2e8d7b6-5a4b-3c2d-1e0f-9a8b7c6d5e4f', 'video', 'シンプルな朝のヨガルーティーン', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4', NULL, 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/TearsOfSteel.jpg', 'family'),
('c2e8d7b6-5a4b-3c2d-1e0f-9a8b7c6d5e4f', 'audio', 'ヨガクラスで使用している音楽です。リラックスできると好評です。', NULL, 'https://www.learningcontainer.com/wp-content/uploads/2020/02/Sample-OGG-File.ogg', NULL, 'watch'),
-- 複数画像のサンプル投稿
('c2e8d7b6-5a4b-3c2d-1e0f-9a8b7c6d5e4f', 'image', 'ヨガリトリートの様子です。自然の中で心身を整える貴重な時間。', '["https://images.unsplash.com/photo-1588286840104-8957b019727f", "https://images.unsplash.com/photo-1599901860904-17e6ed7083a0", "https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b"]', NULL, NULL, 'family');

-- 佐藤はるか (ユーザー3) の投稿
INSERT INTO posts (user_id, content_type, text_content, media_url, audio_url, thumbnail_url, timeline_type)
VALUES
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'text', '自家製ハーブティーのレシピ: カモミール、ミント、ラベンダーを混ぜるだけで心が落ち着きます。', NULL, NULL, NULL, 'family'),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'image', '今日集めたハーブたち', 'https://images.unsplash.com/photo-1515586000433-45406d8e6662', NULL, NULL, 'family'),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'audio', '自然療法についての講演の一部です。興味のある方はぜひ聞いてみてください。', NULL, 'https://www.learningcontainer.com/wp-content/uploads/2020/02/Kalimba-online-audio-converter.com_-1.wav', NULL, 'watch'),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'video', '自然療法とハーブティーについてのショートレクチャーです。', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', NULL, 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ElephantsDream.jpg', 'family'),
-- 動画と画像が混在したサンプル投稿
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'video', 'ハーブガーデンでの1日と薬草の効能についての説明動画です。', '["https://images.unsplash.com/photo-1591466020083-2ab14756b734", "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4"]', NULL, 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/Sintel.jpg', 'family');

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
INSERT INTO stories (id, user_id, content_type, media_url, thumbnail_url, caption, views_count, created_at, expires_at)
VALUES
-- 既存のストーリー
('30000000-0000-0000-0000-000000000001', 'd0e8c69f-73e4-4f9a-80e3-363a0070159a', 'image', 'https://images.unsplash.com/photo-1519834785169-98be25ec3f84', 'https://images.unsplash.com/photo-1519834785169-98be25ec3f84', '朝の瞑想タイム', 3, NOW() - INTERVAL '2 hours', NOW() + INTERVAL '22 hours'),
('30000000-0000-0000-0000-000000000002', 'c2e8d7b6-5a4b-3c2d-1e0f-9a8b7c6d5e4f', 'image', 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b', 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b', '京都の寺院でのヨガ', 4, NOW() - INTERVAL '4 hours', NOW() + INTERVAL '20 hours'),
('30000000-0000-0000-0000-000000000003', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'image', 'https://images.unsplash.com/photo-1564518486639-5dbcebb8677e', 'https://images.unsplash.com/photo-1564518486639-5dbcebb8677e', '今日のハーブガーデン', 2, NOW() - INTERVAL '3 hours', NOW() + INTERVAL '21 hours'),

-- 追加のストーリー (新機能のサンプル)
('30000000-0000-0000-0000-000000000004', 'd0e8c69f-73e4-4f9a-80e3-363a0070159a', 'image', 'https://images.unsplash.com/photo-1600618528240-fb9fc964b853', 'https://images.unsplash.com/photo-1600618528240-fb9fc964b853', '瞑想スポットで心が落ち着きます✨', 5, NOW() - INTERVAL '1 hours', NOW() + INTERVAL '23 hours'),
('30000000-0000-0000-0000-000000000005', 'c2e8d7b6-5a4b-3c2d-1e0f-9a8b7c6d5e4f', 'video', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg', '朝のエネルギーワーク。皆さんも一緒にやってみませんか？', 8, NOW() - INTERVAL '5 hours', NOW() + INTERVAL '19 hours'),
('30000000-0000-0000-0000-000000000006', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'image', 'https://images.unsplash.com/photo-1515940176183-c728f7e115ce', 'https://images.unsplash.com/photo-1515940176183-c728f7e115ce', '今日引いたカード：「変容」✨ 新しい変化を受け入れる時期かもしれません', 6, NOW() - INTERVAL '6 hours', NOW() + INTERVAL '18 hours'),
('30000000-0000-0000-0000-000000000007', 'f1e2d3c4-b5a6-7987-8765-4321abcdef98', 'image', 'https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7', 'https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7', '夕日の美しさに感謝。一日の終わりを静かに見つめる時間', 4, NOW() - INTERVAL '7 hours', NOW() + INTERVAL '17 hours'),
('30000000-0000-0000-0000-000000000008', 'd0e8c69f-73e4-4f9a-80e3-363a0070159a', 'video', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerEscapes.jpg', '瞑想中にイメージする風景', 2, NOW() - INTERVAL '8 hours', NOW() + INTERVAL '16 hours'),

-- 追加のストーリー (fix-stories-sample-data.sqlから追加)
-- 泉谷和久さんのストーリー (画像)
('30000000-0000-0000-0000-000000000009', 
 '00000000-0000-0000-0000-000000000001', 
 'image',
 'https://images.unsplash.com/photo-1600618528240-fb9fc964b853',
 'https://images.unsplash.com/photo-1600618528240-fb9fc964b853',
 '今日の瞑想スポット。自然の中で心が落ち着きます✨',
 12,
 NOW() - INTERVAL '3 hours',
 NOW() + INTERVAL '21 hours'),
 
-- 泉谷和久さんのストーリー2 (画像)
('30000000-0000-0000-0000-000000000010', 
 '00000000-0000-0000-0000-000000000001', 
 'image',
 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5',
 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5',
 '新しい本に出会いました。皆さんにもおすすめです📚',
 8,
 NOW() - INTERVAL '5 hours',
 NOW() + INTERVAL '19 hours'),
 
-- Shotaさんのストーリー (動画)
('30000000-0000-0000-0000-000000000011', 
 '00000000-0000-0000-0000-000000000002', 
 'video',
 'https://player.vimeo.com/external/368763144.sd.mp4',
 'https://images.unsplash.com/photo-1533055640609-24b498dfd74c',
 '朝のエネルギーワーク。皆さんも一緒にやってみませんか？',
 24,
 NOW() - INTERVAL '8 hours',
 NOW() + INTERVAL '16 hours'),
 
-- Kanakoさんのストーリー (画像)
('30000000-0000-0000-0000-000000000012', 
 '00000000-0000-0000-0000-000000000003', 
 'image',
 'https://images.unsplash.com/photo-1515940176183-c728f7e115ce',
 'https://images.unsplash.com/photo-1515940176183-c728f7e115ce',
 '今日引いたカード：「変容」✨ 新しい変化を受け入れる時期かもしれません',
 31,
 NOW() - INTERVAL '2 hours',
 NOW() + INTERVAL '22 hours'),
 
-- 内なる光さんのストーリー (画像)
('30000000-0000-0000-0000-000000000013', 
 '00000000-0000-0000-0000-000000000004', 
 'image',
 'https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7',
 'https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7',
 '夕日の美しさに感謝。一日の終わりを静かに見つめる時間',
 15,
 NOW() - INTERVAL '4 hours',
 NOW() + INTERVAL '20 hours');

-- ストーリー閲覧データ
INSERT INTO story_views (story_id, user_id, viewed_at)
VALUES
-- 既存のストーリー閲覧
('30000000-0000-0000-0000-000000000001', 'c2e8d7b6-5a4b-3c2d-1e0f-9a8b7c6d5e4f', NOW() - INTERVAL '1 hour'),
('30000000-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', NOW() - INTERVAL '30 minutes'),
('30000000-0000-0000-0000-000000000001', 'f1e2d3c4-b5a6-7987-8765-4321abcdef98', NOW() - INTERVAL '45 minutes'),
('30000000-0000-0000-0000-000000000002', 'd0e8c69f-73e4-4f9a-80e3-363a0070159a', NOW() - INTERVAL '2 hours'),
('30000000-0000-0000-0000-000000000002', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', NOW() - INTERVAL '3 hours'),
('30000000-0000-0000-0000-000000000002', 'f1e2d3c4-b5a6-7987-8765-4321abcdef98', NOW() - INTERVAL '1 hours'),
('30000000-0000-0000-0000-000000000003', 'd0e8c69f-73e4-4f9a-80e3-363a0070159a', NOW() - INTERVAL '1 hour'),
('30000000-0000-0000-0000-000000000003', 'c2e8d7b6-5a4b-3c2d-1e0f-9a8b7c6d5e4f', NOW() - INTERVAL '2 hours'),

-- 新しいストーリー閲覧
('30000000-0000-0000-0000-000000000004', 'c2e8d7b6-5a4b-3c2d-1e0f-9a8b7c6d5e4f', NOW() - INTERVAL '30 minutes'),
('30000000-0000-0000-0000-000000000004', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', NOW() - INTERVAL '45 minutes'),
('30000000-0000-0000-0000-000000000004', 'f1e2d3c4-b5a6-7987-8765-4321abcdef98', NOW() - INTERVAL '20 minutes'),
('30000000-0000-0000-0000-000000000005', 'd0e8c69f-73e4-4f9a-80e3-363a0070159a', NOW() - INTERVAL '2 hours'),
('30000000-0000-0000-0000-000000000005', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', NOW() - INTERVAL '3 hours'),
('30000000-0000-0000-0000-000000000005', 'f1e2d3c4-b5a6-7987-8765-4321abcdef98', NOW() - INTERVAL '4 hours'),
('30000000-0000-0000-0000-000000000006', 'd0e8c69f-73e4-4f9a-80e3-363a0070159a', NOW() - INTERVAL '1 hour'),
('30000000-0000-0000-0000-000000000006', 'c2e8d7b6-5a4b-3c2d-1e0f-9a8b7c6d5e4f', NOW() - INTERVAL '2 hours'),
('30000000-0000-0000-0000-000000000006', 'f1e2d3c4-b5a6-7987-8765-4321abcdef98', NOW() - INTERVAL '3 hours'),
('30000000-0000-0000-0000-000000000007', 'd0e8c69f-73e4-4f9a-80e3-363a0070159a', NOW() - INTERVAL '1 hour'),
('30000000-0000-0000-0000-000000000007', 'c2e8d7b6-5a4b-3c2d-1e0f-9a8b7c6d5e4f', NOW() - INTERVAL '2 hours'),
('30000000-0000-0000-0000-000000000007', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', NOW() - INTERVAL '3 hours'),

-- fix-stories-sample-data.sqlからのストーリー閲覧データ
-- 泉谷和久さんのストーリーを閲覧したユーザー
('30000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000002', NOW() - INTERVAL '2 hours'),
('30000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000003', NOW() - INTERVAL '1 hour'),
('30000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000003', NOW() - INTERVAL '1 hour'),

-- Shotaさんのストーリーを閲覧したユーザー
('30000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '2 hours'),
('30000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000003', NOW() - INTERVAL '3 hours'),
('30000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000004', NOW() - INTERVAL '1 hour'),

-- Kanakoさんのストーリーを閲覧したユーザー
('30000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '30 minutes'),
('30000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000002', NOW() - INTERVAL '1 hour'),

-- 内なる光さんのストーリーを閲覧したユーザー
('30000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '1 hour'),
('30000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000002', NOW() - INTERVAL '2 hours');

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