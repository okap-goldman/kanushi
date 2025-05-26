-- ストーリーズデータのみを挿入
-- ストーリーテーブルが作成済みであることを前提とします

-- ストーリーズデータの挿入
INSERT INTO story (id, user_id, image_url, edit_data, is_repost, original_story_id, expires_at, created_at)
VALUES
  -- 光の導き手 明子のストーリー（朝の瞑想風景）
  ('BB0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 
   'https://example.com/stories/meditation-sunrise.jpg', 
   '{"filters": ["warm"], "stickers": [{"type": "sparkle", "x": 100, "y": 200}], "caption": "朝日と共に瞑想の時間✨ 今日も光と共に歩みます", "location": "富士山麓瞑想センター"}',
   false,
   NULL,
   NOW() + INTERVAL '20 hours',
   NOW() - INTERVAL '4 hours'),
   
  -- 宇宙意識 龍馬のストーリー（11:11のポータル）
  ('BB0e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 
   'https://example.com/stories/portal-1111.jpg', 
   '{"text_content": "11:11\n今、宇宙のポータルが開いています\n深呼吸をして\nエネルギーを受け取ってください", "background_color": "#1a0033", "font_style": "cosmic", "textPosition": {"x": "center", "y": "center"}, "animation": "glow", "caption": "特別なエネルギーが降り注いでいます"}',
   false,
   NULL,
   NOW() + INTERVAL '18 hours',
   NOW() - INTERVAL '6 hours'),
   
  -- 癒しの音 さくらのストーリー（クリスタルボウル準備）
  ('BB0e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 
   'https://example.com/stories/crystal-bowls.jpg', 
   '{"filters": ["ethereal"], "stickers": [{"type": "musical_note", "x": 150, "y": 100}, {"type": "heart", "x": 200, "y": 150}], "caption": "今夜のヒーリングセッションの準備中です🎵", "location": "ヒーリングサロン光の音"}',
   false,
   NULL,
   NOW() + INTERVAL '16 hours',
   NOW() - INTERVAL '8 hours'),
   
  -- 目醒めの案内人 健太のストーリー（エネルギーワーク体験シェア）
  ('BB0e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', 
   'https://example.com/stories/energy-work.jpg', 
   '{"text_content": "今朝のエネルギーワークで\n第三の目が完全に開きました\n\n紫の光が見えた方\nコメントで教えてください", "background_color": "#4a148c", "font_style": "mystical", "textPosition": {"x": "center", "y": "middle"}, "effects": ["gradient"], "caption": "覚醒体験をシェア"}',
   false,
   NULL,
   NOW() + INTERVAL '14 hours',
   NOW() - INTERVAL '10 hours'),
   
  -- 天使のメッセンジャー 美咲のストーリー（天使からのメッセージ）
  ('BB0e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440005', 
   'https://example.com/stories/angel-card.jpg', 
   '{"filters": ["soft"], "stickers": [{"type": "angel_wings", "x": 50, "y": 50}, {"type": "feather", "x": 250, "y": 300}], "caption": "今日のエンジェルメッセージ：信頼と委ねること💫"}',
   false,
   NULL,
   NOW() + INTERVAL '12 hours',
   NOW() - INTERVAL '12 hours'),
   
  -- アカシックリーダー 蓮のストーリー（リポスト）
  ('BB0e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440006', 
   'https://example.com/stories/repost.jpg', 
   '{"text_content": "重要なメッセージなのでリポストします", "background_color": "#000033", "font_style": "minimal", "textPosition": {"x": "center", "y": "top"}, "caption": "宇宙からの緊急メッセージ"}',
   true,
   'BB0e8400-e29b-41d4-a716-446655440002',
   NOW() + INTERVAL '10 hours',
   NOW() - INTERVAL '14 hours'),
   
  -- エナジーヒーラー 翔のストーリー（チャクラ診断）
  ('BB0e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440007', 
   'https://example.com/stories/chakra-diagnosis.jpg', 
   '{"text_content": "あなたのチャクラ診断\n\n画面に手を当てて\n温かさを感じる場所が\n今活性化しているチャクラです", "background_color": "linear-gradient(45deg, #ff6b6b, #4ecdc4)", "font_style": "healing", "textPosition": {"x": "center", "y": "center"}, "interactive": true, "caption": "インタラクティブチャクラ診断"}',
   false,
   NULL,
   NOW() + INTERVAL '8 hours',
   NOW() - INTERVAL '16 hours'),
   
  -- 覚醒のファシリテーター 真理子のストーリー（クンダリーニ体験）
  ('BB0e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440008', 
   'https://example.com/stories/kundalini-energy.jpg', 
   '{"filters": ["energy"], "animation": "pulse", "stickers": [{"type": "snake", "x": 100, "y": 400, "animation": "rise"}], "caption": "クンダリーニの上昇を視覚化してみました🐍✨", "location": "瞑想ルーム"}',
   false,
   NULL,
   NOW() + INTERVAL '6 hours',
   NOW() - INTERVAL '18 hours')
ON CONFLICT (id) DO NOTHING;