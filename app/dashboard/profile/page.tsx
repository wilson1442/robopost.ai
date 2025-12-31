import { requireAuth } from "@/lib/auth/auth";
import { createClient } from "@/lib/supabase/server";
import ProfileForm from "@/components/dashboard/ProfileForm";

export default async function ProfilePage() {
  const user = await requireAuth();
  const supabase = await createClient();

  // Get user profile
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Profile Settings</h1>
        <p className="text-gray-400">Manage your account information and preferences</p>
      </div>

      <div className="glass-effect rounded-xl p-6">
        <ProfileForm user={user} profile={profile} />
      </div>
    </div>
  );
}

