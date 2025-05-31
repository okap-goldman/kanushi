-- 日本語のスピリチュアル系モックデータの挿入（新しいストーリーズスキーマに対応）

-- 注意: このスクリプトを実行する前に、Supabase AuthにテストユーザーをセットアップするJavaScriptスクリプトを実行する必要があります
-- 詳細は scripts/seed-with-supabase-cli.sh を参照してください

-- プロフィールデータの挿入
INSERT INTO profiles (id, display_name, profile_text, profile_image_url, created_at, updated_at)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', '光の導き手 明子', '魂の目醒めをサポートするライトワーカーです。瞑想指導歴15年。あなたの内なる光を見出すお手伝いをさせていただきます。', 'https://api.dicebear.com/7.x/avataaars/svg?seed=akiko&backgroundColor=b6e3f4', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440002', '宇宙意識 龍馬', 'プレアデス系スターシード。高次元とのチャネリングを通じて、地球のアセンションをサポートしています。音声による宇宙メッセージをお届け。', 'https://api.dicebear.com/7.x/avataaars/svg?seed=ryoma&backgroundColor=c0aede', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440003', '癒しの音 さくら', 'クリスタルボウルとライトランゲージによるヒーリングセッションを提供。あなたの波動を高める音の魔法をお届けします。', 'https://api.dicebear.com/7.x/avataaars/svg?seed=sakura&backgroundColor=ffd5dc', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440004', '目醒めの案内人 健太', 'エネルギーワーカー、レイキマスター。日々の瞑想実践と霊的成長のためのガイダンスを音声で配信中。', 'https://api.dicebear.com/7.x/avataaars/svg?seed=kenta&backgroundColor=aec6cf', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440005', '天使のメッセンジャー 美咲', 'エンジェルカードリーダー。天使からのメッセージをあなたにお届けします。愛と光の中で生きる方法をシェア。', 'https://api.dicebear.com/7.x/avataaars/svg?seed=misaki&backgroundColor=ffb7c5', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440006', 'アカシックリーダー 蓮', 'アカシックレコードへのアクセスを通じて、魂の記憶と使命を読み解きます。過去生リーディングも承ります。', 'https://api.dicebear.com/7.x/avataaars/svg?seed=ren&backgroundColor=b19cd9', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440007', 'エナジーヒーラー 翔', 'チャクラバランシングとオーラクレンジングの専門家。あなたのエネルギーフィールドを整え、本来の輝きを取り戻すサポートをします。', 'https://api.dicebear.com/7.x/avataaars/svg?seed=sho&backgroundColor=89cff0', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440008', '覚醒のファシリテーター 真理子', 'クンダリーニ覚醒の体験者。安全な覚醒プロセスのガイダンスと、統合のサポートを提供しています。', 'https://api.dicebear.com/7.x/avataaars/svg?seed=mariko&backgroundColor=fdfd96', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- タグ（ハッシュタグ）の挿入
INSERT INTO tags (id, name, created_at)
VALUES
  ('660e8400-e29b-41d4-a716-446655440001', '目醒め', NOW()),
  ('660e8400-e29b-41d4-a716-446655440002', 'アセンション', NOW()),
  ('660e8400-e29b-41d4-a716-446655440003', 'ライトワーカー', NOW()),
  ('660e8400-e29b-41d4-a716-446655440004', 'スターシード', NOW()),
  ('660e8400-e29b-41d4-a716-446655440005', '瞑想', NOW()),
  ('660e8400-e29b-41d4-a716-446655440006', 'エネルギーワーク', NOW()),
  ('660e8400-e29b-41d4-a716-446655440007', 'チャネリング', NOW()),
  ('660e8400-e29b-41d4-a716-446655440008', 'ヒーリング', NOW()),
  ('660e8400-e29b-41d4-a716-446655440009', 'ライトランゲージ', NOW()),
  ('660e8400-e29b-41d4-a716-446655440010', 'クリスタル', NOW()),
  ('660e8400-e29b-41d4-a716-446655440011', '高次元', NOW()),
  ('660e8400-e29b-41d4-a716-446655440012', 'ツインレイ', NOW()),
  ('660e8400-e29b-41d4-a716-446655440013', 'アカシックレコード', NOW()),
  ('660e8400-e29b-41d4-a716-446655440014', 'レイキ', NOW()),
  ('660e8400-e29b-41d4-a716-446655440015', 'オーラ', NOW())
ON CONFLICT (id) DO NOTHING;

