import { requireAdmin } from "@/lib/auth/admin";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const { newPassword } = body;

    if (!newPassword) {
      return NextResponse.json(
        { error: "New password is required" },
        { status: 400 }
      );
    }

    // Note: Password reset requires Supabase Admin API
    // Use supabase.auth.admin.updateUserById() with service role client
    return NextResponse.json(
      { error: "Password reset requires Admin API - not implemented" },
      { status: 501 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    );
  }
}

