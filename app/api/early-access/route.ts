import { NextRequest, NextResponse } from "next/server";
import type { EarlyAccessRequest, EarlyAccessPayload } from "@/types/early-access";

export async function POST(request: NextRequest) {
  try {
    const body: EarlyAccessRequest = await request.json();
    const { email, companyName } = body;

    // Validate email format
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: "Invalid email format" },
        { status: 400 }
      );
    }

    // Construct payload
    const payload: EarlyAccessPayload = {
      email,
      date: new Date().toISOString(),
      source: "robopost.ai",
    };

    // Only include companyName if provided and not empty
    if (companyName && companyName.trim().length > 0) {
      payload.companyName = companyName.trim();
    }

    // Get webhook URL from environment variable
    const webhookUrl = process.env.EARLY_ACCESS_WEBHOOK_URL;

    if (!webhookUrl) {
      console.error("EARLY_ACCESS_WEBHOOK_URL environment variable is not set");
      return NextResponse.json(
        { success: false, message: "Server configuration error" },
        { status: 500 }
      );
    }

    // Get webhook signature secret for authentication
    const webhookSecret = process.env.N8N_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("N8N_WEBHOOK_SECRET environment variable is not set");
      return NextResponse.json(
        { success: false, message: "Server configuration error" },
        { status: 500 }
      );
    }

    // Prepare headers with authentication
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      "x-n8n-signature": webhookSecret,
    };

    // Send POST request to webhook
    const webhookResponse = await fetch(webhookUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!webhookResponse.ok) {
      console.error(
        `Webhook request failed with status ${webhookResponse.status}`
      );
      return NextResponse.json(
        { success: false, message: "Failed to submit early access request" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Early access request submitted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing early access request:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

