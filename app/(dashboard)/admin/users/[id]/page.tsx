import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import AdminUserForm from "@/components/admin/users/AdminUserForm";
import { notFound } from "next/navigation";

export default async function AdminUserEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  // Get user profile
  const { data: profile, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !profile) {
    notFound();
  }

  // Get industries for dropdown
  const { data: industries } = await supabase
    .from("industries")
    .select("id, slug, name")
    .order("name", { ascending: true });

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Edit User</h1>
        <p className="text-gray-400">Manage user settings and preferences</p>
      </div>

      <div className="glass-effect rounded-xl p-6">
        <AdminUserForm user={profile} industries={industries || []} />
      </div>
    </div>
  );
}

