-- Create notification table
CREATE TABLE IF NOT EXISTS notification (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    notification_type TEXT NOT NULL CHECK (
        notification_type IN (
            'follow', 'like', 'comment', 'mention', 'dm', 
            'event_reminder', 'event_update', 'gift_received',
            'order_update', 'group_invite', 'system'
        )
    ),
    data JSONB,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create notification_setting table
CREATE TABLE IF NOT EXISTS notification_setting (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL CHECK (
        notification_type IN (
            'follow', 'like', 'comment', 'mention', 'dm', 
            'event_reminder', 'event_update', 'gift_received',
            'order_update', 'group_invite', 'system'
        )
    ),
    enabled BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, notification_type)
);

-- Create schedule_poll table (Low priority feature)
CREATE TABLE IF NOT EXISTS schedule_poll (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_user_id UUID NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    related_event_id UUID REFERENCES event(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deadline_at TIMESTAMPTZ NOT NULL
);

-- Create schedule_candidate table
CREATE TABLE IF NOT EXISTS schedule_candidate (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    poll_id UUID NOT NULL REFERENCES schedule_poll(id) ON DELETE CASCADE,
    candidate_datetime TIMESTAMPTZ NOT NULL,
    order_index INTEGER NOT NULL,
    UNIQUE(poll_id, order_index)
);

-- Create schedule_vote table
CREATE TABLE IF NOT EXISTS schedule_vote (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    poll_id UUID NOT NULL REFERENCES schedule_poll(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES schedule_candidate(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
    vote_type TEXT NOT NULL CHECK (vote_type IN ('available', 'maybe', 'unavailable')),
    voted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(candidate_id, user_id)
);

-- Create indexes
CREATE INDEX idx_notification_user_id ON notification(user_id);
CREATE INDEX idx_notification_notification_type ON notification(notification_type);
CREATE INDEX idx_notification_is_read ON notification(is_read);
CREATE INDEX idx_notification_created_at ON notification(created_at DESC);

CREATE INDEX idx_notification_setting_user_id ON notification_setting(user_id);

CREATE INDEX idx_schedule_poll_creator_user_id ON schedule_poll(creator_user_id);
CREATE INDEX idx_schedule_poll_related_event_id ON schedule_poll(related_event_id);
CREATE INDEX idx_schedule_poll_deadline_at ON schedule_poll(deadline_at);

CREATE INDEX idx_schedule_candidate_poll_id ON schedule_candidate(poll_id);

CREATE INDEX idx_schedule_vote_poll_id ON schedule_vote(poll_id);
CREATE INDEX idx_schedule_vote_candidate_id ON schedule_vote(candidate_id);
CREATE INDEX idx_schedule_vote_user_id ON schedule_vote(user_id);

-- Create update trigger
CREATE TRIGGER update_notification_setting_updated_at BEFORE UPDATE ON notification_setting
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE notification ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_setting ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_poll ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_candidate ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_vote ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notification
CREATE POLICY "Users can view own notifications" ON notification
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON notification
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own notifications" ON notification
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications" ON notification
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for notification_setting
CREATE POLICY "Users can view own notification settings" ON notification_setting
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own notification settings" ON notification_setting
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for schedule_poll
CREATE POLICY "Schedule polls are viewable by everyone" ON schedule_poll
    FOR SELECT USING (true);

CREATE POLICY "Users can create schedule polls" ON schedule_poll
    FOR INSERT WITH CHECK (auth.uid() = creator_user_id);

CREATE POLICY "Poll creators can update own polls" ON schedule_poll
    FOR UPDATE USING (auth.uid() = creator_user_id);

CREATE POLICY "Poll creators can delete own polls" ON schedule_poll
    FOR DELETE USING (auth.uid() = creator_user_id);

-- RLS Policies for schedule_candidate
CREATE POLICY "Schedule candidates are viewable by everyone" ON schedule_candidate
    FOR SELECT USING (true);

CREATE POLICY "Poll creators can manage candidates" ON schedule_candidate
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM schedule_poll 
            WHERE schedule_poll.id = schedule_candidate.poll_id 
            AND schedule_poll.creator_user_id = auth.uid()
        )
    );

-- RLS Policies for schedule_vote
CREATE POLICY "Schedule votes are viewable by poll creator and voters" ON schedule_vote
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM schedule_poll 
            WHERE schedule_poll.id = schedule_vote.poll_id 
            AND schedule_poll.creator_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create own votes" ON schedule_vote
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own votes" ON schedule_vote
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own votes" ON schedule_vote
    FOR DELETE USING (auth.uid() = user_id);