import { requireAuth } from "@/lib/auth/auth";
import { createClient } from "@/lib/supabase/server";
import SourceListClient from "@/components/dashboard/sources/SourceListClient";
import Link from "next/link";

export default async function SourcesPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  // Get user's sources with RSS source details
  const { data: userSources, error: sourcesError } = await supabase
    .from("user_sources")
    .select(
      `
      id,
      custom_name,
      is_active,
      created_at,
      rss_sources (
        id,
        url,
        name,
        industry_id,
        industries (
          id,
          slug,
          name
        )
      )
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (sourcesError) {
    console.error("[SourcesPage] Error fetching sources:", sourcesError);
  }

  // Transform the data to flatten the structure
  const sources =
    userSources?.map((us: any) => {
      const rssSource = us.rss_sources;
      const industry = rssSource?.industries;
      
      // Log if rssSource is missing
      if (!rssSource) {
        console.warn("[SourcesPage] Missing rss_source for user_source:", us.id);
      }
      
      return {
        id: us.id,
        url: rssSource?.url || "",
        name: us.custom_name || rssSource?.name || "",
        originalName: rssSource?.name || "",
        isActive: us.is_active,
        industryId: rssSource?.industry_id || null,
        industry: industry ? {
          id: industry.id,
          slug: industry.slug,
          name: industry.name,
        } : null,
        createdAt: us.created_at,
        rssSourceId: rssSource?.id || "",
      };
    }).filter((s: any) => {
      // More lenient filtering - only filter if URL is truly missing
      const hasUrl = s.url && s.url.trim() !== "";
      if (!hasUrl) {
        console.warn("[SourcesPage] Filtering out source without URL:", s.id);
      }
      return hasUrl;
    }) || [];

  console.log("[SourcesPage] Loaded sources:", {
    userSourcesCount: userSources?.length || 0,
    transformedSourcesCount: sources.length,
    sources: sources.map(s => ({ id: s.id, url: s.url, name: s.name }))
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">RSS Sources</h1>
          <p className="text-gray-400">
            Manage your RSS feed sources for content automation
          </p>
        </div>
        <Link
          href="/sources/new"
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
          Add Source
        </Link>
      </div>

      <div className="glass-effect rounded-xl p-6">
        <SourceListClient sources={sources} />
      </div>
    </div>
  );
}

