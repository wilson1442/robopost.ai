import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import AdminSourcesList from "@/components/admin/sources/AdminSourcesList";

export default async function AdminSourcesPage() {
  await requireAdmin();
  const supabase = await createClient();

  // Get all RSS sources
  const { data: sources, error } = await supabase
    .from("rss_sources")
    .select(`
      id,
      url,
      name,
      industry_id,
      is_public,
      created_at,
      updated_at,
      industries (
        id,
        slug,
        name
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[AdminSourcesPage] Error fetching sources:", error);
  }

  // Transform sources to normalize industries (Supabase returns as array)
  const transformedSources = (sources || []).map((source: any) => ({
    ...source,
    industries: Array.isArray(source.industries) 
      ? source.industries[0] || null 
      : source.industries || null,
  }));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Admin: RSS Sources</h1>
          <p className="text-gray-400">
            Manage all RSS sources in the system
          </p>
        </div>
        <div className="flex gap-4">
          <Link
            href="/admin/sources/import"
            className="inline-flex items-center px-4 py-2 bg-white/10 border border-white/20 text-white font-semibold rounded-lg hover:bg-white/20 transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            Import CSV
          </Link>
          <Link
            href="/admin/sources/new"
            className="inline-flex items-center px-4 py-2 bg-gradient-accent text-white font-semibold rounded-lg hover-lift hover-glow shadow-lg shadow-primary-500/50 transition-all"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Source
          </Link>
        </div>
      </div>

      <div className="glass-effect rounded-xl p-6">
        <AdminSourcesList sources={transformedSources} />
      </div>
    </div>
  );
}

