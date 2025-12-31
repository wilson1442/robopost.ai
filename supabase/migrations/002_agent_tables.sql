-- Migration 002: Agent & Results Tables
-- Creates agent_runs and agent_results tables for tracking webhook-triggered runs

-- Agent Runs Table
CREATE TABLE IF NOT EXISTS agent_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  industry_id UUID REFERENCES industries(id) ON DELETE SET NULL,
  prompt_instructions TEXT,
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  webhook_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Agent Results Table
CREATE TABLE IF NOT EXISTS agent_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id UUID NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
  output_type TEXT NOT NULL CHECK (output_type IN ('blog', 'social', 'email', 'webhook')),
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_runs_user_id ON agent_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_status ON agent_runs(status);
CREATE INDEX IF NOT EXISTS idx_agent_runs_industry_id ON agent_runs(industry_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_triggered_at ON agent_runs(triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_results_run_id ON agent_results(run_id);
CREATE INDEX IF NOT EXISTS idx_agent_results_output_type ON agent_results(output_type);

-- Row Level Security Policies

-- Enable RLS on all tables
ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_results ENABLE ROW LEVEL SECURITY;

-- Agent Runs Policies
DROP POLICY IF EXISTS "Users can view their own agent runs" ON agent_runs;
CREATE POLICY "Users can view their own agent runs"
  ON agent_runs FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own agent runs" ON agent_runs;
CREATE POLICY "Users can create their own agent runs"
  ON agent_runs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own agent runs" ON agent_runs;
CREATE POLICY "Users can update their own agent runs"
  ON agent_runs FOR UPDATE
  USING (auth.uid() = user_id);

-- Agent Results Policies
DROP POLICY IF EXISTS "Users can view results of their own runs" ON agent_results;
CREATE POLICY "Users can view results of their own runs"
  ON agent_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM agent_runs
      WHERE agent_runs.id = agent_results.run_id
      AND agent_runs.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create results for their own runs" ON agent_results;
CREATE POLICY "Users can create results for their own runs"
  ON agent_results FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM agent_runs
      WHERE agent_runs.id = agent_results.run_id
      AND agent_runs.user_id = auth.uid()
    )
  );

