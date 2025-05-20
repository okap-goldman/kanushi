-- Events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ NOT NULL,
  location TEXT,
  location_details JSONB,
  is_online BOOLEAN DEFAULT false,
  online_url TEXT,
  max_participants INTEGER,
  price INTEGER DEFAULT 0,
  currency TEXT DEFAULT 'JPY',
  registration_deadline TIMESTAMPTZ,
  cover_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_published BOOLEAN DEFAULT false,
  is_cancelled BOOLEAN DEFAULT false,
  category TEXT,
  privacy_level TEXT DEFAULT 'public', -- public, friends, private
  refund_policy TEXT,
  event_hash TEXT UNIQUE
);

-- Event participants table
CREATE TABLE IF NOT EXISTS event_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL, -- attending, interested, declined
  payment_status TEXT, -- paid, pending, refunded (for paid events)
  payment_amount INTEGER,
  payment_id TEXT, -- for Stripe reference
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Event co-hosts table
CREATE TABLE IF NOT EXISTS event_cohosts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  permissions TEXT[] DEFAULT ARRAY['edit', 'manage_participants'], -- Array of permissions
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Event comments table
CREATE TABLE IF NOT EXISTS event_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event tags/categories table
CREATE TABLE IF NOT EXISTS event_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event to tags linking table
CREATE TABLE IF NOT EXISTS event_to_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES event_tags(id) ON DELETE CASCADE,
  UNIQUE(event_id, tag_id)
);

-- Event posts linking table (to connect posts with events)
CREATE TABLE IF NOT EXISTS event_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, post_id)
);

-- Function to automatically update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Set up triggers for updated_at fields
CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON events
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_participants_updated_at
BEFORE UPDATE ON event_participants
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies

-- Events table RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Anyone can view published events
CREATE POLICY "Public can view published events" ON events
  FOR SELECT
  USING (is_published = true AND privacy_level = 'public');

-- Creators can do anything with their own events
CREATE POLICY "Creators can do anything with their own events" ON events
  FOR ALL
  USING (auth.uid() = created_by);

-- Event participants RLS
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;

-- Users can see participants for events they're participating in or created
CREATE POLICY "Users can see participants for events they're in" ON event_participants
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM event_participants WHERE event_id = event_participants.event_id
      UNION
      SELECT created_by FROM events WHERE id = event_participants.event_id
    )
  );

-- Users can manage their own participation
CREATE POLICY "Users can manage their own participation" ON event_participants
  FOR ALL
  USING (auth.uid() = user_id);

-- Event creators can manage all participants
CREATE POLICY "Event creators can manage participants" ON event_participants
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT created_by FROM events WHERE id = event_participants.event_id
    )
  );

-- Event cohosts RLS
ALTER TABLE event_cohosts ENABLE ROW LEVEL SECURITY;

-- Anyone can view cohosts of published events
CREATE POLICY "Anyone can view cohosts of published events" ON event_cohosts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events 
      WHERE id = event_cohosts.event_id 
      AND is_published = true 
      AND privacy_level = 'public'
    )
  );

-- Event creators can manage cohosts
CREATE POLICY "Event creators can manage cohosts" ON event_cohosts
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT created_by FROM events WHERE id = event_cohosts.event_id
    )
  );

-- Event comments RLS
ALTER TABLE event_comments ENABLE ROW LEVEL SECURITY;

-- Anyone can read comments on public events
CREATE POLICY "Anyone can read comments on public events" ON event_comments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events 
      WHERE id = event_comments.event_id 
      AND is_published = true 
      AND privacy_level = 'public'
    )
  );

-- Anyone can create comments on public events
CREATE POLICY "Anyone can create comments on public events" ON event_comments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events 
      WHERE id = event_comments.event_id 
      AND is_published = true 
      AND privacy_level = 'public'
    )
  );

-- Users can manage their own comments
CREATE POLICY "Users can manage their own comments" ON event_comments
  FOR ALL
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX event_start_datetime_idx ON events(start_datetime);
CREATE INDEX event_location_idx ON events(location);
CREATE INDEX event_category_idx ON events(category);
CREATE INDEX event_participation_idx ON event_participants(event_id, status);
CREATE INDEX event_creator_idx ON events(created_by);