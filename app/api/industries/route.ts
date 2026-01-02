import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: industries, error } = await supabase
      .from("industries")
      .select("id, slug, name, description")
      .order("name", { ascending: true });

    if (error) {
      console.error("[Industries API] Database error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("[Industries API] Returning industries:", industries?.length || 0);
    return NextResponse.json({ industries: industries || [] });
  } catch (error) {
    console.error("[Industries API] Unexpected error:", error);
    return NextResponse.json(
      { error: "Failed to fetch industries" },
      { status: 500 }
    );
  }
}

