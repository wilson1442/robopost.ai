import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/auth";
import { createClient } from "@/lib/supabase/server";
import { AgentRunResponse } from "@/types/database";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
      return NextResponse.json(
        { error: "Run not found" },
        { status: 404 }
      );
    }

    // Fetch results for this run
    const { data: results, error: resultsError } = await supabase
      .from("agent_results")
      .select("id, output_type, content, metadata, created_at")
      .eq("run_id", id)
      .order("created_at", { ascending: true });

    if (resultsError) {
      console.error("[API /runs/[id]] Error fetching agent results:", {
        runId: id,
        userId: user.id,
        error: resultsError,
        code: resultsError.code,
        message: resultsError.message,
        details: resultsError.details,
        hint: resultsError.hint,
      });
    } else {
      console.log("[API /runs/[id]] Successfully fetched results:", {
        runId: id,
        resultsCount: results?.length || 0,
        results: results?.map(r => ({ id: r.id, output_type: r.output_type })),
      });
    }

    // Fetch progress logs for this run
    const { data: progressLogs, error: progressError } = await supabase
      .from("run_progress_logs")
      .select("id, message, status, created_at")
      .eq("run_id", id)
      .order("created_at", { ascending: true });

    if (progressError) {
      console.error("[API /runs/[id]] Error fetching progress logs:", {
        runId: id,
        error: progressError,
      });
    }

    const response: AgentRunResponse = {
      run: {
        ...agentRun,
        results: results || [],
        progressLogs: progressLogs || [],
        resultsError: resultsError ? {
          message: resultsError.message,
          code: resultsError.code,
        } : undefined,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in run details endpoint:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

