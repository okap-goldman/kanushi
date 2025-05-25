-- Create live_room table
CREATE TABLE IF NOT EXISTS live_room (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    host_user_id UUID NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('scheduled', 'live', 'ended', 'cancelled')),
    livekit_room_name TEXT UNIQUE,
    max_speakers INTEGER NOT NULL DEFAULT 8,
    is_recording BOOLEAN NOT NULL DEFAULT false,
    post_id UUID,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create room_participant table
CREATE TABLE IF NOT EXISTS room_participant (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES live_room(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('host', 'speaker', 'listener', 'moderator')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    left_at TIMESTAMPTZ,
    UNIQUE(room_id, user_id)
);

-- Create room_chat table
CREATE TABLE IF NOT EXISTS room_chat (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES live_room(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    shared_url TEXT,
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create gift table
CREATE TABLE IF NOT EXISTS gift (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
    post_id UUID REFERENCES post(id) ON DELETE SET NULL,
    room_id UUID REFERENCES live_room(id) ON DELETE SET NULL,
    amount INTEGER NOT NULL CHECK (amount > 0),
    platform_fee_rate DECIMAL(5,4) NOT NULL DEFAULT 0.3,
    stores_payment_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (post_id IS NOT NULL OR room_id IS NOT NULL)
);

-- Add foreign key for post_id in live_room after post table exists
ALTER TABLE live_room 
    ADD CONSTRAINT fk_live_room_post_id 
    FOREIGN KEY (post_id) REFERENCES post(id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX idx_live_room_host_user_id ON live_room(host_user_id);
CREATE INDEX idx_live_room_status ON live_room(status);
CREATE INDEX idx_live_room_started_at ON live_room(started_at DESC);
CREATE INDEX idx_live_room_created_at ON live_room(created_at DESC);

CREATE INDEX idx_room_participant_room_id ON room_participant(room_id);
CREATE INDEX idx_room_participant_user_id ON room_participant(user_id);
CREATE INDEX idx_room_participant_role ON room_participant(role);

CREATE INDEX idx_room_chat_room_id ON room_chat(room_id);
CREATE INDEX idx_room_chat_user_id ON room_chat(user_id);
CREATE INDEX idx_room_chat_created_at ON room_chat(created_at DESC);
CREATE INDEX idx_room_chat_is_pinned ON room_chat(is_pinned);

CREATE INDEX idx_gift_sender_id ON gift(sender_id);
CREATE INDEX idx_gift_recipient_id ON gift(recipient_id);
CREATE INDEX idx_gift_post_id ON gift(post_id);
CREATE INDEX idx_gift_room_id ON gift(room_id);
CREATE INDEX idx_gift_created_at ON gift(created_at DESC);

-- Enable RLS
ALTER TABLE live_room ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_participant ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_chat ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift ENABLE ROW LEVEL SECURITY;

-- RLS Policies for live_room
CREATE POLICY "Live rooms are viewable by everyone" ON live_room
    FOR SELECT USING (true);

CREATE POLICY "Users can create own rooms" ON live_room
    FOR INSERT WITH CHECK (auth.uid() = host_user_id);

CREATE POLICY "Hosts can update own rooms" ON live_room
    FOR UPDATE USING (auth.uid() = host_user_id);

-- RLS Policies for room_participant
CREATE POLICY "Room participants are viewable by everyone" ON room_participant
    FOR SELECT USING (true);

CREATE POLICY "Users can join rooms" ON room_participant
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own participation" ON room_participant
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for room_chat
CREATE POLICY "Room chats are viewable by participants" ON room_chat
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM room_participant 
            WHERE room_participant.room_id = room_chat.room_id 
            AND room_participant.user_id = auth.uid()
        )
    );

CREATE POLICY "Participants can send messages" ON room_chat
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM room_participant 
            WHERE room_participant.room_id = room_chat.room_id 
            AND room_participant.user_id = auth.uid()
        )
    );

CREATE POLICY "Hosts and moderators can pin messages" ON room_chat
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM room_participant 
            WHERE room_participant.room_id = room_chat.room_id 
            AND room_participant.user_id = auth.uid()
            AND room_participant.role IN ('host', 'moderator')
        )
    );

-- RLS Policies for gift
CREATE POLICY "Gifts are viewable by sender and recipient" ON gift
    FOR SELECT USING (
        auth.uid() = sender_id OR auth.uid() = recipient_id
    );

CREATE POLICY "Users can send gifts" ON gift
    FOR INSERT WITH CHECK (auth.uid() = sender_id);