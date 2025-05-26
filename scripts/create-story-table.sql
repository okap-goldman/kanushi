-- ストーリーテーブルが存在しない場合は作成
-- このSQLをSupabase SQL Editorで実行してください

-- Create story table
CREATE TABLE IF NOT EXISTS story (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    edit_data JSONB,
    is_repost BOOLEAN NOT NULL DEFAULT false,
    original_story_id UUID REFERENCES story(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_story_user_id ON story(user_id);
CREATE INDEX IF NOT EXISTS idx_story_expires_at ON story(expires_at);
CREATE INDEX IF NOT EXISTS idx_story_created_at ON story(created_at DESC);

-- Enable RLS
ALTER TABLE story ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Active stories are viewable by everyone" ON story;
DROP POLICY IF EXISTS "Users can create own stories" ON story;
DROP POLICY IF EXISTS "Users can delete own stories" ON story;

-- RLS Policies for story
CREATE POLICY "Active stories are viewable by everyone" ON story
    FOR SELECT USING (expires_at > NOW());

CREATE POLICY "Users can create own stories" ON story
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own stories" ON story
    FOR DELETE USING (auth.uid() = user_id);