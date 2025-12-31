import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/auth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Get user's sources with RSS source details
    const { data: userSources, error } = await supabase
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
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform the data to flatten the structure
    const sources = userSources?.map((us) => ({
      id: us.id,
      url: us.rss_source.url,
      name: us.custom_name || us.rss_source.name,
      originalName: us.rss_source.name,
      isActive: us.is_active,
      industryId: us.rss_source.industry_id,
      industry: us.rss_source.industry,
      createdAt: us.created_at,
      rssSourceId: us.rss_source.id,
    }));

    return NextResponse.json({ sources: sources || [] });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch sources" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    const body = await request.json();
    const { url, name, industryId } = body;

    // Validate URL
    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }

    // Check if RSS source already exists
    const { data: existingSource, error: checkError } = await supabase
      .from("rss_sources")
      .select("id, name")
      .eq("url", url)
      .single();

    let rssSourceId: string;

    if (existingSource) {
      // Use existing source
      rssSourceId = existingSource.id;
    } else {
      // Create new RSS source
      const sourceName = name || new URL(url).hostname.replace("www.", "");
      const { data: newSource, error: createError } = await supabase
        .from("rss_sources")
        .insert({
          url,
          name: sourceName,
          industry_id: industryId || null,
          is_public: false,
        })
        .select("id")
        .single();

      if (createError) {
        return NextResponse.json(
          { error: createError.message },
          { status: 500 }
        );
      }

      rssSourceId = newSource.id;
    }

    // Check if user already has this source
    const { data: existingUserSource } = await supabase
      .from("user_sources")
      .select("id")
      .eq("user_id", user.id)
      .eq("rss_source_id", rssSourceId)
      .single();

    if (existingUserSource) {
      // Reactivate if it was deactivated
      const { data: updated, error: updateError } = await supabase
        .from("user_sources")
        .update({
          is_active: true,
          custom_name: name || null,
        })
        .eq("id", existingUserSource.id)
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

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message },
          { status: 500 }
        );
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
    }

    // Create user_source association
    const { data: userSource, error: linkError } = await supabase
      .from("user_sources")
      .insert({
        user_id: user.id,
        rss_source_id: rssSourceId,
        custom_name: name || null,
        is_active: true,
      })
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

    if (linkError) {
      return NextResponse.json(
        { error: linkError.message },
        { status: 500 }
      );
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
      { error: "Failed to create source" },
      { status: 500 }
    );
  }
}

