-- Migration 001: Core Tables
-- Creates user_profiles, industries, rss_sources, and user_sources tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  industry_preference TEXT
);

-- Industries Table
CREATE TABLE IF NOT EXISTS industries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  default_prompt_template TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RSS Sources Table
CREATE TABLE IF NOT EXISTS rss_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  industry_id UUID REFERENCES industries(id) ON DELETE SET NULL,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User Sources Junction Table
CREATE TABLE IF NOT EXISTS user_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rss_source_id UUID NOT NULL REFERENCES rss_sources(id) ON DELETE CASCADE,
  custom_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, rss_source_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_id ON user_profiles(id);
CREATE INDEX IF NOT EXISTS idx_industries_slug ON industries(slug);
CREATE INDEX IF NOT EXISTS idx_rss_sources_url ON rss_sources(url);
CREATE INDEX IF NOT EXISTS idx_rss_sources_industry_id ON rss_sources(industry_id);
CREATE INDEX IF NOT EXISTS idx_rss_sources_is_public ON rss_sources(is_public);
CREATE INDEX IF NOT EXISTS idx_user_sources_user_id ON user_sources(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sources_rss_source_id ON user_sources(rss_source_id);
CREATE INDEX IF NOT EXISTS idx_user_sources_is_active ON user_sources(is_active);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rss_sources_updated_at ON rss_sources;
CREATE TRIGGER update_rss_sources_updated_at
  BEFORE UPDATE ON rss_sources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security Policies

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE industries ENABLE ROW LEVEL SECURITY;
ALTER TABLE rss_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sources ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Industries Policies (public read access)
DROP POLICY IF EXISTS "Anyone can view industries" ON industries;
CREATE POLICY "Anyone can view industries"
  ON industries FOR SELECT
  USING (true);

-- RSS Sources Policies
DROP POLICY IF EXISTS "Users can view public RSS sources" ON rss_sources;
CREATE POLICY "Users can view public RSS sources"
  ON rss_sources FOR SELECT
  USING (is_public = true);

DROP POLICY IF EXISTS "Users can create RSS sources" ON rss_sources;
CREATE POLICY "Users can create RSS sources"
  ON rss_sources FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own RSS sources" ON rss_sources;
CREATE POLICY "Users can update their own RSS sources"
  ON rss_sources FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_sources
      WHERE user_sources.rss_source_id = rss_sources.id
      AND user_sources.user_id = auth.uid()
    )
  );

-- User Sources Policies
DROP POLICY IF EXISTS "Users can view their own sources" ON user_sources;
CREATE POLICY "Users can view their own sources"
  ON user_sources FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own sources" ON user_sources;
CREATE POLICY "Users can create their own sources"
  ON user_sources FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own sources" ON user_sources;
CREATE POLICY "Users can update their own sources"
  ON user_sources FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own sources" ON user_sources;
CREATE POLICY "Users can delete their own sources"
  ON user_sources FOR DELETE
  USING (auth.uid() = user_id);

