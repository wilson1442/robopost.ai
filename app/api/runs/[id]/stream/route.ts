import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: runId } = await params;
    const supabase = await createClient();

    // Verify user owns this run
    const { data: agentRun, error: runError } = await supabase
      .from("agent_runs")
      .select("id, user_id, status")
      .eq("id", runId)
      .eq("user_id", user.id)
      .single();

    if (runError || !agentRun) {
      return new Response("Run not found", { status: 404 });
    }

    // Create SSE stream
    const stream = new ReadableStream({
      start(controller) {
        let lastProgressCount = 0;
        let lastResultsCount = 0;
        let isConnected = true;

        const sendEvent = (event: string, data: any) => {
          if (!isConnected) return;

          try {
            const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
            controller.enqueue(new TextEncoder().encode(message));
          } catch (error) {
            console.error("[SSE] Error sending event:", error);
            cleanup();
          }
        };

        const cleanup = () => {
          isConnected = false;
          try {
            controller.close();
          } catch (error) {
            console.error("[SSE] Error closing controller:", error);
          }
        };

        // Send initial connection event
        sendEvent("connected", {
          runId,
          status: agentRun.status,
          timestamp: new Date().toISOString()
        });

        // Poll for updates every 2 seconds (faster than the UI polling was)
        const pollInterval = setInterval(async () => {
          if (!isConnected) {
            clearInterval(pollInterval);
            return;
          }

          try {
            // Check run status
            const { data: currentRun } = await supabase
              .from("agent_runs")
              .select("status, completed_at, error_message")
              .eq("id", runId)
              .single();

            // Send status update if changed
            if (currentRun && currentRun.status !== agentRun.status) {
              sendEvent("status", {
                status: currentRun.status,
                completed_at: currentRun.completed_at,
                error_message: currentRun.error_message,
                timestamp: new Date().toISOString()
              });
              agentRun.status = currentRun.status;
            }

            // Check for new progress logs
            const { data: progressLogs } = await supabase
              .from("run_progress_logs")
              .select("id, message, status, created_at")
              .eq("run_id", runId)
              .order("created_at", { ascending: true });

            if (progressLogs && progressLogs.length > lastProgressCount) {
              // Send only new progress logs
              const newLogs = progressLogs.slice(lastProgressCount);
              newLogs.forEach(log => {
                sendEvent("progress", {
                  id: log.id,
                  message: log.message,
                  status: log.status,
                  created_at: log.created_at,
                  timestamp: new Date().toISOString()
                });
              });
              lastProgressCount = progressLogs.length;
            }

            // Check for new results
            const { data: results } = await supabase
              .from("agent_results")
              .select("id, output_type, content, metadata, created_at")
              .eq("run_id", runId)
              .order("created_at", { ascending: true });

            if (results && results.length > lastResultsCount) {
              // Send only new results
              const newResults = results.slice(lastResultsCount);
              newResults.forEach(result => {
                sendEvent("result", {
                  id: result.id,
                  output_type: result.output_type,
                  content: result.content,
                  metadata: result.metadata,
                  created_at: result.created_at,
                  timestamp: new Date().toISOString()
                });
              });
              lastResultsCount = results.length;
            }

            // If run is completed or failed, send final event and close
            if (currentRun && (currentRun.status === "completed" || currentRun.status === "failed")) {
              sendEvent("complete", {
                status: currentRun.status,
                totalProgressLogs: lastProgressCount,
                totalResults: lastResultsCount,
                timestamp: new Date().toISOString()
              });

              // Give client time to process final event before closing
              setTimeout(() => {
                clearInterval(pollInterval);
                cleanup();
              }, 1000);
            }

          } catch (error) {
            console.error("[SSE] Error during polling:", error);
            sendEvent("error", {
              message: "Error fetching updates",
              timestamp: new Date().toISOString()
            });
          }
        }, 2000); // Poll every 2 seconds

        // Handle client disconnect
        request.signal.addEventListener("abort", () => {
          console.log("[SSE] Client disconnected for run:", runId);
          clearInterval(pollInterval);
          cleanup();
        });
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Cache-Control",
      },
    });

  } catch (error) {
    console.error("[SSE] Error setting up stream:", error);
    return new Response("Internal server error", { status: 500 });
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Cache-Control",
    },
  });
}
