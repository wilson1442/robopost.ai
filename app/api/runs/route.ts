import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/auth";
import { isAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { AgentRunsResponse } from "@/types/database";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const supabase = await createClient();
    const admin = isAdmin(user);

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const status = searchParams.get("status");

    // Build query - admins see all runs, regular users see only their own
    let query = supabase
      .from("agent_runs")
      .select("id, user_id, status, industry_id, prompt_instructions, triggered_at, completed_at, error_message, created_at")
      .order("triggered_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (!admin) {
      query = query.eq("user_id", user.id);
    }

    // Filter by status if provided
    if (status && ["pending", "processing", "completed", "failed"].includes(status)) {
      query = query.eq("status", status);
    }

    const { data: runs, error } = await query;

    if (error) {
      console.error("Error fetching agent runs:", error);
      return NextResponse.json(
        { error: "Failed to fetch runs" },
        { status: 500 }
      );
    }

    const response: AgentRunsResponse = {
      runs: runs || [],
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in runs list endpoint:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

