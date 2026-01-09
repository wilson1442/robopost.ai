import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import AdminUsersList from "@/components/admin/users/AdminUsersList";

export default async function AdminUsersPage() {
  await requireAdmin();
  const supabase = await createClient();

  // Get all users (using admin client to access auth.users)
  // Note: This requires service role or admin access
  // For now, we'll get users from user_profiles and fetch auth data separately
  const { data: profiles, error } = await supabase
    .from("user_profiles")
    .select("id, created_at, updated_at, industry_preference_id, industry_preference_locked")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[AdminUsersPage] Error fetching users:", error);
  }

  // Note: In production, you'd want to join with auth.users or use admin API
  // For now, we'll display what we have and fetch email/role via API

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Admin: Users</h1>
        <p className="text-gray-400">
          Manage all users in the system
        </p>
      </div>

      <div className="glass-effect rounded-xl p-6">
        <AdminUsersList initialProfiles={profiles || []} />
      </div>
    </div>
  );
}

