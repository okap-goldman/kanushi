-- Alter story table to support text-only stories
ALTER TABLE story
    ALTER COLUMN image_url DROP NOT NULL,
    ADD COLUMN text_content TEXT,
    ADD COLUMN background_color TEXT,
    ADD COLUMN font_style TEXT,
    ADD COLUMN caption TEXT,
    ADD COLUMN location TEXT;

-- Update default value for expires_at (if needed)
ALTER TABLE story
    ALTER COLUMN expires_at SET DEFAULT (NOW() + INTERVAL '24 hours');

-- Update default value for offline_content expires_at (if needed)
ALTER TABLE offline_content
    ALTER COLUMN expires_at SET DEFAULT (NOW() + INTERVAL '30 days');

-- Create story_viewer table
CREATE TABLE IF NOT EXISTS story_viewer (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    story_id UUID NOT NULL REFERENCES story(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
    viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(story_id, user_id)
);

-- Create story_reaction table
CREATE TABLE IF NOT EXISTS story_reaction (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    story_id UUID NOT NULL REFERENCES story(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(story_id, user_id)
);

-- Create story_reply table (sent as DM)
CREATE TABLE IF NOT EXISTS story_reply (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    story_id UUID NOT NULL REFERENCES story(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
    reply_text TEXT NOT NULL,
    message_id UUID, -- References messages table after DM is sent
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for story_viewer
CREATE INDEX idx_story_viewer_story_id ON story_viewer(story_id);
CREATE INDEX idx_story_viewer_user_id ON story_viewer(user_id);

-- Create indexes for story_reaction
CREATE INDEX idx_story_reaction_story_id ON story_reaction(story_id);
CREATE INDEX idx_story_reaction_user_id ON story_reaction(user_id);

-- Create indexes for story_reply
CREATE INDEX idx_story_reply_story_id ON story_reply(story_id);
CREATE INDEX idx_story_reply_user_id ON story_reply(user_id);

-- Add RLS policies for story_viewer
ALTER TABLE story_viewer ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own story views" ON story_viewer
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM story s 
            WHERE s.id = story_viewer.story_id 
            AND s.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can mark stories as viewed" ON story_viewer
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add RLS policies for story_reaction
ALTER TABLE story_reaction ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reactions on their stories" ON story_reaction
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM story s 
            WHERE s.id = story_reaction.story_id 
            AND (s.user_id = auth.uid() OR story_reaction.user_id = auth.uid())
        )
    );

CREATE POLICY "Users can add reactions to stories" ON story_reaction
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions" ON story_reaction
    FOR DELETE USING (auth.uid() = user_id);

-- Add RLS policies for story_reply
ALTER TABLE story_reply ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view replies to their stories" ON story_reply
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM story s 
            WHERE s.id = story_reply.story_id 
            AND s.user_id = auth.uid()
        ) OR auth.uid() = user_id
    );

CREATE POLICY "Users can send replies to stories" ON story_reply
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Update story table RLS policies for new columns
CREATE POLICY "Users can create stories with all fields" ON story
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stories" ON story
    FOR UPDATE USING (auth.uid() = user_id);