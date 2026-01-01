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
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform the data to flatten the structure
    const sources = userSources?.map((us: any) => {
      const rssSource = Array.isArray(us.rss_sources) 
        ? us.rss_sources[0] 
        : us.rss_sources;
      const industry = rssSource?.industries 
        ? (Array.isArray(rssSource.industries) ? rssSource.industries[0] : rssSource.industries)
        : null;
      
      return {
        id: us.id,
        url: rssSource?.url || "",
        name: us.custom_name || rssSource?.name || "",
        originalName: rssSource?.name || "",
        isActive: us.is_active,
        industryId: rssSource?.industry_id || null,
        industry: industry ? {
          id: industry.id,
          slug: industry.slug,
          name: industry.name,
          created_at: industry.created_at,
        } : null,
        createdAt: us.created_at,
        rssSourceId: rssSource?.id || "",
      };
    }).filter((s: any) => s.url);

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
          rss_sources (
            id,
            url,
            name,
            industry_id,
            industries (
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

    if (linkError) {
      return NextResponse.json(
        { error: linkError.message },
        { status: 500 }
      );
    }

    if (!userSource) {
      return NextResponse.json({ error: "Failed to create source" }, { status: 500 });
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
      { error: "Failed to create source" },
      { status: 500 }
    );
  }
}

