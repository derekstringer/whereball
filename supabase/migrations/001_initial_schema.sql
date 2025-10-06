-- WhereBall Initial Database Schema
-- Run this in your Supabase SQL Editor: https://jmyqhkxdhxawvwbixpay.supabase.co

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS & AUTH
-- ============================================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  zip TEXT,
  platform TEXT CHECK (platform IN ('ios', 'android')),
  marketing_opt_in BOOLEAN DEFAULT false,
  revenuecat_user_id TEXT UNIQUE
);

CREATE INDEX idx_users_email ON users(email);

-- ============================================================================
-- TEAMS & LEAGUES
-- ============================================================================

CREATE TABLE teams (
  id TEXT PRIMARY KEY,
  league TEXT NOT NULL,
  name TEXT NOT NULL,
  market TEXT NOT NULL,
  short_code TEXT NOT NULL,
  rsn_strings TEXT[],
  primary_colors JSONB,
  secondary_colors JSONB,
  logo_url TEXT
);

CREATE INDEX idx_teams_league ON teams(league);

-- ============================================================================
-- GAMES & SCHEDULE
-- ============================================================================

CREATE TABLE games (
  id TEXT PRIMARY KEY,
  league TEXT NOT NULL,
  start_ts TIMESTAMPTZ NOT NULL,
  home_team_id TEXT REFERENCES teams(id),
  away_team_id TEXT REFERENCES teams(id),
  venue TEXT,
  broadcasters JSONB,
  national BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'final', 'postponed'))
);

CREATE INDEX idx_games_start_ts ON games(start_ts);
CREATE INDEX idx_games_league ON games(league);
CREATE INDEX idx_games_home_team ON games(home_team_id);
CREATE INDEX idx_games_away_team ON games(away_team_id);

-- ============================================================================
-- SERVICES & SUBSCRIPTIONS
-- ============================================================================

CREATE TABLE services (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('streaming', 'cable', 'satellite')),
  deep_link_scheme TEXT,
  channel_matrix JSONB,
  provider_lookup_url TEXT
);

CREATE TABLE user_subscriptions (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  service_code TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, service_code)
);

CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);

-- ============================================================================
-- FOLLOWS
-- ============================================================================

CREATE TABLE follows (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  team_id TEXT REFERENCES teams(id) ON DELETE CASCADE,
  league TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, team_id)
);

CREATE INDEX idx_follows_user_id ON follows(user_id);

-- ============================================================================
-- BLACKOUT LOGIC
-- ============================================================================

CREATE TABLE blackout_territories (
  team_id TEXT PRIMARY KEY REFERENCES teams(id) ON DELETE CASCADE,
  territory JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE blackout_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  game_id TEXT REFERENCES games(id) ON DELETE CASCADE,
  zip TEXT NOT NULL,
  reported_status TEXT CHECK (reported_status IN ('incorrect_blackout', 'incorrect_available', 'other')),
  user_comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved BOOLEAN DEFAULT false
);

CREATE INDEX idx_blackout_reports_game ON blackout_reports(game_id);
CREATE INDEX idx_blackout_reports_zip ON blackout_reports(zip);

-- ============================================================================
-- ALERTS & NOTIFICATIONS
-- ============================================================================

CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  game_id TEXT REFERENCES games(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('game_start', 'national_flip')),
  scheduled_ts TIMESTAMPTZ NOT NULL,
  sent_ts TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed'))
);

CREATE INDEX idx_alerts_user_id ON alerts(user_id);
CREATE INDEX idx_alerts_scheduled_ts ON alerts(scheduled_ts);

-- ============================================================================
-- AI CONCIERGE
-- ============================================================================

CREATE TABLE concierge_usage (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  messages_count INT DEFAULT 0,
  tokens_est INT DEFAULT 0,
  upsell_shown_count INT DEFAULT 0,
  PRIMARY KEY (user_id, date)
);

CREATE INDEX idx_concierge_usage_user_date ON concierge_usage(user_id, date);

