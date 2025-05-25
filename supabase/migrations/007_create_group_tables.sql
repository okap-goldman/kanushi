-- Create group table
CREATE TABLE IF NOT EXISTS "group" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_user_id UUID NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    group_type TEXT NOT NULL CHECK (group_type IN ('public', 'private', 'subscription')),
    subscription_price DECIMAL(10,2),
    stores_price_id TEXT,
    member_limit INTEGER CHECK (member_limit > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (
        (group_type = 'subscription' AND subscription_price IS NOT NULL AND stores_price_id IS NOT NULL) OR
        (group_type != 'subscription' AND subscription_price IS NULL AND stores_price_id IS NULL)
    )
);

-- Create group_member table
CREATE TABLE IF NOT EXISTS group_member (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES "group"(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'moderator', 'member')),
    status TEXT NOT NULL CHECK (status IN ('active', 'pending', 'blocked', 'left')),
    stores_subscription_id TEXT,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    left_at TIMESTAMPTZ,
    UNIQUE(group_id, user_id)
);

-- Create group_chat table
CREATE TABLE IF NOT EXISTS group_chat (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES "group"(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
    message_type TEXT NOT NULL CHECK (message_type IN ('text', 'image', 'audio', 'video', 'system')),
    text_content TEXT,
    media_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add foreign key for group_id in post table
ALTER TABLE post 
    ADD CONSTRAINT fk_post_group_id 
    FOREIGN KEY (group_id) REFERENCES "group"(id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX idx_group_owner_user_id ON "group"(owner_user_id);
CREATE INDEX idx_group_group_type ON "group"(group_type);
CREATE INDEX idx_group_created_at ON "group"(created_at DESC);

CREATE INDEX idx_group_member_group_id ON group_member(group_id);
CREATE INDEX idx_group_member_user_id ON group_member(user_id);
CREATE INDEX idx_group_member_role ON group_member(role);
CREATE INDEX idx_group_member_status ON group_member(status);

CREATE INDEX idx_group_chat_group_id ON group_chat(group_id);
CREATE INDEX idx_group_chat_user_id ON group_chat(user_id);
CREATE INDEX idx_group_chat_created_at ON group_chat(created_at DESC);

-- Enable RLS
ALTER TABLE "group" ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_member ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_chat ENABLE ROW LEVEL SECURITY;

-- RLS Policies for group
CREATE POLICY "Public groups are viewable by everyone" ON "group"
    FOR SELECT USING (group_type = 'public');

CREATE POLICY "Private groups are viewable by members" ON "group"
    FOR SELECT USING (
        group_type != 'public' AND
        EXISTS (
            SELECT 1 FROM group_member 
            WHERE group_member.group_id = "group".id 
            AND group_member.user_id = auth.uid()
            AND group_member.status = 'active'
        )
    );

CREATE POLICY "Users can create groups" ON "group"
    FOR INSERT WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Group owners can update groups" ON "group"
    FOR UPDATE USING (auth.uid() = owner_user_id);

CREATE POLICY "Group owners can delete groups" ON "group"
    FOR DELETE USING (auth.uid() = owner_user_id);

-- RLS Policies for group_member
CREATE POLICY "Group members are viewable by members" ON group_member
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM group_member AS gm
            WHERE gm.group_id = group_member.group_id 
            AND gm.user_id = auth.uid()
            AND gm.status = 'active'
        )
    );

CREATE POLICY "Users can join public groups" ON group_member
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM "group" 
            WHERE "group".id = group_id 
            AND "group".group_type = 'public'
        )
    );

CREATE POLICY "Users can update own membership" ON group_member
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage members" ON group_member
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM group_member AS gm
            WHERE gm.group_id = group_member.group_id 
            AND gm.user_id = auth.uid()
            AND gm.role IN ('owner', 'admin')
            AND gm.status = 'active'
        )
    );

-- RLS Policies for group_chat
CREATE POLICY "Group chats are viewable by active members" ON group_chat
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM group_member 
            WHERE group_member.group_id = group_chat.group_id 
            AND group_member.user_id = auth.uid()
            AND group_member.status = 'active'
        )
    );

CREATE POLICY "Active members can send messages" ON group_chat
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM group_member 
            WHERE group_member.group_id = group_chat.group_id 
            AND group_member.user_id = auth.uid()
            AND group_member.status = 'active'
        )
    );