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