CREATE TABLE concierge_memory (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  running_summary TEXT,
  banter_tone_ok BOOLEAN DEFAULT true,
  last_successful_watch JSONB,
  theme_prefs JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- MONETIZATION
-- ============================================================================

CREATE TABLE paywall_experiments (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  variant TEXT NOT NULL,
  seen_at TIMESTAMPTZ DEFAULT NOW(),
  converted BOOLEAN DEFAULT false,
  plan TEXT
);

CREATE TABLE ad_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  event_type TEXT CHECK (event_type IN ('impression', 'click')),
  impressions INT DEFAULT 0,
  clicks INT DEFAULT 0,
  revenue_est DECIMAL(10,4),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ad_events_user_id ON ad_events(user_id);
CREATE INDEX idx_ad_events_session ON ad_events(session_id);

CREATE TABLE affiliate_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  partner TEXT NOT NULL,
  click_ts TIMESTAMPTZ DEFAULT NOW(),
  conversion_ts TIMESTAMPTZ,
  amount_est DECIMAL(10,2),
  attribution_window INT DEFAULT 90
);

CREATE INDEX idx_affiliate_events_user_id ON affiliate_events(user_id);
CREATE INDEX idx_affiliate_events_partner ON affiliate_events(partner);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all user-specific tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE concierge_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE concierge_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE blackout_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE paywall_experiments ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY users_select_own ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY users_update_own ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY user_subscriptions_own ON user_subscriptions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY follows_own ON follows FOR ALL USING (auth.uid() = user_id);
CREATE POLICY alerts_own ON alerts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY concierge_usage_own ON concierge_usage FOR ALL USING (auth.uid() = user_id);
CREATE POLICY concierge_memory_own ON concierge_memory FOR ALL USING (auth.uid() = user_id);
CREATE POLICY ad_events_own ON ad_events FOR ALL USING (auth.uid() = user_id);
CREATE POLICY affiliate_events_own ON affiliate_events FOR ALL USING (auth.uid() = user_id);
CREATE POLICY blackout_reports_own ON blackout_reports FOR ALL USING (auth.uid() = user_id);
CREATE POLICY paywall_experiments_own ON paywall_experiments FOR ALL USING (auth.uid() = user_id);

-- Public read access for reference data
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY teams_public_read ON teams FOR SELECT USING (true);

ALTER TABLE games ENABLE ROW LEVEL SECURITY;
CREATE POLICY games_public_read ON games FOR SELECT USING (true);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;
CREATE POLICY services_public_read ON services FOR SELECT USING (true);

ALTER TABLE blackout_territories ENABLE ROW LEVEL SECURITY;
CREATE POLICY blackout_territories_public_read ON blackout_territories FOR SELECT USING (true);

-- ============================================================================
-- SEED DATA - NHL Teams (for testing)
-- ============================================================================

-- Insert a few teams for testing (full seed will be done via app)
INSERT INTO teams (id, league, name, market, short_code, rsn_strings, primary_colors, secondary_colors) VALUES
('nhl_dal', 'NHL', 'Dallas Stars', 'Dallas', 'DAL', ARRAY['Bally Sports Southwest'], 
 '{"light": "#006847", "dark": "#006847"}'::jsonb,
 '{"light": "#8F8F8C", "dark": "#8F8F8C"}'::jsonb),
('nhl_nyr', 'NHL', 'New York Rangers', 'New York', 'NYR', ARRAY['MSG'],
 '{"light": "#0038A8", "dark": "#0033A0"}'::jsonb,
 '{"light": "#CE1126", "dark": "#CE1126"}'::jsonb),
('nhl_chi', 'NHL', 'Chicago Blackhawks', 'Chicago', 'CHI', ARRAY['NBCSCH'],
 '{"light": "#CF0A2C", "dark": "#CF0A2C"}'::jsonb,
 '{"light": "#000000", "dark": "#000000"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Insert streaming services
INSERT INTO services (code, name, type, deep_link_scheme, channel_matrix) VALUES
('espn_plus', 'ESPN+', 'streaming', 'espn://', '{"channels": ["ESPN+"], "notes": "NHL games subject to blackout restrictions"}'::jsonb),
('youtube_tv', 'YouTube TV', 'streaming', 'https://tv.youtube.com', '{"channels": ["ESPN", "ESPN2", "ABC", "TNT", "TBS", "NHL Network"]}'::jsonb),
('hulu_live', 'Hulu + Live TV', 'streaming', 'hulu://', '{"channels": ["ESPN", "ESPN2", "ABC", "TNT", "TBS"]}'::jsonb)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to auto-create user record on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at)
  VALUES (NEW.id, NEW.email, NEW.created_at);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at
CREATE TRIGGER update_concierge_memory_updated_at
  BEFORE UPDATE ON concierge_memory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_blackout_territories_updated_at
  BEFORE UPDATE ON blackout_territories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
