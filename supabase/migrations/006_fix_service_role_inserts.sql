-- Migration 006: Fix Service Role Inserts
-- Ensures service role can insert into agent_results and run_progress_logs
-- Service role should bypass RLS, but explicit policies ensure it works

-- Add explicit INSERT policy for service role on agent_results
-- Service role bypasses RLS, but this ensures inserts work even if RLS is checked
DROP POLICY IF EXISTS "Service role can insert agent results" ON agent_results;
CREATE POLICY "Service role can insert agent results"
  ON agent_results FOR INSERT
  WITH CHECK (true); -- Service role bypasses RLS anyway, but explicit policy ensures it works

-- The existing policy "Users can create results for their own runs" will still work for authenticated users
-- Service role will use the policy above which allows all inserts

-- Verify run_progress_logs already has the policy (from migration 005)
-- But let's ensure it's there
DROP POLICY IF EXISTS "Service role can insert progress logs" ON run_progress_logs;
CREATE POLICY "Service role can insert progress logs"
  ON run_progress_logs FOR INSERT
  WITH CHECK (true);

