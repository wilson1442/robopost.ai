import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const supabase = await createClient();

    const { data: source, error } = await supabase
      .from("rss_sources")
      .select(`
        id,
        url,
        name,
        industry_id,
        is_public,
        created_at,
        updated_at,
        industries (
          id,
          slug,
          name
        )
      `)
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Source not found" }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Normalize industries (Supabase returns as array)
    const normalizedSource = {
      ...source,
      industries: Array.isArray(source.industries) 
        ? source.industries[0] || null 
        : source.industries || null,
    };

    return NextResponse.json({ source: normalizedSource });
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
    await requireAdmin();
    const { id } = await params;
    const supabase = await createClient();

    const body = await request.json();
    const { url, name, industry_id, is_public } = body;

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (url !== undefined) updateData.url = url;
    if (name !== undefined) updateData.name = name;
    if (industry_id !== undefined) updateData.industry_id = industry_id || null;
    if (is_public !== undefined) updateData.is_public = is_public;

    const { data: source, error } = await supabase
      .from("rss_sources")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ source });
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
    await requireAdmin();
    const { id } = await params;
    const supabase = await createClient();

    const { error } = await supabase
      .from("rss_sources")
      .delete()
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

