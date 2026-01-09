import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import AdminSourceForm from "@/components/admin/sources/AdminSourceForm";
import { notFound } from "next/navigation";

export default async function AdminEditSourcePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  // Get source
  const { data: source, error } = await supabase
    .from("rss_sources")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !source) {
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
        <h1 className="text-3xl font-bold text-white mb-2">Edit RSS Source</h1>
        <p className="text-gray-400">Update source details</p>
      </div>

      <div className="glass-effect rounded-xl p-6">
        <AdminSourceForm source={source} industries={industries || []} />
      </div>
    </div>
  );
}

