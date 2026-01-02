-- Migration 005: Run Progress Logs Table
-- Creates a table to store real-time progress updates during agent runs

-- Run Progress Logs Table
CREATE TABLE IF NOT EXISTS run_progress_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id UUID NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  status TEXT CHECK (status IN ('info', 'success', 'warning', 'error')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_run_progress_logs_run_id ON run_progress_logs(run_id);
CREATE INDEX IF NOT EXISTS idx_run_progress_logs_created_at ON run_progress_logs(created_at DESC);

-- Row Level Security Policies
ALTER TABLE run_progress_logs ENABLE ROW LEVEL SECURITY;

-- Users can view progress logs for their own runs
DROP POLICY IF EXISTS "Users can view progress logs of their own runs" ON run_progress_logs;
CREATE POLICY "Users can view progress logs of their own runs"
  ON run_progress_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM agent_runs
      WHERE agent_runs.id = run_progress_logs.run_id
      AND agent_runs.user_id = auth.uid()
    )
  );

-- Service role can insert progress logs (for webhook callbacks)
DROP POLICY IF EXISTS "Service role can insert progress logs" ON run_progress_logs;
CREATE POLICY "Service role can insert progress logs"
  ON run_progress_logs FOR INSERT
  WITH CHECK (true); -- Service role bypasses RLS anyway, but this is explicit

