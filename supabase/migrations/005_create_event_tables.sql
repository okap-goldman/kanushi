-- Create event table
CREATE TABLE IF NOT EXISTS event (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_user_id UUID NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    event_type TEXT NOT NULL CHECK (event_type IN ('online', 'offline', 'hybrid')),
    location TEXT,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    fee DECIMAL(10,2),
    currency TEXT DEFAULT 'JPY',
    refund_policy TEXT,
    live_room_id UUID REFERENCES live_room(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (ends_at > starts_at)
);

-- Create event_participant table
CREATE TABLE IF NOT EXISTS event_participant (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES event(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('registered', 'attended', 'cancelled', 'no_show')),
    payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'refunded')),
    stores_payment_id TEXT,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

-- Add foreign key constraint for event_id in post table
ALTER TABLE post 
    ADD CONSTRAINT fk_post_event_id 
    FOREIGN KEY (event_id) REFERENCES event(id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX idx_event_creator_user_id ON event(creator_user_id);
CREATE INDEX idx_event_event_type ON event(event_type);
CREATE INDEX idx_event_starts_at ON event(starts_at);
CREATE INDEX idx_event_ends_at ON event(ends_at);
CREATE INDEX idx_event_created_at ON event(created_at DESC);

CREATE INDEX idx_event_participant_event_id ON event_participant(event_id);
CREATE INDEX idx_event_participant_user_id ON event_participant(user_id);
CREATE INDEX idx_event_participant_status ON event_participant(status);
CREATE INDEX idx_event_participant_payment_status ON event_participant(payment_status);

-- Enable RLS
ALTER TABLE event ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participant ENABLE ROW LEVEL SECURITY;

-- RLS Policies for event
CREATE POLICY "Events are viewable by everyone" ON event
    FOR SELECT USING (true);

CREATE POLICY "Users can create events" ON event
    FOR INSERT WITH CHECK (auth.uid() = creator_user_id);

CREATE POLICY "Event creators can update own events" ON event
    FOR UPDATE USING (auth.uid() = creator_user_id);

CREATE POLICY "Event creators can delete own events" ON event
    FOR DELETE USING (auth.uid() = creator_user_id);

-- RLS Policies for event_participant
CREATE POLICY "Event participants are viewable by event creator and participants" ON event_participant
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM event 
            WHERE event.id = event_participant.event_id 
            AND event.creator_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can register for events" ON event_participant
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own participation" ON event_participant
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Event creators can update participant status" ON event_participant
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM event 
            WHERE event.id = event_participant.event_id 
            AND event.creator_user_id = auth.uid()
        )
    );