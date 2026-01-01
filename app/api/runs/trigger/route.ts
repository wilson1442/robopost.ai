import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/auth";
import { createClient } from "@/lib/supabase/server";
import { RunTriggerRequest, RunTriggerResponse, OutboundWebhookPayload } from "@/types/webhooks";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    // Parse and validate request body
    const body: RunTriggerRequest = await request.json();

    // Validate required fields
    if (!body.sourceIds || !Array.isArray(body.sourceIds) || body.sourceIds.length === 0) {
      return NextResponse.json(
        { error: "At least one source ID is required" },
        { status: 400 }
      );
    }

    if (!body.outputFormats || !Array.isArray(body.outputFormats) || body.outputFormats.length === 0) {
      return NextResponse.json(
        { error: "At least one output format is required" },
        { status: 400 }
      );
    }

    if (!body.destination || !body.destination.type) {
      return NextResponse.json(
        { error: "Destination type is required" },
        { status: 400 }
      );
    }

    // Fetch user's sources to validate ownership and get RSS source details
    const { data: userSources, error: sourcesError } = await supabase
      .from("user_sources")
      .select(
        `
        id,
        is_active,
        rss_sources (
          id,
          url,
          name
        )
      `
      )
      .eq("user_id", user.id)
      .in("id", body.sourceIds)
      .eq("is_active", true);

    if (sourcesError) {
      console.error("Error fetching sources:", sourcesError);
      return NextResponse.json(
        { error: "Failed to fetch sources" },
        { status: 500 }
      );
    }

    if (!userSources || userSources.length === 0) {
      return NextResponse.json(
        { error: "No valid active sources found" },
        { status: 400 }
      );
    }

    // Get industry slug if industryId is provided
    let industrySlug: string | undefined;
    if (body.industryId) {
      const { data: industry } = await supabase
        .from("industries")
        .select("slug")
        .eq("id", body.industryId)
        .single();

      if (industry) {
        industrySlug = industry.slug;
      }
    }

    // Generate unique run ID
    const runId = randomUUID();

    // Transform user sources to RSS sources format
    const rssSources = userSources
      .filter((us: any) => us.rss_sources)
      .map((us: any) => ({
        id: us.rss_sources.id,
        url: us.rss_sources.url,
        name: us.rss_sources.name,
      }));

    // Construct webhook payload
    const webhookPayload: OutboundWebhookPayload = {
      version: "v1",
      runId,
      userId: user.id,
      timestamp: new Date().toISOString(),
      config: {
        industry: industrySlug || "",
        rssSources,
        promptInstructions: body.promptInstructions || "",
        outputFormats: body.outputFormats,
        destination: body.destination,
      },
    };

    // Create agent_run record with "pending" status
    const { data: agentRun, error: runError } = await supabase
      .from("agent_runs")
      .insert({
        id: runId,
        user_id: user.id,
        status: "pending",
        industry_id: body.industryId || null,
        prompt_instructions: body.promptInstructions || null,
        triggered_at: new Date().toISOString(),
        webhook_payload: webhookPayload,
      })
      .select()
      .single();

    if (runError) {
      console.error("Error creating agent run:", runError);
      return NextResponse.json(
        { error: "Failed to create run record" },
        { status: 500 }
      );
    }

    // Get n8n webhook URL from environment
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
    if (!n8nWebhookUrl) {
      console.error("N8N_WEBHOOK_URL environment variable is not set");
      
      // Update run status to failed
      await supabase
        .from("agent_runs")
        .update({ 
          status: "failed",
          error_message: "Server configuration error: N8N_WEBHOOK_URL not set"
        })
        .eq("id", runId);

      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Get webhook signature secret for authentication
    const webhookSecret = process.env.N8N_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("N8N_WEBHOOK_SECRET environment variable is not set");
      
      // Update run status to failed
      await supabase
        .from("agent_runs")
        .update({ 
          status: "failed",
          error_message: "Server configuration error: N8N_WEBHOOK_SECRET not set"
        })
        .eq("id", runId);

      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Send webhook to n8n
    try {
      const webhookResponse = await fetch(n8nWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-n8n-signature": webhookSecret,
        },
        body: JSON.stringify(webhookPayload),
      });

      if (!webhookResponse.ok) {
        throw new Error(`n8n webhook returned status ${webhookResponse.status}`);
      }

      // Update run status to "processing" after successful webhook send
      await supabase
        .from("agent_runs")
        .update({ status: "processing" })
        .eq("id", runId);
    } catch (webhookError) {
      console.error("Error sending webhook to n8n:", webhookError);
      
      // Update run status to failed
      await supabase
        .from("agent_runs")
        .update({ 
          status: "failed",
          error_message: webhookError instanceof Error ? webhookError.message : "Failed to send webhook to n8n"
        })
        .eq("id", runId);

      return NextResponse.json(
        { error: "Failed to trigger agent run" },
        { status: 500 }
      );
    }

    // Return success response
    const response: RunTriggerResponse = {
      runId,
      status: "pending",
      message: "Agent run triggered successfully",
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Error in run trigger endpoint:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

