-- Create post table
CREATE TABLE IF NOT EXISTS post (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
    content_type TEXT NOT NULL CHECK (content_type IN ('text', 'image', 'audio', 'video')),
    text_content TEXT,
    media_url TEXT,
    preview_url TEXT,
    waveform_url TEXT,
    duration_seconds INTEGER,
    youtube_video_id TEXT,
    event_id UUID,
    group_id UUID,
    ai_metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Create story table
CREATE TABLE IF NOT EXISTS story (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    edit_data JSONB,
    is_repost BOOLEAN NOT NULL DEFAULT false,
    original_story_id UUID REFERENCES story(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create hashtag table
CREATE TABLE IF NOT EXISTS hashtag (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    use_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create post_hashtag junction table
CREATE TABLE IF NOT EXISTS post_hashtag (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES post(id) ON DELETE CASCADE,
    hashtag_id UUID NOT NULL REFERENCES hashtag(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(post_id, hashtag_id)
);

-- Create comment table
CREATE TABLE IF NOT EXISTS comment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES post(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create like table
CREATE TABLE IF NOT EXISTS "like" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES post(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Create highlight table
CREATE TABLE IF NOT EXISTS highlight (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES post(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Create bookmark table
CREATE TABLE IF NOT EXISTS bookmark (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES post(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Create offline_content table
CREATE TABLE IF NOT EXISTS offline_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES post(id) ON DELETE CASCADE,
    size_bytes INTEGER NOT NULL,
    cached_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 month'),
    UNIQUE(user_id, post_id)
);

-- Create indexes
CREATE INDEX idx_post_user_id ON post(user_id);
CREATE INDEX idx_post_content_type ON post(content_type);
CREATE INDEX idx_post_created_at ON post(created_at DESC);
CREATE INDEX idx_post_deleted_at ON post(deleted_at);
CREATE INDEX idx_post_event_id ON post(event_id);
CREATE INDEX idx_post_group_id ON post(group_id);

CREATE INDEX idx_story_user_id ON story(user_id);
CREATE INDEX idx_story_expires_at ON story(expires_at);
CREATE INDEX idx_story_created_at ON story(created_at DESC);

CREATE INDEX idx_hashtag_name ON hashtag(name);
CREATE INDEX idx_hashtag_use_count ON hashtag(use_count DESC);

CREATE INDEX idx_post_hashtag_post_id ON post_hashtag(post_id);
CREATE INDEX idx_post_hashtag_hashtag_id ON post_hashtag(hashtag_id);

CREATE INDEX idx_comment_post_id ON comment(post_id);
CREATE INDEX idx_comment_user_id ON comment(user_id);
CREATE INDEX idx_comment_created_at ON comment(created_at DESC);

CREATE INDEX idx_like_post_id ON "like"(post_id);
CREATE INDEX idx_like_user_id ON "like"(user_id);

CREATE INDEX idx_highlight_post_id ON highlight(post_id);
CREATE INDEX idx_highlight_user_id ON highlight(user_id);

CREATE INDEX idx_bookmark_post_id ON bookmark(post_id);
CREATE INDEX idx_bookmark_user_id ON bookmark(user_id);

CREATE INDEX idx_offline_content_user_id ON offline_content(user_id);
CREATE INDEX idx_offline_content_expires_at ON offline_content(expires_at);

-- Create update trigger
CREATE TRIGGER update_post_updated_at BEFORE UPDATE ON post
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE post ENABLE ROW LEVEL SECURITY;
ALTER TABLE story ENABLE ROW LEVEL SECURITY;
ALTER TABLE hashtag ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_hashtag ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment ENABLE ROW LEVEL SECURITY;
ALTER TABLE "like" ENABLE ROW LEVEL SECURITY;
ALTER TABLE highlight ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmark ENABLE ROW LEVEL SECURITY;
ALTER TABLE offline_content ENABLE ROW LEVEL SECURITY;

-- RLS Policies for post
CREATE POLICY "Posts are viewable by everyone" ON post
    FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "Users can create own posts" ON post
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts" ON post
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can soft delete own posts" ON post
    FOR UPDATE USING (auth.uid() = user_id AND deleted_at IS NULL);

-- RLS Policies for story
CREATE POLICY "Active stories are viewable by everyone" ON story
    FOR SELECT USING (expires_at > NOW());

CREATE POLICY "Users can create own stories" ON story
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own stories" ON story
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for hashtag
CREATE POLICY "Hashtags are viewable by everyone" ON hashtag
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create hashtags" ON hashtag
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for post_hashtag
CREATE POLICY "Post hashtags are viewable by everyone" ON post_hashtag
    FOR SELECT USING (true);

CREATE POLICY "Post owners can tag their posts" ON post_hashtag
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM post WHERE post.id = post_id AND post.user_id = auth.uid())
    );

-- RLS Policies for comment
CREATE POLICY "Comments are viewable by everyone" ON comment
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create comments" ON comment
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" ON comment
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON comment
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for like
CREATE POLICY "Likes are viewable by everyone" ON "like"
    FOR SELECT USING (true);

CREATE POLICY "Users can like posts" ON "like"
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts" ON "like"
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for highlight
CREATE POLICY "Highlights are viewable by everyone" ON highlight
    FOR SELECT USING (true);

CREATE POLICY "Users can highlight posts" ON highlight
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove highlights" ON highlight
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for bookmark
CREATE POLICY "Users can view own bookmarks" ON bookmark
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create bookmarks" ON bookmark
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete bookmarks" ON bookmark
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for offline_content
CREATE POLICY "Users can view own offline content" ON offline_content
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own offline content" ON offline_content
    FOR ALL USING (auth.uid() = user_id);