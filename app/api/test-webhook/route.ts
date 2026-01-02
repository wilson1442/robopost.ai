import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  console.log("[TestWebhook] Testing webhook connectivity...");

  // Trim to remove any trailing whitespace/newlines from env var
  const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL?.trim();

  if (!n8nWebhookUrl) {
    return NextResponse.json(
      { error: "N8N_WEBHOOK_URL not configured" },
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
    });

    let postBody = "";
    try {
      postBody = await postResponse.text();
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
    });

  } catch (error) {
    console.error("[TestWebhook] Error:", error);
    return NextResponse.json(
      {
        error: "Webhook test failed",
        details: error instanceof Error ? error.message : String(error),
        url: n8nWebhookUrl,
      },
      { status: 500 }
    );
  }
}
