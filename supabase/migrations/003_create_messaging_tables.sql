-- Create dm_thread table
CREATE TABLE IF NOT EXISTS dm_thread (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user1_id UUID NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user1_id, user2_id),
    CHECK (user1_id < user2_id) -- Ensure consistent ordering
);

-- Create direct_message table
CREATE TABLE IF NOT EXISTS direct_message (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    thread_id UUID NOT NULL REFERENCES dm_thread(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
    message_type TEXT NOT NULL CHECK (message_type IN ('text', 'image', 'audio', 'video')),
    text_content TEXT,
    media_url TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_dm_thread_user1_id ON dm_thread(user1_id);
CREATE INDEX idx_dm_thread_user2_id ON dm_thread(user2_id);
CREATE INDEX idx_dm_thread_created_at ON dm_thread(created_at DESC);

CREATE INDEX idx_direct_message_thread_id ON direct_message(thread_id);
CREATE INDEX idx_direct_message_sender_id ON direct_message(sender_id);
CREATE INDEX idx_direct_message_created_at ON direct_message(created_at DESC);
CREATE INDEX idx_direct_message_is_read ON direct_message(is_read);

-- Create function to ensure user1_id < user2_id
CREATE OR REPLACE FUNCTION normalize_dm_thread_users()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.user1_id > NEW.user2_id THEN
        -- Swap the users to maintain consistent ordering
        NEW.user1_id := NEW.user2_id;
        NEW.user2_id := OLD.user1_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER normalize_dm_thread_users_trigger
BEFORE INSERT OR UPDATE ON dm_thread
FOR EACH ROW EXECUTE FUNCTION normalize_dm_thread_users();

-- Enable RLS
ALTER TABLE dm_thread ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_message ENABLE ROW LEVEL SECURITY;

-- RLS Policies for dm_thread
CREATE POLICY "Users can view their own threads" ON dm_thread
    FOR SELECT USING (
        auth.uid() = user1_id OR auth.uid() = user2_id
    );

CREATE POLICY "Users can create threads" ON dm_thread
    FOR INSERT WITH CHECK (
        auth.uid() = user1_id OR auth.uid() = user2_id
    );

-- RLS Policies for direct_message
CREATE POLICY "Users can view messages in their threads" ON direct_message
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM dm_thread 
            WHERE dm_thread.id = thread_id 
            AND (dm_thread.user1_id = auth.uid() OR dm_thread.user2_id = auth.uid())
        )
    );

CREATE POLICY "Users can send messages in their threads" ON direct_message
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM dm_thread 
            WHERE dm_thread.id = thread_id 
            AND (dm_thread.user1_id = auth.uid() OR dm_thread.user2_id = auth.uid())
        )
    );

CREATE POLICY "Users can mark messages as read" ON direct_message
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM dm_thread 
            WHERE dm_thread.id = thread_id 
            AND (dm_thread.user1_id = auth.uid() OR dm_thread.user2_id = auth.uid())
        )
    );