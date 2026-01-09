import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    // Get user profile
    const { data: profile, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "not found" - we'll handle that by creating a profile
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If profile doesn't exist, create one
    if (!profile) {
      const { data: newProfile, error: createError } = await supabase
        .from("user_profiles")
        .insert({
          id: user.id,
        })
        .select()
        .single();

      if (createError) {
        return NextResponse.json(
          { error: createError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ profile: newProfile, user });
    }

    return NextResponse.json({ profile, user });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    const body = await request.json();
    const { industry_preference_id } = body;

    // Get existing profile to check if industry is locked
    const { data: existingProfile } = await supabase
      .from("user_profiles")
      .select("industry_preference_id, industry_preference_locked")
      .eq("id", user.id)
      .single();

    // Check if trying to change a locked industry
    if (
      existingProfile?.industry_preference_locked &&
      existingProfile?.industry_preference_id &&
      industry_preference_id &&
      existingProfile.industry_preference_id !== industry_preference_id
    ) {
      return NextResponse.json(
        { error: "Industry preference is locked and cannot be changed" },
        { status: 400 }
      );
    }

    // Determine if this is first time setting industry
    const isFirstTime = !existingProfile?.industry_preference_id && industry_preference_id;

    // Update or insert profile
    const { data: profile, error } = await supabase
      .from("user_profiles")
      .upsert(
        {
          id: user.id,
          industry_preference_id: industry_preference_id || null,
          industry_preference_locked: isFirstTime
            ? true
            : existingProfile?.industry_preference_locked || false,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "id",
        }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}

