import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/auth";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    const { data: userSource, error } = await supabase
      .from("user_sources")
      .select(
        `
        id,
        custom_name,
        is_active,
        created_at,
        rss_source:rss_sources (
          id,
          url,
          name,
          industry_id,
          industry:industries (
            id,
            slug,
            name
          )
        )
      `
      )
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Source not found" }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      source: {
        id: userSource.id,
        url: userSource.rss_source.url,
        name: userSource.custom_name || userSource.rss_source.name,
        originalName: userSource.rss_source.name,
        isActive: userSource.is_active,
        industryId: userSource.rss_source.industry_id,
        industry: userSource.rss_source.industry,
        createdAt: userSource.created_at,
        rssSourceId: userSource.rss_source.id,
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
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    const body = await request.json();
    const { name, isActive } = body;

    // Verify the source belongs to the user
    const { data: existingSource } = await supabase
      .from("user_sources")
      .select("id")
      .eq("id", params.id)
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
      .eq("id", params.id)
      .select(
        `
        id,
        custom_name,
        is_active,
        created_at,
        rss_source:rss_sources (
          id,
          url,
          name,
          industry_id,
          industry:industries (
            id,
            slug,
            name
          )
        )
      `
      )
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      source: {
        id: updated.id,
        url: updated.rss_source.url,
        name: updated.custom_name || updated.rss_source.name,
        originalName: updated.rss_source.name,
        isActive: updated.is_active,
        industryId: updated.rss_source.industry_id,
        industry: updated.rss_source.industry,
        createdAt: updated.created_at,
        rssSourceId: updated.rss_source.id,
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
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    // Verify the source belongs to the user
    const { data: existingSource } = await supabase
      .from("user_sources")
      .select("id")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single();

    if (!existingSource) {
      return NextResponse.json({ error: "Source not found" }, { status: 404 });
    }

    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from("user_sources")
      .update({ is_active: false })
      .eq("id", params.id);

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

