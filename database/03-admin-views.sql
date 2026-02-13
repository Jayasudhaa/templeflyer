-- ============================================================================
-- FILE: database/03-admin-views.sql
-- PURPOSE: Admin dashboard analytics and views
-- RUN ORDER: 3rd
-- ============================================================================

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  permissions JSONB DEFAULT '["view_analytics", "manage_users", "manage_events"]'::jsonb,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view admin_users"
ON admin_users
FOR SELECT
TO authenticated
USING (auth.uid() IN (SELECT user_id FROM admin_users));

-- ============================================================================
-- ANALYTICS VIEWS
-- ============================================================================

-- User statistics view
CREATE OR REPLACE VIEW admin_user_stats AS
SELECT
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as new_users_week,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as new_users_month,
  COUNT(DISTINCT id) FILTER (WHERE last_sign_in_at > NOW() - INTERVAL '7 days') as active_users_week
FROM auth.users;

-- Project statistics view
CREATE OR REPLACE VIEW admin_project_stats AS
SELECT
  COUNT(*) as total_projects,
  COUNT(DISTINCT user_id) as users_with_projects,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as projects_created_week,
  COUNT(*) FILTER (WHERE is_template = true) as total_templates,
  AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_edit_time_seconds
FROM flyer_projects;

-- RSVP statistics view  
CREATE OR REPLACE VIEW admin_rsvp_stats AS
SELECT
  COUNT(*) as total_rsvps,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as rsvps_week,
  COUNT(DISTINCT event_id) as events_with_rsvps,
  COUNT(DISTINCT user_email) as unique_attendees
FROM rsvp_submissions;

-- Event performance view
CREATE OR REPLACE VIEW admin_top_events AS
SELECT
  em.event_id,
  em.event_name,
  em.event_date,
  em.created_by,
  COUNT(rs.id) as rsvp_count,
  em.flyer_url
FROM event_metadata em
LEFT JOIN rsvp_submissions rs ON em.event_id = rs.event_id
GROUP BY em.event_id, em.event_name, em.event_date, em.created_by, em.flyer_url
ORDER BY rsvp_count DESC
LIMIT 10;

-- Calendar sync statistics
CREATE OR REPLACE VIEW admin_calendar_stats AS
SELECT
  COUNT(*) as total_connections,
  COUNT(*) FILTER (WHERE sync_enabled = true) as active_syncs,
  COUNT(*) FILTER (WHERE auto_create_flyers = true) as auto_create_enabled
FROM google_calendar_connections;

COMMENT ON VIEW admin_user_stats IS 'User growth and activity metrics';
COMMENT ON VIEW admin_project_stats IS 'Project creation and engagement metrics';
COMMENT ON VIEW admin_rsvp_stats IS 'RSVP submission metrics';
COMMENT ON VIEW admin_top_events IS 'Top 10 events by RSVP count';
COMMENT ON VIEW admin_calendar_stats IS 'Google Calendar integration metrics';
