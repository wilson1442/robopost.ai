import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  console.log("[TestWebhook] Testing webhook connectivity...");

  // #region agent log
  const debugPayload = {
    location: 'app/api/test-webhook/route.ts:8',
    message: 'Environment inspection',
    data: {
      N8N_WEBHOOK_URL: process.env.N8N_WEBHOOK_URL,
      N8N_WEBHOOK_URL_length: process.env.N8N_WEBHOOK_URL?.length,
      N8N_WEBHOOK_URL_first20: process.env.N8N_WEBHOOK_URL?.substring(0, 20),
      N8N_WEBHOOK_SECRET_exists: !!process.env.N8N_WEBHOOK_SECRET,
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
      VERCEL_GIT_COMMIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7),
      VERCEL_GIT_COMMIT_REF: process.env.VERCEL_GIT_COMMIT_REF,
      allEnvKeys: Object.keys(process.env).filter(k => k.includes('N8N') || k.includes('WEBHOOK') || k.includes('VERCEL')),
    },
    timestamp: Date.now(),
    sessionId: 'debug-session',
    runId: 'env-debug',
    hypothesisId: 'A-B-C-D-E'
  };
  fetch('http://127.0.0.1:7242/ingest/7fc0794e-0f8c-4c87-bba6-bdd60340a322', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(debugPayload)
  }).catch(() => {});
  // #endregion

  const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;

  if (!n8nWebhookUrl) {
    return NextResponse.json(
      { 
        error: "N8N_WEBHOOK_URL not configured",
        // #region agent log - diagnostic info when env not set
        _debug: {
          envVarValue: process.env.N8N_WEBHOOK_URL,
          envVarType: typeof process.env.N8N_WEBHOOK_URL,
          vercelEnv: process.env.VERCEL_ENV,
          vercelGitRef: process.env.VERCEL_GIT_COMMIT_REF,
          vercelGitSha: process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7),
          nodeEnv: process.env.NODE_ENV,
          allN8nEnvs: Object.keys(process.env).filter(k => k.includes('N8N')),
        }
        // #endregion
      },
      { status: 500 }
    );
  }

  try {
    console.log("[TestWebhook] Testing HEAD request to:", n8nWebhookUrl);

    // Test basic connectivity
    const headResponse = await fetch(n8nWebhookUrl, {
      method: "HEAD",
    });

    console.log("[TestWebhook] HEAD response:", {
      status: headResponse.status,
      statusText: headResponse.statusText,
      headers: Object.fromEntries(headResponse.headers.entries()),
    });

    // Test POST request with minimal payload
    const testPayload = JSON.stringify({
      test: true,
      timestamp: new Date().toISOString(),
    });

    console.log("[TestWebhook] Testing POST request...");
    const postResponse = await fetch(n8nWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: testPayload,
    });

    console.log("[TestWebhook] POST response:", {
      status: postResponse.status,
      statusText: postResponse.statusText,
      headers: Object.fromEntries(postResponse.headers.entries()),
    });

    let postBody = "";
    try {
      postBody = await postResponse.text();
      console.log("[TestWebhook] POST response body:", postBody);
    } catch (e) {
      console.log("[TestWebhook] Could not read POST response body:", e);
    }

    return NextResponse.json({
      success: true,
      headRequest: {
        status: headResponse.status,
        statusText: headResponse.statusText,
      },
      postRequest: {
        status: postResponse.status,
        statusText: postResponse.statusText,
        body: postBody,
      },
      url: n8nWebhookUrl,
      // #region agent log - diagnostic info in response
      _debug: {
        envVarLength: process.env.N8N_WEBHOOK_URL?.length,
        envVarFirst30: process.env.N8N_WEBHOOK_URL?.substring(0, 30),
        vercelEnv: process.env.VERCEL_ENV,
        vercelGitRef: process.env.VERCEL_GIT_COMMIT_REF,
        vercelGitSha: process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7),
      }
      // #endregion
    });

  } catch (error) {
    console.error("[TestWebhook] Error:", error);
    return NextResponse.json(
      {
        error: "Webhook test failed",
        details: error instanceof Error ? error.message : String(error),
        url: n8nWebhookUrl,
        // #region agent log - diagnostic info in response
        _debug: {
          envVarLength: process.env.N8N_WEBHOOK_URL?.length,
          envVarFirst30: process.env.N8N_WEBHOOK_URL?.substring(0, 30),
          envVarLast20: process.env.N8N_WEBHOOK_URL?.slice(-20),
          vercelEnv: process.env.VERCEL_ENV,
          vercelGitRef: process.env.VERCEL_GIT_COMMIT_REF,
          vercelGitSha: process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7),
          nodeEnv: process.env.NODE_ENV,
          buildTime: new Date().toISOString(),
        }
        // #endregion
      },
      { status: 500 }
    );
  }
}
