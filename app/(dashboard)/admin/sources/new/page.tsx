import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import AdminSourceForm from "@/components/admin/sources/AdminSourceForm";

export default async function AdminNewSourcePage() {
  await requireAdmin();
  const supabase = await createClient();

  // Get industries for dropdown
  const { data: industries } = await supabase
    .from("industries")
    .select("id, slug, name")
    .order("name", { ascending: true });

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">New RSS Source</h1>
        <p className="text-gray-400">Create a new RSS source</p>
      </div>

      <div className="glass-effect rounded-xl p-6">
        <AdminSourceForm industries={industries || []} />
      </div>
    </div>
  );
}

