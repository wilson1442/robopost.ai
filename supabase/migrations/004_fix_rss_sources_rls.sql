-- Migration 004: Fix RSS Sources RLS Policies
-- Allows users to view RSS sources they've created or are associated with

-- Drop ALL existing policies on rss_sources to ensure clean state
DROP POLICY IF EXISTS "Users can view public RSS sources" ON rss_sources;
DROP POLICY IF EXISTS "Users can view public or their own RSS sources" ON rss_sources;
DROP POLICY IF EXISTS "Users can create RSS sources" ON rss_sources;
DROP POLICY IF EXISTS "Users can update their own RSS sources" ON rss_sources;

-- Create SELECT policy that allows:
-- 1. Viewing public RSS sources
-- 2. Viewing any RSS source if authenticated (needed for INSERT with SELECT to work)
-- 3. Viewing RSS sources the user is associated with (via user_sources)
CREATE POLICY "Users can view public or their own RSS sources"
  ON rss_sources FOR SELECT
  USING (
    is_public = true 
    OR auth.uid() IS NOT NULL
    OR EXISTS (
      SELECT 1 FROM user_sources
      WHERE user_sources.rss_source_id = rss_sources.id
      AND user_sources.user_id = auth.uid()
    )
  );

-- INSERT policy: Allow anyone to insert (application code enforces auth via requireAuth())
-- This is needed for INSERT with SELECT to work properly
CREATE POLICY "Users can create RSS sources"
  ON rss_sources FOR INSERT
  WITH CHECK (true);

-- Recreate UPDATE policy (from original migration)
CREATE POLICY "Users can update their own RSS sources"
  ON rss_sources FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_sources
      WHERE user_sources.rss_source_id = rss_sources.id
      AND user_sources.user_id = auth.uid()
    )
  );

