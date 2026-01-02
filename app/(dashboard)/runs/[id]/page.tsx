import { requireAuth } from "@/lib/auth/auth";
import { createClient } from "@/lib/supabase/server";
import RunDetails from "@/components/dashboard/runs/RunDetails";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function RunDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAuth();
  const { id } = await params;
  const supabase = await createClient();

  // Fetch agent run with results
  const { data: agentRun, error: runError } = await supabase
    .from("agent_runs")
    .select(
      `
      id,
      user_id,
      status,
      industry_id,
      prompt_instructions,
      triggered_at,
      completed_at,
      error_message,
      webhook_payload,
      created_at
    `
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (runError || !agentRun) {
    notFound();
  }

  // Fetch results for this run
  const { data: results, error: resultsError } = await supabase
    .from("agent_results")
    .select("id, run_id, output_type, content, metadata, created_at")
    .eq("run_id", id)
    .order("created_at", { ascending: true });

  if (resultsError) {
    console.error("[RunDetailsPage] Error fetching agent results:", {
      runId: id,
      error: resultsError,
      code: resultsError.code,
      message: resultsError.message,
      details: resultsError.details,
      hint: resultsError.hint,
    });
  } else {
    console.log("[RunDetailsPage] Successfully fetched results:", {
      runId: id,
      resultsCount: results?.length || 0,
      results: results?.map(r => ({ id: r.id, output_type: r.output_type })),
    });
  }

  // Fetch progress logs for this run
  const { data: progressLogs, error: progressError } = await supabase
    .from("run_progress_logs")
    .select("id, run_id, message, status, created_at")
    .eq("run_id", id)
    .order("created_at", { ascending: true });

  if (progressError) {
    console.error("[RunDetailsPage] Error fetching progress logs:", {
      runId: id,
      error: progressError,
    });
  }

  const runWithResults = {
    ...agentRun,
    results: results || [],
    progressLogs: progressLogs || [],
    resultsError: resultsError ? {
      message: resultsError.message,
      code: resultsError.code,
    } : undefined,
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/runs"
            className="text-sm text-gray-400 hover:text-gray-300 mb-2 inline-block"
          >
            ← Back to Runs
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Run Details</h1>
        </div>
      </div>

      <div className="glass-effect rounded-xl p-6">
        <RunDetails run={runWithResults} />
      </div>
    </div>
  );
}

