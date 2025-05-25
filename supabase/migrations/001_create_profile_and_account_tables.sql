-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profile table
CREATE TABLE IF NOT EXISTS profile (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    google_uid TEXT UNIQUE,
    apple_uid TEXT UNIQUE,
    display_name TEXT NOT NULL,
    profile_text TEXT,
    profile_image_url TEXT,
    intro_audio_url TEXT,
    external_link_url TEXT,
    prefecture TEXT,
    city TEXT,
    fcm_token TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create account table for multi-account functionality
CREATE TABLE IF NOT EXISTS account (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT false,
    switch_order INTEGER NOT NULL CHECK (switch_order BETWEEN 1 AND 5),
    last_switched_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(profile_id, switch_order)
);

-- Create follow table
CREATE TABLE IF NOT EXISTS follow (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
    followee_id UUID NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
    follow_type TEXT NOT NULL CHECK (follow_type IN ('normal', 'close_friend')),
    status TEXT NOT NULL CHECK (status IN ('active', 'pending', 'blocked')),
    follow_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    unfollowed_at TIMESTAMPTZ,
    unfollow_reason TEXT,
    UNIQUE(follower_id, followee_id)
);

-- Create indexes
CREATE INDEX idx_profile_google_uid ON profile(google_uid);
CREATE INDEX idx_profile_apple_uid ON profile(apple_uid);
CREATE INDEX idx_profile_location ON profile(prefecture, city);
CREATE INDEX idx_account_profile_id ON account(profile_id);
CREATE INDEX idx_account_is_active ON account(is_active);
CREATE INDEX idx_follow_follower_id ON follow(follower_id);
CREATE INDEX idx_follow_followee_id ON follow(followee_id);
CREATE INDEX idx_follow_status ON follow(status);
CREATE INDEX idx_follow_created_at ON follow(created_at DESC);

-- Create update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profile_updated_at BEFORE UPDATE ON profile
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE account ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profile
CREATE POLICY "Profiles are viewable by everyone" ON profile
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profile
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profile
    FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for account
CREATE POLICY "Users can view own accounts" ON account
    FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "Users can manage own accounts" ON account
    FOR ALL USING (profile_id = auth.uid());

-- RLS Policies for follow
CREATE POLICY "Anyone can view active follows" ON follow
    FOR SELECT USING (status = 'active' OR follower_id = auth.uid() OR followee_id = auth.uid());

CREATE POLICY "Users can create follows" ON follow
    FOR INSERT WITH CHECK (follower_id = auth.uid());

CREATE POLICY "Users can update own follows" ON follow
    FOR UPDATE USING (follower_id = auth.uid());

CREATE POLICY "Users can delete own follows" ON follow
    FOR DELETE USING (follower_id = auth.uid());