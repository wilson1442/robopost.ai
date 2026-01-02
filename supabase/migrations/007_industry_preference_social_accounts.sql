-- Migration 007: Industry Preference & Social Accounts
-- Adds industry_preference_id and industry_preference_locked to user_profiles
-- Creates user_social_accounts table for OAuth social account linking

-- Add industry_preference_id column to user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS industry_preference_id UUID REFERENCES industries(id) ON DELETE SET NULL;

-- Add industry_preference_locked column to user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS industry_preference_locked BOOLEAN NOT NULL DEFAULT FALSE;

-- Create index for industry_preference_id
CREATE INDEX IF NOT EXISTS idx_user_profiles_industry_preference_id ON user_profiles(industry_preference_id);

-- Create user_social_accounts table
CREATE TABLE IF NOT EXISTS user_social_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'twitter', 'linkedin', 'instagram', 'youtube', 'tiktok', 'pinterest', 'reddit')),
  account_url TEXT,
  oauth_token TEXT, -- Will be encrypted at application level
  oauth_token_secret TEXT, -- For OAuth 1.0a (Twitter)
  oauth_refresh_token TEXT, -- For OAuth 2.0 refresh tokens
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, platform)
);

-- Create indexes for user_social_accounts
CREATE INDEX IF NOT EXISTS idx_user_social_accounts_user_id ON user_social_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_social_accounts_platform ON user_social_accounts(platform);
CREATE INDEX IF NOT EXISTS idx_user_social_accounts_is_active ON user_social_accounts(is_active);

-- Add trigger for updated_at on user_social_accounts
DROP TRIGGER IF EXISTS update_user_social_accounts_updated_at ON user_social_accounts;
CREATE TRIGGER update_user_social_accounts_updated_at
  BEFORE UPDATE ON user_social_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on user_social_accounts
ALTER TABLE user_social_accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_social_accounts
-- Users can view their own social accounts
DROP POLICY IF EXISTS "Users can view their own social accounts" ON user_social_accounts;
CREATE POLICY "Users can view their own social accounts"
  ON user_social_accounts FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own social accounts
DROP POLICY IF EXISTS "Users can insert their own social accounts" ON user_social_accounts;
CREATE POLICY "Users can insert their own social accounts"
  ON user_social_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own social accounts
DROP POLICY IF EXISTS "Users can update their own social accounts" ON user_social_accounts;
CREATE POLICY "Users can update their own social accounts"
  ON user_social_accounts FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own social accounts
DROP POLICY IF EXISTS "Users can delete their own social accounts" ON user_social_accounts;
CREATE POLICY "Users can delete their own social accounts"
  ON user_social_accounts FOR DELETE
  USING (auth.uid() = user_id);

