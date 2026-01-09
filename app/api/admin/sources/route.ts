import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const { data: sources, error } = await supabase
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
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform sources to normalize industries (Supabase returns as array)
    const transformedSources = (sources || []).map((source: any) => ({
      ...source,
      industries: Array.isArray(source.industries) 
        ? source.industries[0] || null 
        : source.industries || null,
    }));

    return NextResponse.json({ sources: transformedSources });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch sources" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const body = await request.json();
    const { url, name, industry_id, is_public } = body;

    if (!url || !name) {
      return NextResponse.json(
        { error: "URL and name are required" },
        { status: 400 }
      );
    }

    const { data: source, error } = await supabase
      .from("rss_sources")
      .insert({
        url,
        name,
        industry_id: industry_id || null,
        is_public: is_public || false,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ source });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create source" },
      { status: 500 }
    );
  }
}

