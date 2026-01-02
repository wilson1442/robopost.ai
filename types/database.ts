/**
 * Database Types
 * 
 * TypeScript type definitions matching the Supabase database schema.
 * These types correspond to the tables defined in:
 * - supabase/migrations/001_core_tables.sql
 * - supabase/migrations/002_agent_tables.sql
 */

// ============================================================================
// Core Tables (Migration 001)
// ============================================================================

/**
 * User Profile Table
 * Matches: user_profiles table
 */
export interface UserProfile {
  id: string; // UUID, references auth.users(id)
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
  industry_preference?: string | null; // TEXT (deprecated, use industry_preference_id)
  industry_preference_id?: string | null; // UUID, references industries(id)
  industry_preference_locked?: boolean; // BOOLEAN
}

/**
 * User Social Account Table
 * Matches: user_social_accounts table
 */
export interface UserSocialAccount {
  id: string; // UUID
  user_id: string; // UUID, references auth.users(id)
  platform: "facebook" | "twitter" | "linkedin" | "instagram" | "youtube" | "tiktok" | "pinterest" | "reddit";
  account_url?: string | null; // TEXT
  oauth_token?: string | null; // TEXT (encrypted)
  oauth_token_secret?: string | null; // TEXT (encrypted, for OAuth 1.0a)
  oauth_refresh_token?: string | null; // TEXT (encrypted, for OAuth 2.0)
  is_active: boolean; // BOOLEAN
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

/**
 * Industry Table
 * Matches: industries table
 */
export interface Industry {
  id: string; // UUID
  slug: string; // TEXT, UNIQUE
  name: string; // TEXT
  description?: string | null; // TEXT
  default_prompt_template?: string | null; // TEXT
  created_at?: string; // TIMESTAMPTZ (optional - may not exist in all database instances)
}

/**
 * RSS Source Table
 * Matches: rss_sources table
 */
export interface RssSource {
  id: string; // UUID
  url: string; // TEXT, UNIQUE
  name: string; // TEXT
  industry_id?: string | null; // UUID, references industries(id)
  is_public: boolean; // BOOLEAN
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

/**
 * User Source Junction Table
 * Matches: user_sources table
 */
export interface UserSource {
  id: string; // UUID
  user_id: string; // UUID, references auth.users(id)
  rss_source_id: string; // UUID, references rss_sources(id)
  custom_name?: string | null; // TEXT
  is_active: boolean; // BOOLEAN
  created_at: string; // TIMESTAMPTZ
}

// ============================================================================
// Agent Tables (Migration 002)
// ============================================================================

/**
 * Agent Run Status
 * Matches: agent_runs.status CHECK constraint
 */
export type AgentRunStatus = "pending" | "processing" | "completed" | "failed";

/**
 * Agent Run Table
 * Matches: agent_runs table
 */
export interface AgentRun {
  id: string; // UUID
  user_id: string; // UUID, references auth.users(id)
  status: AgentRunStatus; // TEXT
  industry_id?: string | null; // UUID, references industries(id)
  prompt_instructions?: string | null; // TEXT
  triggered_at: string; // TIMESTAMPTZ
  completed_at?: string | null; // TIMESTAMPTZ
  error_message?: string | null; // TEXT
  webhook_payload?: Record<string, unknown> | null; // JSONB
  created_at: string; // TIMESTAMPTZ
}

/**
 * Agent Result Output Type
 * Matches: agent_results.output_type CHECK constraint
 */
export type AgentResultOutputType = "blog" | "social" | "email" | "webhook";

/**
 * Agent Result Table
 * Matches: agent_results table
 */
export interface AgentResult {
  id: string; // UUID
  run_id: string; // UUID, references agent_runs(id)
  output_type: AgentResultOutputType; // TEXT
  content: string; // TEXT
  metadata?: Record<string, unknown> | null; // JSONB
  created_at: string; // TIMESTAMPTZ
}

/**
 * Run Progress Log Table
 * Matches: run_progress_logs table
 */
export interface RunProgressLog {
  id: string; // UUID
  run_id: string; // UUID, references agent_runs(id)
  message: string; // TEXT
  status?: "info" | "success" | "warning" | "error" | null; // TEXT
  created_at: string; // TIMESTAMPTZ
}

// ============================================================================
// Combined/Transformed Types (for API responses and UI)
// ============================================================================

/**
 * Source with full details including industry information
 * Used in API responses and component props
 */
export interface SourceWithDetails {
  id: string; // user_sources.id
  url: string; // rss_sources.url
  name: string; // user_sources.custom_name or rss_sources.name
  originalName: string; // rss_sources.name
  isActive: boolean; // user_sources.is_active
  industryId?: string | null; // rss_sources.industry_id
  industry?: Industry | null; // joined industries data
  createdAt: string; // user_sources.created_at
  rssSourceId: string; // rss_sources.id
}

/**
 * Source form data (for create/update operations)
 */
export interface SourceFormData {
  url: string;
  name?: string;
  industryId?: string;
}

/**
 * Source update payload (for PATCH operations)
 */
export interface SourceUpdatePayload {
  isActive?: boolean;
  custom_name?: string;
  industryId?: string;
}

/**
 * Profile form data (for update operations)
 */
export interface ProfileFormData {
  industry_preference?: string | null;
}

/**
 * Agent run with results (for detailed views)
 */
export interface AgentRunWithResults extends AgentRun {
  results?: AgentResult[];
  progressLogs?: RunProgressLog[];
  resultsError?: {
    message: string;
    code?: string;
  };
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * API response for sources list
 */
export interface SourcesResponse {
  sources: SourceWithDetails[];
}

/**
 * API response for single source
 */
export interface SourceResponse {
  source: SourceWithDetails;
}

/**
 * API response for industries list
 */
export interface IndustriesResponse {
  industries: Industry[];
}

/**
 * API response for user profile
 */
export interface ProfileResponse {
  profile: UserProfile;
}

/**
 * API response for agent runs list
 */
export interface AgentRunsResponse {
  runs: AgentRun[];
}

/**
 * API response for agent run with results
 */
export interface AgentRunResponse {
  run: AgentRunWithResults;
}

