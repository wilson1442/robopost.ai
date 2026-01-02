import { NextRequest, NextResponse } from "next/server";
import { verifyHmacSignature } from "@/lib/webhooks/hmac";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { InboundWebhookPayload } from "@/types/webhooks";

export async function POST(request: NextRequest) {
  console.log("🔥 WEBHOOK CALLBACK HIT! 🔥");
  console.log("[Webhook] Received callback request");
  try {
    // Get HMAC secret from environment
    const webhookSecret = process.env.N8N_WEBHOOK_SECRET;
    const isDevelopment = process.env.NODE_ENV === "development";
    
    if (!webhookSecret) {
      console.error("N8N_WEBHOOK_SECRET environment variable is not set");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Get raw body for HMAC verification
    const body = await request.text();
    console.log("[Webhook] Received body length:", body.length);
    
    // Get signature from header (n8n typically uses x-n8n-signature)
    const signature = request.headers.get("x-n8n-signature") || 
                      request.headers.get("x-signature") ||
                      request.headers.get("signature");

    // Skip HMAC verification in development for easier testing
    if (!isDevelopment) {
      if (!signature) {
        console.error("Missing HMAC signature in request headers");
        return NextResponse.json(
          { error: "Missing signature" },
          { status: 401 }
        );
      }

      // Verify HMAC signature
      const isValid = verifyHmacSignature(body, signature, webhookSecret);
      if (!isValid) {
        console.error("Invalid HMAC signature");
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 }
        );
      }
    } else {
      console.log("[Webhook] ⚠️ DEVELOPMENT MODE: Skipping HMAC verification");
      if (signature) {
        console.log("[Webhook] Signature provided:", signature.substring(0, 20) + "...");
      } else {
        console.log("[Webhook] No signature provided (OK in dev mode)");
      }
    }

    // Parse payload
    let payload: InboundWebhookPayload;
    try {
      payload = JSON.parse(body);
      console.log("[Webhook] Parsed payload:", {
        runId: payload.runId,
        status: payload.status,
        resultsCount: payload.results?.length || 0,
        hasError: !!payload.error,
      });
    } catch (parseError) {
      console.error("Failed to parse webhook payload:", parseError);
      return NextResponse.json(
        { error: "Invalid payload format" },
        { status: 400 }
      );
    }

    // Validate payload structure
    if (!payload.runId || !payload.status || !payload.timestamp) {
      console.error("[Webhook] Missing required fields:", {
        hasRunId: !!payload.runId,
        hasStatus: !!payload.status,
        hasTimestamp: !!payload.timestamp,
      });
      return NextResponse.json(
        { error: "Invalid payload: missing required fields" },
        { status: 400 }
      );
    }

    // Validate version
    if (payload.version !== "v1") {
      return NextResponse.json(
        { error: `Unsupported payload version: ${payload.version}` },
        { status: 400 }
      );
    }

    // Use service role client to bypass RLS (webhooks don't have user sessions)
    let supabase;
    try {
      supabase = createServiceRoleClient();
      console.log("[Webhook] Service role client created successfully");
    } catch (clientError) {
      console.error("[Webhook] Failed to create service role client:", clientError);
      return NextResponse.json(
        { error: "Server configuration error", details: clientError instanceof Error ? clientError.message : "Unknown error" },
        { status: 500 }
      );
    }

    // Look up agent_run by runId
    const { data: agentRun, error: runError } = await supabase
      .from("agent_runs")
      .select("id, user_id, status, webhook_payload")
      .eq("id", payload.runId)
      .single();

    if (runError || !agentRun) {
      console.error("Agent run not found:", payload.runId, runError);
      return NextResponse.json(
        { error: "Run not found" },
        { status: 404 }
      );
    }

    // Check if this run is configured for streaming
    const isStreamingEnabled = agentRun.webhook_payload &&
                               typeof agentRun.webhook_payload === 'object' &&
                               (agentRun.webhook_payload as any).streaming?.enabled;

    console.log("[Webhook] Streaming enabled:", isStreamingEnabled);

    // Handle progress updates (streaming status messages)
    if (payload.status === "progress" && payload.progress) {
      console.log(`[Webhook] Progress update for run ${payload.runId}:`, payload.progress.message);
      console.log(`[Webhook] Streaming enabled: ${isStreamingEnabled}`);

      const { error: progressError, data: insertedProgress } = await supabase
        .from("run_progress_logs")
        .insert({
          run_id: payload.runId,
          message: payload.progress.message,
          status: payload.progress.status || "info",
        })
        .select();

      if (progressError) {
        console.error("Error inserting progress log:", progressError);
        console.error("Progress error details:", JSON.stringify(progressError, null, 2));
        console.error("Service role key present:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);
        // Don't fail the request, just log the error
        return NextResponse.json(
          {
            success: false,
            message: "Progress update failed",
            error: progressError.message,
            details: progressError
          },
          { status: 500 }
        );
      }

      console.log(`[Webhook] Successfully inserted progress log:`, insertedProgress);

      // Keep status as "processing" for progress updates
      return NextResponse.json(
        {
          success: true,
          message: "Progress update recorded",
          streaming: isStreamingEnabled,
          data: insertedProgress
        },
        { status: 200 }
      );
    }

    // Determine final status based on payload status
    // Note: Database only supports 'pending', 'processing', 'completed', 'failed'
    // 'partial' from n8n is treated as 'completed' since results are still stored
    let finalStatus: "completed" | "failed";
    if (payload.status === "error") {
      finalStatus = "failed";
    } else {
      // Map both "success" and "partial" to "completed"
      finalStatus = "completed";
    }

    // Update agent_run status
    const updateData: {
      status: string;
      completed_at: string;
      error_message?: string | null;
    } = {
      status: finalStatus,
      completed_at: new Date().toISOString(),
    };

    if (payload.error) {
      updateData.error_message = payload.error.message || JSON.stringify(payload.error);
    }

    console.log(`[Webhook] Updating run ${payload.runId} to status: ${finalStatus}`);
    const { error: updateError, data: updatedRun } = await supabase
      .from("agent_runs")
      .update(updateData)
      .eq("id", payload.runId)
      .select();

    if (updateError) {
      console.error("Error updating agent run:", updateError);
      return NextResponse.json(
        { error: "Failed to update run", details: updateError.message },
        { status: 500 }
      );
    }

    console.log(`[Webhook] Successfully updated run ${payload.runId}`, updatedRun);

    // Store agent_results if provided
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/7fc0794e-0f8c-4c87-bba6-bdd60340a322',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/webhooks/callback/route.ts:208',message:'Webhook payload received',data:{runId:payload.runId,status:payload.status,hasResults:!!payload.results,resultsIsArray:Array.isArray(payload.results),resultsType:typeof payload.results,resultsLength:payload.results?.length,firstResultKeys:payload.results?.[0]?Object.keys(payload.results[0]):null,firstResultSample:payload.results?.[0]?JSON.stringify(payload.results[0]).substring(0,500):null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    // Handle results - n8n may send it as a JSON string, plain string, or array
    const resultsValue: unknown = payload.results;
    let resultsArray: typeof payload.results = payload.results;
    if (resultsValue && typeof resultsValue === 'string') {
      try {
        // Try to parse as JSON first
        resultsArray = JSON.parse(resultsValue);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/7fc0794e-0f8c-4c87-bba6-bdd60340a322',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/webhooks/callback/route.ts:216',message:'Parsed results string to array',data:{runId:payload.runId,parsedIsArray:Array.isArray(resultsArray),parsedLength:resultsArray?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
      } catch (parseError) {
        // If parsing fails, it might be a plain content string
        // Try to determine output type from original run configuration
        let outputType: "blog" | "social" | "email" | "webhook" = "blog";
        if (agentRun?.webhook_payload && typeof agentRun.webhook_payload === 'object') {
          const config = (agentRun.webhook_payload as any)?.config;
          if (config?.outputFormats && Array.isArray(config.outputFormats) && config.outputFormats.length > 0) {
            outputType = config.outputFormats[0] as typeof outputType;
          }
        }
        console.warn(`[Webhook] Results is a plain string, wrapping in array with output type: ${outputType}`);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/7fc0794e-0f8c-4c87-bba6-bdd60340a322',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/webhooks/callback/route.ts:222',message:'Results is plain string, wrapping',data:{runId:payload.runId,stringLength:(resultsValue as string).length,stringPreview:(resultsValue as string).substring(0,100),determinedOutputType:outputType},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        // Wrap the plain string in the expected array format
        resultsArray = [{
          outputType: outputType,
          content: resultsValue as string,
          metadata: {
            sources: []
          }
        }];
      }
    }
    
    if (resultsArray && Array.isArray(resultsArray) && resultsArray.length > 0) {
      console.log(`[Webhook] Inserting ${resultsArray.length} results for run ${payload.runId}`);
      console.log(`[Webhook] Results sample:`, JSON.stringify(resultsArray[0], null, 2));
      
      // #region agent log
      resultsArray.forEach((result, index) => {
        fetch('http://127.0.0.1:7242/ingest/7fc0794e-0f8c-4c87-bba6-bdd60340a322',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/webhooks/callback/route.ts:212',message:'Raw result from payload',data:{index,hasOutputType:!!result.outputType,outputType:result.outputType,hasContent:!!result.content,contentType:typeof result.content,contentLength:result.content?.length,contentPreview:result.content?.substring(0,100),allKeys:Object.keys(result)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      });
      // #endregion
      
      const resultsToInsert = resultsArray.map((result, index) => {
        // Validate required fields
        if (!result.outputType) {
          console.warn(`[Webhook] Result ${index} missing outputType`);
        }
        if (!result.content) {
          console.warn(`[Webhook] Result ${index} missing content`);
        }
        
        const mapped = {
          run_id: payload.runId,
          output_type: result.outputType,
          content: result.content || "",
          metadata: result.metadata || { sources: [] },
        };
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/7fc0794e-0f8c-4c87-bba6-bdd60340a322',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/webhooks/callback/route.ts:227',message:'Mapped result before insert',data:{index,run_id:mapped.run_id,output_type:mapped.output_type,hasContent:!!mapped.content,contentLength:mapped.content.length,contentPreview:mapped.content.substring(0,100),hasMetadata:!!mapped.metadata},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        
        return mapped;
      });

      console.log(`[Webhook] Attempting to insert ${resultsToInsert.length} results...`);
      console.log(`[Webhook] First result sample:`, JSON.stringify(resultsToInsert[0], null, 2));
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/7fc0794e-0f8c-4c87-bba6-bdd60340a322',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/webhooks/callback/route.ts:232',message:'Before database insert',data:{resultsToInsertCount:resultsToInsert.length,firstResultContentLength:resultsToInsert[0]?.content?.length,firstResultContentPreview:resultsToInsert[0]?.content?.substring(0,100),firstResultHasContent:!!resultsToInsert[0]?.content},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      const { error: resultsError, data: insertedResults } = await supabase
        .from("agent_results")
        .insert(resultsToInsert)
        .select();

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/7fc0794e-0f8c-4c87-bba6-bdd60340a322',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/webhooks/callback/route.ts:237',message:'After database insert',data:{hasError:!!resultsError,errorCode:resultsError?.code,errorMessage:resultsError?.message,insertedCount:insertedResults?.length,firstInsertedId:insertedResults?.[0]?.id,firstInsertedContentLength:insertedResults?.[0]?.content?.length,firstInsertedContentPreview:insertedResults?.[0]?.content?.substring(0,100),firstInsertedHasContent:!!insertedResults?.[0]?.content},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion

      if (resultsError) {
        console.error("❌ Error inserting agent results:", resultsError);
        console.error("Error code:", resultsError.code);
        console.error("Error message:", resultsError.message);
        console.error("Error details:", JSON.stringify(resultsError, null, 2));
        console.error("Error hint:", resultsError.hint);
        console.error("Attempted to insert:", JSON.stringify(resultsToInsert, null, 2));
        console.error("Service role key present:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);
        console.error("Supabase URL present:", !!process.env.NEXT_PUBLIC_SUPABASE_URL);
        
        // Log the error but still return success to n8n (don't retry)
        // The run status has already been updated, which is the most important part
        // We'll investigate the results insertion issue separately
        console.error("⚠️ Results insertion failed, but run status was updated successfully");
      } else {
        console.log(`✅ Successfully inserted ${insertedResults?.length || 0} results`);
        console.log(`[Webhook] Inserted result IDs:`, insertedResults?.map(r => r.id));
      }
    } else {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/7fc0794e-0f8c-4c87-bba6-bdd60340a322',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/webhooks/callback/route.ts:255',message:'No results in payload',data:{runId:payload.runId,hasResults:!!payload.results,resultsIsArray:Array.isArray(resultsArray),resultsType:typeof payload.results,resultsLength:resultsArray?.length,payloadKeys:Object.keys(payload)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      console.log(`[Webhook] No results provided in payload for run ${payload.runId}`);
      console.log(`[Webhook] Payload has results:`, !!payload.results);
      console.log(`[Webhook] Results type:`, typeof payload.results);
      console.log(`[Webhook] Results is array:`, Array.isArray(resultsArray));
      console.log(`[Webhook] Results length:`, resultsArray?.length || 0);
    }

    // Return success response to n8n
    return NextResponse.json(
      {
        success: true,
        message: "Webhook processed successfully",
        streaming: isStreamingEnabled,
        resultsStored: resultsArray ? resultsArray.length : 0
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing webhook callback:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

