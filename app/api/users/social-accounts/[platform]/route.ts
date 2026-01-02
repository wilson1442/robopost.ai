import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/auth";
import { NextResponse } from "next/server";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ platform: string }> }
) {
  try {
    const user = await requireAuth();
    const { platform } = await params;
    const supabase = await createClient();

    const { error } = await supabase
      .from("user_social_accounts")
      .delete()
      .eq("user_id", user.id)
      .eq("platform", platform);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete social account" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ platform: string }> }
) {
  try {
    const user = await requireAuth();
    const { platform } = await params;
    const supabase = await createClient();

    const body = await request.json();
    const { account_url, oauth_token, oauth_token_secret, oauth_refresh_token, is_active } = body;

    const { data: account, error } = await supabase
      .from("user_social_accounts")
      .update({
        account_url: account_url !== undefined ? account_url : undefined,
        oauth_token: oauth_token !== undefined ? oauth_token : undefined,
        oauth_token_secret: oauth_token_secret !== undefined ? oauth_token_secret : undefined,
        oauth_refresh_token: oauth_refresh_token !== undefined ? oauth_refresh_token : undefined,
        is_active: is_active !== undefined ? is_active : undefined,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .eq("platform", platform)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ account });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update social account" },
      { status: 500 }
    );
  }
}

