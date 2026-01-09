import { requireAdmin } from "@/lib/auth/admin";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const { role } = body;

    if (!role || !["admin", "user"].includes(role)) {
      return NextResponse.json(
        { error: "Role must be 'admin' or 'user'" },
        { status: 400 }
      );
    }

    // Note: Role update requires Supabase Admin API
    // Use supabase.auth.admin.updateUserById() with app_metadata or user_metadata
    return NextResponse.json(
      { error: "Role update requires Admin API - not implemented" },
      { status: 501 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update role" },
      { status: 500 }
    );
  }
}

