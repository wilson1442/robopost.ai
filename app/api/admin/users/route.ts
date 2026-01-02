import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await requireAdmin();
    const supabase = await createClient();

    // Get all user profiles
    const { data: profiles, error: profilesError } = await supabase
      .from("user_profiles")
      .select("id, created_at, updated_at, industry_preference_id, industry_preference_locked")
      .order("created_at", { ascending: false });

    if (profilesError) {
      return NextResponse.json({ error: profilesError.message }, { status: 500 });
    }

    // Note: To get email and role, you would need to use Supabase Admin API
    // or create a database function/view that joins with auth.users
    // For now, we'll return profiles and let the frontend fetch additional details if needed

    const users = (profiles || []).map((profile) => ({
      ...profile,
      email: null, // Would need admin API to fetch
      role: null, // Would need admin API to fetch
    }));

    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