-- 投稿データの挿入
INSERT INTO posts (id, user_id, content_type, text_content, created_at)
VALUES
  ('770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'audio', '今朝の瞑想で受け取った光のメッセージ。あなたの内なる平和を見つける誘導瞑想です。', NOW() - INTERVAL '1 day'),
  ('770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'audio', 'プレアデスからの緊急メッセージ：地球のアセンションが加速しています。今こそ光の柱となりましょう。', NOW() - INTERVAL '2 days'),
  ('770e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'audio', 'クリスタルボウルによる528Hzの愛の周波数ヒーリング。DNAの活性化をサポートします。', NOW() - INTERVAL '3 days'),
  ('770e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', 'text', '本日の気づき：私たちは皆、無限の可能性を秘めた光の存在です。今日も自分の内なる光を信じて、愛と感謝の中で過ごしましょう。✨', NOW() - INTERVAL '4 hours'),
  ('770e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440004', 'audio', '第3チャクラ活性化のためのエネルギーワーク実践ガイド。個人の力を取り戻しましょう。', NOW() - INTERVAL '5 days'),
  ('770e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440005', 'audio', '大天使ミカエルからの保護と勇気のメッセージ。恐れを手放し、愛の中で前進する方法。', NOW() - INTERVAL '6 days'),
  ('770e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440006', 'text', 'アカシックリーディングより：今、地球は大きな転換期を迎えています。一人一人の意識の目醒めが、集合意識の変容を創造します。', NOW() - INTERVAL '7 days'),
  ('770e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440007', 'audio', '7つのチャクラを整える音声ガイド瞑想。各チャクラに対応した周波数と言霊を使用。', NOW() - INTERVAL '8 days'),
  ('770e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440008', 'audio', 'クンダリーニエネルギーの安全な覚醒方法について。体験談と注意点をシェアします。', NOW() - INTERVAL '9 days'),
  ('770e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440002', 'text', '11:11のポータルが開きました。今日は特別な宇宙エネルギーが降り注いでいます。瞑想と意図設定に最適な日です。', NOW() - INTERVAL '10 days')
ON CONFLICT (id) DO NOTHING;

-- 投稿とタグの関連付け
INSERT INTO post_tags (post_id, tag_id)
VALUES
  ('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001'), -- 目醒め
  ('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440005'), -- 瞑想
  ('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002'), -- アセンション
  ('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440004'), -- スターシード
  ('770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440008'), -- ヒーリング
  ('770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440010'), -- クリスタル
  ('770e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440006'), -- エネルギーワーク
  ('770e8400-e29b-41d4-a716-446655440006', '660e8400-e29b-41d4-a716-446655440007'), -- チャネリング
  ('770e8400-e29b-41d4-a716-446655440007', '660e8400-e29b-41d4-a716-446655440013'), -- アカシックレコード
  ('770e8400-e29b-41d4-a716-446655440008', '660e8400-e29b-41d4-a716-446655440015') -- オーラ
ON CONFLICT DO NOTHING;

-- コメントデータの挿入
INSERT INTO comments (id, post_id, user_id, content, created_at)
VALUES
  ('880e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', '素晴らしい瞑想でした。深い平和を感じることができました。ありがとうございます🙏', NOW() - INTERVAL '23 hours'),
  ('880e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', '朝の瞑想に取り入れさせていただきます。光と愛をありがとう✨', NOW() - INTERVAL '20 hours'),
  ('880e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440004', 'まさに今必要なメッセージでした。シンクロニシティを感じます。', NOW() - INTERVAL '1 day 12 hours'),
  ('880e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440005', '528Hzの振動が心地よく、全身が浄化されていく感覚がありました。', NOW() - INTERVAL '2 days 8 hours')
ON CONFLICT (id) DO NOTHING;

-- いいねデータの挿入
INSERT INTO likes (id, post_id, user_id, created_at)
VALUES
  ('990e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', NOW() - INTERVAL '23 hours'),
  ('990e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', NOW() - INTERVAL '20 hours'),
  ('990e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004', NOW() - INTERVAL '18 hours'),
  ('990e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', NOW() - INTERVAL '1 day 16 hours'),
  ('990e8400-e29b-41d4-a716-446655440005', '770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440004', NOW() - INTERVAL '1 day 12 hours'),
  ('990e8400-e29b-41d4-a716-446655440006', '770e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440005', NOW() - INTERVAL '2 days 8 hours'),
  ('990e8400-e29b-41d4-a716-446655440007', '770e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440006', NOW() - INTERVAL '2 days 6 hours')
ON CONFLICT (id) DO NOTHING;

-- イベントデータの挿入
INSERT INTO events (id, title, description, date, location, host_id, max_participants, created_at)
VALUES
  ('AA0e8400-e29b-41d4-a716-446655440001', '満月の瞑想会', '満月のパワフルなエネルギーを活用した集団瞑想会。内なる光を活性化し、願望実現のエネルギーワークを行います。', NOW() + INTERVAL '7 days', 'オンライン（Zoom）', '550e8400-e29b-41d4-a716-446655440001', 30, NOW()),
  ('AA0e8400-e29b-41d4-a716-446655440002', 'スターシード覚醒ワークショップ', 'あなたの宇宙的起源を思い出し、地球での使命を明確にする3日間の集中ワークショップ。', NOW() + INTERVAL '14 days', '京都リトリートセンター', '550e8400-e29b-41d4-a716-446655440002', 12, NOW()),
  ('AA0e8400-e29b-41d4-a716-446655440003', 'クリスタルボウル音浴会', '7つのチャクラに対応したクリスタルボウルによる深い癒しの音浴体験。', NOW() + INTERVAL '10 days', '鎌倉ヒーリングスペース', '550e8400-e29b-41d4-a716-446655440003', 20, NOW()),
  ('AA0e8400-e29b-41d4-a716-446655440004', 'アカシックレコードリーディング入門', 'アカシックレコードへのアクセス方法を学ぶ初心者向けワークショップ。', NOW() + INTERVAL '21 days', '東京スピリチュアルセンター', '550e8400-e29b-41d4-a716-446655440006', 15, NOW())
ON CONFLICT (id) DO NOTHING;

-- いいねと投稿のカウントを更新
UPDATE posts SET likes_count = (SELECT COUNT(*) FROM likes WHERE post_id = posts.id);
UPDATE posts SET comments_count = (SELECT COUNT(*) FROM comments WHERE post_id = posts.id);

-- ストーリーズデータの挿入（新しいスキーマに対応）
-- 注意: storyテーブルには audio_url と audio_transcript フィールドが必須
INSERT INTO story (id, user_id, image_url, audio_url, audio_transcript, edit_data, is_repost, original_story_id, expires_at, created_at)
VALUES
  -- 光の導き手 明子のストーリー（朝の瞑想風景）
  ('BB0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 
   'https://example.com/stories/meditation-sunrise.jpg',
   'https://f004.backblazeb2.com/b2api/v1/b2_download_file_by_id?fileId=4_za01f9bab90e30e6d997f091c_f1107d3a67562ef44_d20250526_m000952_c004_v0402009_t0045_u01748218192024',
   '朝日と共に瞑想の時間です。深く息を吸って、この美しい光のエネルギーを感じてください。今日も光と共に歩んでいきましょう。', 
   '{"filters": ["warm"], "stickers": [{"type": "sparkle", "x": 100, "y": 200}], "caption": "朝日と共に瞑想の時間✨ 今日も光と共に歩みます", "location": "富士山麓瞑想センター"}',
   false,
   NULL,
   NOW() + INTERVAL '20 hours',
   NOW() - INTERVAL '4 hours'),
   
  -- 宇宙意識 龍馬のストーリー（11:11のポータル）
  ('BB0e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 
   'https://example.com/stories/portal-1111.jpg',
   'https://f004.backblazeb2.com/b2api/v1/b2_download_file_by_id?fileId=4_za01f9bab90e30e6d997f091c_f1107d3a67562ef44_d20250526_m000952_c004_v0402009_t0045_u01748218192024',
   '今夜のチャネリングセッションを開始します。宇宙からの愛のメッセージを受け取る準備はできていますか。心を開いて、このエネルギーと共鳴してください。', 
   '{"text_content": "11:11\n今、宇宙のポータルが開いています\n深呼吸をして\nエネルギーを受け取ってください", "background_color": "#1a0033", "font_style": "cosmic", "textPosition": {"x": "center", "y": "center"}, "animation": "glow", "caption": "特別なエネルギーが降り注いでいます"}',
   false,
   NULL,
   NOW() + INTERVAL '18 hours',
   NOW() - INTERVAL '6 hours'),
   
  -- 癒しの音 さくらのストーリー（クリスタルボウル準備）
  ('BB0e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 
   'https://example.com/stories/crystal-bowls.jpg',
   'https://f004.backblazeb2.com/b2api/v1/b2_download_file_by_id?fileId=4_za01f9bab90e30e6d997f091c_f1107d3a67562ef44_d20250526_m000952_c004_v0402009_t0045_u01748218192024',
   '今夜のヒーリングセッションの準備をしています。クリスタルボウルの音で、皆さまの心と体を深く癒していきたいと思います。', 
   '{"filters": ["ethereal"], "stickers": [{"type": "musical_note", "x": 150, "y": 100}, {"type": "heart", "x": 200, "y": 150}], "caption": "今夜のヒーリングセッションの準備中です🎵", "location": "ヒーリングサロン光の音"}',
   false,
   NULL,
   NOW() + INTERVAL '16 hours',
   NOW() - INTERVAL '8 hours'),
   
  -- 目醒めの案内人 健太のストーリー（エネルギーワーク体験シェア）
  ('BB0e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', 
   'https://example.com/stories/energy-work.jpg',
   'https://f004.backblazeb2.com/b2api/v1/b2_download_file_by_id?fileId=4_za01f9bab90e30e6d997f091c_f1107d3a67562ef44_d20250526_m000952_c004_v0402009_t0045_u01748218192024',
   '今朝のエネルギーワークで、第三の目が完全に開きました。紫の光が見えた方は、ぜひコメントで教えてください。この覚醒体験をシェアしたいと思います。', 
   '{"text_content": "今朝のエネルギーワークで\n第三の目が完全に開きました\n\n紫の光が見えた方\nコメントで教えてください", "background_color": "#4a148c", "font_style": "mystical", "textPosition": {"x": "center", "y": "middle"}, "effects": ["gradient"], "caption": "覚醒体験をシェア"}',
   false,
   NULL,
   NOW() + INTERVAL '14 hours',
   NOW() - INTERVAL '10 hours'),
   
  -- 天使のメッセンジャー 美咲のストーリー（天使からのメッセージ）
  ('BB0e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440005', 
   'https://example.com/stories/angel-card.jpg',
   'https://f004.backblazeb2.com/b2api/v1/b2_download_file_by_id?fileId=4_za01f9bab90e30e6d997f091c_f1107d3a67562ef44_d20250526_m000952_c004_v0402009_t0045_u01748218192024',
   '今日のエンジェルメッセージです。信頼と委ねることの大切さを天使たちが教えてくれています。あなたの道は正しい方向に向かっています。', 
   '{"filters": ["soft"], "stickers": [{"type": "angel_wings", "x": 50, "y": 50}, {"type": "feather", "x": 250, "y": 300}], "caption": "今日のエンジェルメッセージ：信頼と委ねること💫"}',
   false,
   NULL,
   NOW() + INTERVAL '12 hours',
   NOW() - INTERVAL '12 hours'),
   
  -- アカシックリーダー 蓮のストーリー（リポスト）
  ('BB0e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440006', 
   'https://example.com/stories/repost.jpg',
   'https://f004.backblazeb2.com/b2api/v1/b2_download_file_by_id?fileId=4_za01f9bab90e30e6d997f091c_f1107d3a67562ef44_d20250526_m000952_c004_v0402009_t0045_u01748218192024',
   '重要なメッセージなのでリポストします。宇宙からの緊急メッセージを皆さまにお伝えしたいと思います。', 
   '{"text_content": "重要なメッセージなのでリポストします", "background_color": "#000033", "font_style": "minimal", "textPosition": {"x": "center", "y": "top"}, "caption": "宇宙からの緊急メッセージ"}',
   true,
   'BB0e8400-e29b-41d4-a716-446655440002',
   NOW() + INTERVAL '10 hours',
   NOW() - INTERVAL '14 hours'),
   
  -- エナジーヒーラー 翔のストーリー（チャクラ診断）
  ('BB0e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440007', 
   'https://example.com/stories/chakra-diagnosis.jpg',
   'https://f004.backblazeb2.com/b2api/v1/b2_download_file_by_id?fileId=4_za01f9bab90e30e6d997f091c_f1107d3a67562ef44_d20250526_m000952_c004_v0402009_t0045_u01748218192024',
   'あなたのチャクラ診断を行います。画面に手を当てて、温かさを感じる場所が今活性化しているチャクラです。このインタラクティブ診断をお試しください。', 
   '{"text_content": "あなたのチャクラ診断\n\n画面に手を当てて\n温かさを感じる場所が\n今活性化しているチャクラです", "background_color": "linear-gradient(45deg, #ff6b6b, #4ecdc4)", "font_style": "healing", "textPosition": {"x": "center", "y": "center"}, "interactive": true, "caption": "インタラクティブチャクラ診断"}',
   false,
   NULL,
   NOW() + INTERVAL '8 hours',
   NOW() - INTERVAL '16 hours'),
   
  -- 覚醒のファシリテーター 真理子のストーリー（クンダリーニ体験）
  ('BB0e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440008', 
   'https://example.com/stories/kundalini-energy.jpg',
   'https://f004.backblazeb2.com/b2api/v1/b2_download_file_by_id?fileId=4_za01f9bab90e30e6d997f091c_f1107d3a67562ef44_d20250526_m000952_c004_v0402009_t0045_u01748218192024',
   'クンダリーニの上昇を視覚化してみました。この神聖なエネルギーが背骨を上昇していく様子を、皆さまと共有したいと思います。', 
   '{"filters": ["energy"], "animation": "pulse", "stickers": [{"type": "snake", "x": 100, "y": 400, "animation": "rise"}], "caption": "クンダリーニの上昇を視覚化してみました🐍✨", "location": "瞑想ルーム"}',
   false,
   NULL,
   NOW() + INTERVAL '6 hours',
   NOW() - INTERVAL '18 hours')
ON CONFLICT (id) DO NOTHING;

-- ストーリービューワー、リアクション、リプライテーブルは
-- 011_add_story_interaction_tables.sql で作成されるため、
-- そちらのマイグレーションが適用されていない場合はコメントアウト

-- -- ストーリービューワーデータの挿入
-- INSERT INTO story_viewer (id, story_id, user_id, viewed_at)
-- VALUES
--   ('CC0e8400-e29b-41d4-a716-446655440001', 'BB0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', NOW() - INTERVAL '3 hours'),
--   ('CC0e8400-e29b-41d4-a716-446655440002', 'BB0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', NOW() - INTERVAL '2 hours'),
--   ('CC0e8400-e29b-41d4-a716-446655440003', 'BB0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004', NOW() - INTERVAL '1 hour'),
--   ('CC0e8400-e29b-41d4-a716-446655440004', 'BB0e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', NOW() - INTERVAL '5 hours'),
--   ('CC0e8400-e29b-41d4-a716-446655440005', 'BB0e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440005', NOW() - INTERVAL '4 hours'),
--   ('CC0e8400-e29b-41d4-a716-446655440006', 'BB0e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440006', NOW() - INTERVAL '7 hours'),
--   ('CC0e8400-e29b-41d4-a716-446655440007', 'BB0e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440008', NOW() - INTERVAL '9 hours'),
--   ('CC0e8400-e29b-41d4-a716-446655440008', 'BB0e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440007', NOW() - INTERVAL '11 hours')
-- ON CONFLICT (id) DO NOTHING;

-- -- ストーリーリアクションデータの挿入
-- INSERT INTO story_reaction (id, story_id, user_id, emoji, created_at)
-- VALUES
--   ('DD0e8400-e29b-41d4-a716-446655440001', 'BB0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', '✨', NOW() - INTERVAL '3 hours'),
--   ('DD0e8400-e29b-41d4-a716-446655440002', 'BB0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', '🙏', NOW() - INTERVAL '2 hours'),
--   ('DD0e8400-e29b-41d4-a716-446655440003', 'BB0e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440005', '💫', NOW() - INTERVAL '4 hours'),
--   ('DD0e8400-e29b-41d4-a716-446655440004', 'BB0e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440006', '💕', NOW() - INTERVAL '7 hours'),
--   ('DD0e8400-e29b-41d4-a716-446655440005', 'BB0e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440008', '👁️', NOW() - INTERVAL '9 hours'),
--   ('DD0e8400-e29b-41d4-a716-446655440006', 'BB0e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440007', '🕊️', NOW() - INTERVAL '11 hours')
-- ON CONFLICT (id) DO NOTHING;

-- -- ストーリーリプライデータの挿入
-- INSERT INTO story_reply (id, story_id, user_id, reply_text, created_at)
-- VALUES
--   ('EE0e8400-e29b-41d4-a716-446655440001', 'BB0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004', '美しい朝日ですね！私も一緒に瞑想させていただきました🌅', NOW() - INTERVAL '2 hours'),
--   ('EE0e8400-e29b-41d4-a716-446655440002', 'BB0e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', '11:11のエネルギーを強く感じています。ありがとうございます。', NOW() - INTERVAL '5 hours'),
--   ('EE0e8400-e29b-41d4-a716-446655440003', 'BB0e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', '私も紫の光が見えました！シンクロニシティですね✨', NOW() - INTERVAL '9 hours')
-- ON CONFLICT (id) DO NOTHING;