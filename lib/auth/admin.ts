import { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { getUser } from "./auth";

/**
 * Check if a user has admin role
 * Checks both user_metadata and app_metadata for role = 'admin'
 */
export function isAdmin(user: User | null): boolean {
  if (!user) return false;
  
  const role = user.user_metadata?.role || user.app_metadata?.role;
  return role === "admin";
}

/**
 * Require admin role, redirect if not admin
 * Throws redirect if user is not authenticated or not admin
 */
export async function requireAdmin() {
  const user = await getUser();
  
  if (!user) {
    redirect("/sign-in");
  }
  
  if (!isAdmin(user)) {
    redirect("/dashboard");
  }
  
  return user;
}

/**
 * Get user and verify admin role
 * Returns user if admin, throws redirect otherwise
 */
export async function getAdminUser() {
  return requireAdmin();
}

