-- 010_alter_event_types_and_add_workshop_tables.sql

-- Alter event_type enum to add voice_workshop type
ALTER TYPE event_type ADD VALUE 'voice_workshop';

-- Create voice workshop specific table
CREATE TABLE IF NOT EXISTS event_voice_workshop (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL UNIQUE REFERENCES event(id) ON DELETE CASCADE,
  max_participants INTEGER NOT NULL DEFAULT 10,
  is_recorded BOOLEAN NOT NULL DEFAULT false,
  recording_url TEXT,
  archive_expires_at TIMESTAMPTZ
);

-- Create index on event_id
CREATE INDEX idx_event_voice_workshop_event_id ON event_voice_workshop(event_id);

-- Create event archive access table
CREATE TABLE IF NOT EXISTS event_archive_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES event(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  
  UNIQUE(event_id, user_id)
);

-- Create indexes for archive access table
CREATE INDEX idx_event_archive_access_event_id ON event_archive_access(event_id);
CREATE INDEX idx_event_archive_access_user_id ON event_archive_access(user_id);

-- Add a constraint to ensure max_participants is positive
ALTER TABLE event_voice_workshop ADD CONSTRAINT check_max_participants_positive CHECK (max_participants > 0);

-- Add a constraint to ensure max_participants doesn't exceed 1000
ALTER TABLE event_voice_workshop ADD CONSTRAINT check_max_participants_max CHECK (max_participants <= 1000);