import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Read CSV file
    const text = await file.text();
    const lines = text.split("\n").filter((line) => line.trim());

    if (lines.length < 2) {
      return NextResponse.json(
        { error: "CSV file must have at least a header and one data row" },
        { status: 400 }
      );
    }

    // Parse header
    const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const urlIndex = header.indexOf("url");
    const nameIndex = header.indexOf("name");
    const industryIndex = header.indexOf("industry_slug");

    if (urlIndex === -1 || nameIndex === -1) {
      return NextResponse.json(
        { error: "CSV must have 'url' and 'name' columns" },
        { status: 400 }
      );
    }

    // Get all industries for slug lookup
    const { data: industries } = await supabase
      .from("industries")
      .select("id, slug");

    const industryMap = new Map(
      industries?.map((ind) => [ind.slug, ind.id]) || []
    );

    // Parse data rows
    const sources = [];
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());
      const url = values[urlIndex];
      const name = values[nameIndex];
      const industrySlug = industryIndex !== -1 ? values[industryIndex] : null;

      if (!url || !name) {
        errors.push(`Row ${i + 1}: Missing url or name`);
        continue;
      }

      // Validate URL format
      try {
        new URL(url);
      } catch {
        errors.push(`Row ${i + 1}: Invalid URL format: ${url}`);
        continue;
      }

      const industryId = industrySlug && industryMap.has(industrySlug)
        ? industryMap.get(industrySlug)
        : null;

      if (industrySlug && !industryId) {
        errors.push(`Row ${i + 1}: Unknown industry slug: ${industrySlug}`);
      }

      sources.push({
        url,
        name,
        industry_id: industryId,
        is_public: false,
      });
    }

    if (sources.length === 0) {
      return NextResponse.json(
        { error: "No valid sources to import", errors },
        { status: 400 }
      );
    }

    // Bulk insert
    const { data: insertedSources, error: insertError } = await supabase
      .from("rss_sources")
      .insert(sources)
      .select();

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message, errors },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      imported: insertedSources?.length || 0,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to import sources" },
      { status: 500 }
    );
  }
}

