-- ============================================================================
-- FILE: database/02-calendar-tables.sql
-- PURPOSE: Google Calendar integration
-- RUN ORDER: 2nd (after 01-projects-table.sql)
-- ============================================================================

-- Calendar OAuth connections
CREATE TABLE IF NOT EXISTS google_calendar_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- OAuth tokens
  access_token TEXT,
  refresh_token TEXT,
  token_expiry TIMESTAMP,
  
  -- Settings
  primary_calendar_id TEXT,
  sync_enabled BOOLEAN DEFAULT true,
  auto_create_flyers BOOLEAN DEFAULT false,
  
  -- Timestamps
  connected_at TIMESTAMP DEFAULT NOW(),
  last_sync_at TIMESTAMP
);

-- Cached calendar events
CREATE TABLE IF NOT EXISTS cached_calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Google event data
  google_event_id TEXT NOT NULL,
  calendar_id TEXT NOT NULL,
  
  -- Event details
  event_title TEXT NOT NULL,
  event_description TEXT,
  event_location TEXT,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  all_day BOOLEAN DEFAULT false,
  
  -- Full event JSON
  event_data JSONB,
  
  -- Linked flyer
  flyer_project_id UUID REFERENCES flyer_projects(id) ON DELETE SET NULL,
  
  synced_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_user_event UNIQUE(user_id, google_event_id)
);

-- Enable RLS
ALTER TABLE google_calendar_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE cached_calendar_events ENABLE ROW LEVEL SECURITY;

-- Policies for connections
CREATE POLICY "Users manage own calendar connections"
ON google_calendar_connections
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policies for events
CREATE POLICY "Users view own calendar events"
ON cached_calendar_events
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_calendar_user ON google_calendar_connections(user_id);
CREATE INDEX idx_calendar_token_expiry ON google_calendar_connections(token_expiry);
CREATE INDEX idx_events_user ON cached_calendar_events(user_id, start_time DESC);
CREATE INDEX idx_events_google_id ON cached_calendar_events(google_event_id);

COMMENT ON TABLE google_calendar_connections IS 'Google Calendar OAuth connections per user';
COMMENT ON TABLE cached_calendar_events IS 'Cached calendar events for offline access';
