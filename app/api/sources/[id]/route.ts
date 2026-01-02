import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/auth";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const supabase = await createClient();
    const { id } = await params;

    const { data: userSource, error } = await supabase
      .from("user_sources")
      .select(
        `
        id,
        custom_name,
        is_active,
        created_at,
        rss_sources (
          id,
          url,
          name,
          industry_id,
          industries (
            id,
            slug,
            name,
            created_at
          )
        )
      `
      )
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Source not found" }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!userSource) {
      return NextResponse.json({ error: "Source not found" }, { status: 404 });
    }

    const rssSource = Array.isArray(userSource.rss_sources) 
      ? userSource.rss_sources[0] 
      : userSource.rss_sources;
    const industry = rssSource?.industries 
      ? (Array.isArray(rssSource.industries) ? rssSource.industries[0] : rssSource.industries)
      : null;

    return NextResponse.json({
      source: {
        id: userSource.id,
        url: rssSource?.url || "",
        name: userSource.custom_name || rssSource?.name || "",
        originalName: rssSource?.name || "",
        isActive: userSource.is_active,
        industryId: rssSource?.industry_id || null,
        industry: industry ? {
          id: industry.id,
          slug: industry.slug,
          name: industry.name,
          created_at: industry.created_at,
        } : null,
        createdAt: userSource.created_at,
        rssSourceId: rssSource?.id || "",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch source" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const supabase = await createClient();
    const { id } = await params;

    const body = await request.json();
    const { name, isActive } = body;

    // Verify the source belongs to the user
    const { data: existingSource } = await supabase
      .from("user_sources")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (!existingSource) {
      return NextResponse.json({ error: "Source not found" }, { status: 404 });
    }

    // Build update object
    const updates: {
      custom_name?: string | null;
      is_active?: boolean;
    } = {};

    if (name !== undefined) {
      updates.custom_name = name || null;
    }

    if (isActive !== undefined) {
      updates.is_active = isActive;
    }

    const { data: updated, error } = await supabase
      .from("user_sources")
      .update(updates)
      .eq("id", id)
      .select(
        `
        id,
        custom_name,
        is_active,
        created_at,
        rss_sources (
          id,
          url,
          name,
          industry_id,
          industries (
            id,
            slug,
            name,
            created_at
          )
        )
      `
      )
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!updated) {
      return NextResponse.json({ error: "Source not found" }, { status: 404 });
    }

    const rssSource = Array.isArray(updated.rss_sources) 
      ? updated.rss_sources[0] 
      : updated.rss_sources;
    const industry = rssSource?.industries 
      ? (Array.isArray(rssSource.industries) ? rssSource.industries[0] : rssSource.industries)
      : null;

    return NextResponse.json({
      source: {
        id: updated.id,
        url: rssSource?.url || "",
        name: updated.custom_name || rssSource?.name || "",
        originalName: rssSource?.name || "",
        isActive: updated.is_active,
        industryId: rssSource?.industry_id || null,
        industry: industry ? {
          id: industry.id,
          slug: industry.slug,
          name: industry.name,
          created_at: industry.created_at,
        } : null,
        createdAt: updated.created_at,
        rssSourceId: rssSource?.id || "",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update source" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const supabase = await createClient();
    const { id } = await params;

    // Verify the source belongs to the user
    const { data: existingSource } = await supabase
      .from("user_sources")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (!existingSource) {
      return NextResponse.json({ error: "Source not found" }, { status: 404 });
    }

    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from("user_sources")
      .update({ is_active: false })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete source" },
      { status: 500 }
    );
  }
}

