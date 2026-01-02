-- Migration 008: Admin RLS Policies
-- Adds admin role support and RLS policies for admin access
-- Admins can view/manage all resources, not just their own

-- Helper function to check if user is admin
-- Checks both user_metadata and app_metadata for role = 'admin'
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = user_id
    AND (
      (raw_user_meta_data->>'role')::text = 'admin'
      OR (raw_app_meta_data->>'role')::text = 'admin'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin policies for agent_runs
-- Admins can view all agent runs
DROP POLICY IF EXISTS "Admins can view all agent runs" ON agent_runs;
CREATE POLICY "Admins can view all agent runs"
  ON agent_runs FOR SELECT
  USING (
    auth.uid() = user_id 
    OR is_admin(auth.uid())
  );

-- Admins can update all agent runs
DROP POLICY IF EXISTS "Admins can update all agent runs" ON agent_runs;
CREATE POLICY "Admins can update all agent runs"
  ON agent_runs FOR UPDATE
  USING (
    auth.uid() = user_id 
    OR is_admin(auth.uid())
  );

-- Admin policies for agent_results
-- Admins can view results of all runs
DROP POLICY IF EXISTS "Admins can view results of all runs" ON agent_results;
CREATE POLICY "Admins can view results of all runs"
  ON agent_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM agent_runs
      WHERE agent_runs.id = agent_results.run_id
      AND (agent_runs.user_id = auth.uid() OR is_admin(auth.uid()))
    )
  );

-- Admin policies for rss_sources
-- Admins can view all RSS sources
DROP POLICY IF EXISTS "Admins can view all RSS sources" ON rss_sources;
CREATE POLICY "Admins can view all RSS sources"
  ON rss_sources FOR SELECT
  USING (
    is_public = true 
    OR is_admin(auth.uid())
  );

-- Admins can create RSS sources
DROP POLICY IF EXISTS "Admins can create RSS sources" ON rss_sources;
CREATE POLICY "Admins can create RSS sources"
  ON rss_sources FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

-- Admins can update all RSS sources
DROP POLICY IF EXISTS "Admins can update all RSS sources" ON rss_sources;
CREATE POLICY "Admins can update all RSS sources"
  ON rss_sources FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_sources
      WHERE user_sources.rss_source_id = rss_sources.id
      AND user_sources.user_id = auth.uid()
    )
    OR is_admin(auth.uid())
  );

-- Admins can delete all RSS sources
DROP POLICY IF EXISTS "Admins can delete all RSS sources" ON rss_sources;
CREATE POLICY "Admins can delete all RSS sources"
  ON rss_sources FOR DELETE
  USING (is_admin(auth.uid()));

-- Admin policies for user_profiles
-- Admins can view all user profiles
DROP POLICY IF EXISTS "Admins can view all user profiles" ON user_profiles;
CREATE POLICY "Admins can view all user profiles"
  ON user_profiles FOR SELECT
  USING (
    auth.uid() = id 
    OR is_admin(auth.uid())
  );

-- Admins can update all user profiles
DROP POLICY IF EXISTS "Admins can update all user profiles" ON user_profiles;
CREATE POLICY "Admins can update all user profiles"
  ON user_profiles FOR UPDATE
  USING (
    auth.uid() = id 
    OR is_admin(auth.uid())
  );

-- Admin policies for user_social_accounts
-- Admins can view all social accounts
DROP POLICY IF EXISTS "Admins can view all social accounts" ON user_social_accounts;
CREATE POLICY "Admins can view all social accounts"
  ON user_social_accounts FOR SELECT
  USING (
    auth.uid() = user_id 
    OR is_admin(auth.uid())
  );

-- Admins can update all social accounts
DROP POLICY IF EXISTS "Admins can update all social accounts" ON user_social_accounts;
CREATE POLICY "Admins can update all social accounts"
  ON user_social_accounts FOR UPDATE
  USING (
    auth.uid() = user_id 
    OR is_admin(auth.uid())
  );

-- Admins can delete all social accounts
DROP POLICY IF EXISTS "Admins can delete all social accounts" ON user_social_accounts;
CREATE POLICY "Admins can delete all social accounts"
  ON user_social_accounts FOR DELETE
  USING (
    auth.uid() = user_id 
    OR is_admin(auth.uid())
  );

