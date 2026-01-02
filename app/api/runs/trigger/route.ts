import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/auth";
import { createClient } from "@/lib/supabase/server";
import { RunTriggerRequest, RunTriggerResponse, OutboundWebhookPayload } from "@/types/webhooks";
import { generateHmacSignature } from "@/lib/webhooks/hmac";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  try {
    console.log("[RunTrigger] Starting agent run trigger");
    const user = await requireAuth();
    const supabase = await createClient();

    // Parse and validate request body
    const body: RunTriggerRequest = await request.json();
    console.log("[RunTrigger] Request body:", {
      sourceIdsCount: body.sourceIds?.length || 0,
      outputFormatsCount: body.outputFormats?.length || 0,
      hasIndustryId: !!body.industryId,
      destinationType: body.destination?.type,
    });

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

    // Get base URL for streaming endpoint
    // Priority: NEXT_PUBLIC_APP_URL > Production domain > VERCEL_URL > localhost
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
                    (process.env.NODE_ENV === 'production' ? 'https://robopost.ai' :
                     (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'));
    const streamingUrl = `${baseUrl}/api/runs/${runId}/stream`;

    // Construct webhook payload
    const webhookPayload: OutboundWebhookPayload = {
      version: "v1",
      runId,
      userId: user.id,
      timestamp: new Date().toISOString(),
      streaming: {
        enabled: true, // Enable streaming by default
        callbackUrl: `${baseUrl}/api/webhooks/callback`, // Fallback for legacy support
      },
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

    // Get n8n webhook URL from environment (trim to remove any trailing whitespace)
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL?.trim();
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
      const payloadBody = JSON.stringify(webhookPayload);
      const hmacSignature = generateHmacSignature(payloadBody, webhookSecret);
      
      console.log("[RunTrigger] Sending webhook to n8n:", {
        url: n8nWebhookUrl,
        runId,
        payloadSize: payloadBody.length,
        hasSources: webhookPayload.config.rssSources.length > 0,
      });

      const webhookResponse = await fetch(n8nWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-n8n-signature": hmacSignature,
        },
        body: payloadBody,
      });

      if (!webhookResponse.ok) {
        let errorMessage = `n8n webhook returned status ${webhookResponse.status}`;
        try {
          const errorBody = await webhookResponse.text();
          if (errorBody) {
            errorMessage += `: ${errorBody.substring(0, 200)}`;
          }
        } catch {
          // Ignore error body parsing errors
        }
        console.error("[RunTrigger] Webhook error response:", {
          status: webhookResponse.status,
          statusText: webhookResponse.statusText,
          errorMessage,
        });
        throw new Error(errorMessage);
      }

      console.log("[RunTrigger] Webhook sent successfully, updating status to processing");

      // Update run status to "processing" after successful webhook send
      await supabase
        .from("agent_runs")
        .update({ status: "processing" })
        .eq("id", runId);
    } catch (webhookError) {
      const errorMessage = webhookError instanceof Error 
        ? webhookError.message 
        : "Failed to send webhook to n8n";
      
      console.error("[RunTrigger] Error sending webhook to n8n:", {
        error: webhookError,
        errorMessage,
        runId,
        webhookUrl: n8nWebhookUrl,
        hasSecret: !!webhookSecret,
      });
      
      // Update run status to failed
      await supabase
        .from("agent_runs")
        .update({ 
          status: "failed",
          error_message: errorMessage
        })
        .eq("id", runId);

      return NextResponse.json(
        { 
          error: "Failed to trigger agent run",
          details: errorMessage 
        },
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

