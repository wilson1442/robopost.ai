import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  console.log("[TestWebhook] Testing webhook connectivity...");

  // #region agent log - comprehensive env debugging
  // Get ALL env keys that might be related
  const allEnvKeys = Object.keys(process.env);
  const webhookRelatedKeys = allEnvKeys.filter(k => 
    k.toUpperCase().includes('N8N') || 
    k.toUpperCase().includes('WEBHOOK') || 
    k.toUpperCase().includes('URL')
  );
  const webhookRelatedValues: Record<string, string> = {};
  webhookRelatedKeys.forEach(k => {
    webhookRelatedValues[k] = process.env[k]?.substring(0, 50) || 'undefined';
  });
  
  // Check for hidden characters in the env var name
  const exactN8NKey = allEnvKeys.find(k => k === 'N8N_WEBHOOK_URL');
  const similarN8NKeys = allEnvKeys.filter(k => k.includes('N8N') || k.includes('WEBHOOK'));
  
  console.log('[DEBUG] All webhook-related env vars:', webhookRelatedValues);
  console.log('[DEBUG] Exact N8N_WEBHOOK_URL key found:', exactN8NKey);
  console.log('[DEBUG] Similar keys:', similarN8NKeys);
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
    
    // #region agent log - comprehensive debug in error response
    const allEnvKeys = Object.keys(process.env);
    const webhookKeys = allEnvKeys.filter(k => 
      k.toUpperCase().includes('N8N') || 
      k.toUpperCase().includes('WEBHOOK') || 
      k.toUpperCase().includes('EARLY')
    );
    const webhookVars: Record<string, string | undefined> = {};
    webhookKeys.forEach(k => {
      webhookVars[k] = process.env[k]?.substring(0, 60);
    });
    // #endregion
    
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
          vercelProjectId: process.env.VERCEL_PROJECT_ID,
          nodeEnv: process.env.NODE_ENV,
          buildTime: new Date().toISOString(),
          allWebhookEnvVars: webhookVars,
          allWebhookKeys: webhookKeys,
          totalEnvVarCount: allEnvKeys.length,
        }
        // #endregion
      },
      { status: 500 }
    );
  }
}
