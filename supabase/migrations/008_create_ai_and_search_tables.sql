-- Create ai_playlist table
CREATE TABLE IF NOT EXISTS ai_playlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    playlist_type TEXT NOT NULL CHECK (playlist_type IN ('daily', 'mood', 'activity', 'personalized')),
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days')
);

-- Create ai_playlist_post junction table
CREATE TABLE IF NOT EXISTS ai_playlist_post (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    playlist_id UUID NOT NULL REFERENCES ai_playlist(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES post(id) ON DELETE CASCADE,
    UNIQUE(playlist_id, post_id)
);

-- Create chat_session table
CREATE TABLE IF NOT EXISTS chat_session (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ
);

-- Create chat_message table
CREATE TABLE IF NOT EXISTS chat_message (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES chat_session(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    function_calls JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create search_history table
CREATE TABLE IF NOT EXISTS search_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    searched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_ai_playlist_user_id ON ai_playlist(user_id);
CREATE INDEX idx_ai_playlist_playlist_type ON ai_playlist(playlist_type);
CREATE INDEX idx_ai_playlist_generated_at ON ai_playlist(generated_at DESC);
CREATE INDEX idx_ai_playlist_expires_at ON ai_playlist(expires_at);

CREATE INDEX idx_ai_playlist_post_playlist_id ON ai_playlist_post(playlist_id);
CREATE INDEX idx_ai_playlist_post_post_id ON ai_playlist_post(post_id);

CREATE INDEX idx_chat_session_user_id ON chat_session(user_id);
CREATE INDEX idx_chat_session_created_at ON chat_session(created_at DESC);

CREATE INDEX idx_chat_message_session_id ON chat_message(session_id);
CREATE INDEX idx_chat_message_user_id ON chat_message(user_id);
CREATE INDEX idx_chat_message_created_at ON chat_message(created_at DESC);

CREATE INDEX idx_search_history_user_id ON search_history(user_id);
CREATE INDEX idx_search_history_searched_at ON search_history(searched_at DESC);
CREATE INDEX idx_search_history_query ON search_history(query);

-- Enable RLS
ALTER TABLE ai_playlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_playlist_post ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_session ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_message ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_playlist
CREATE POLICY "Users can view own playlists" ON ai_playlist
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create playlists for users" ON ai_playlist
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own playlists" ON ai_playlist
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for ai_playlist_post
CREATE POLICY "Users can view own playlist posts" ON ai_playlist_post
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM ai_playlist 
            WHERE ai_playlist.id = ai_playlist_post.playlist_id 
            AND ai_playlist.user_id = auth.uid()
        )
    );

CREATE POLICY "System can manage playlist posts" ON ai_playlist_post
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM ai_playlist 
            WHERE ai_playlist.id = ai_playlist_post.playlist_id 
            AND ai_playlist.user_id = auth.uid()
        )
    );

-- RLS Policies for chat_session
CREATE POLICY "Users can view own chat sessions" ON chat_session
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own chat sessions" ON chat_session
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat sessions" ON chat_session
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for chat_message
CREATE POLICY "Users can view messages in own sessions" ON chat_message
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chat_session 
            WHERE chat_session.id = chat_message.session_id 
            AND chat_session.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create messages in own sessions" ON chat_message
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM chat_session 
            WHERE chat_session.id = chat_message.session_id 
            AND chat_session.user_id = auth.uid()
        )
    );

-- RLS Policies for search_history
CREATE POLICY "Users can view own search history" ON search_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own search history" ON search_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own search history" ON search_history
    FOR DELETE USING (auth.uid() = user_id);