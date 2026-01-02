import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    const { data: accounts, error } = await supabase
      .from("user_social_accounts")
      .select("*")
      .eq("user_id", user.id)
      .order("platform", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ accounts: accounts || [] });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch social accounts" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    const body = await request.json();
    const { platform, account_url, oauth_token, oauth_token_secret, oauth_refresh_token } = body;

    if (!platform) {
      return NextResponse.json(
        { error: "Platform is required" },
        { status: 400 }
      );
    }

    const { data: account, error } = await supabase
      .from("user_social_accounts")
      .upsert(
        {
          user_id: user.id,
          platform,
          account_url: account_url || null,
          oauth_token: oauth_token || null,
          oauth_token_secret: oauth_token_secret || null,
          oauth_refresh_token: oauth_refresh_token || null,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,platform",
        }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ account });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create social account" },
      { status: 500 }
    );
  }
}

