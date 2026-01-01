import { requireAuth } from "@/lib/auth/auth";
import { createClient } from "@/lib/supabase/server";
import RunList from "@/components/dashboard/runs/RunList";
import Link from "next/link";

export default async function RunsPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  // Get user's agent runs
  const { data: runs } = await supabase
    .from("agent_runs")
    .select("id, status, triggered_at, completed_at, error_message, created_at")
    .eq("user_id", user.id)
    .order("triggered_at", { ascending: false })
    .limit(50);

  // Get stats
  const [completedCount, failedCount, pendingCount] = await Promise.all([
    supabase
      .from("agent_runs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "completed"),
    supabase
      .from("agent_runs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "failed"),
    supabase
      .from("agent_runs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .in("status", ["pending", "processing"]),
  ]);

  const totalRuns = runs?.length || 0;
  const completed = completedCount.count || 0;
  const failed = failedCount.count || 0;
  const pending = pendingCount.count || 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Agent Runs</h1>
          <p className="text-gray-400">
            View and manage your content generation runs
          </p>
        </div>
        <Link
          href="/runs/new"
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
          New Run
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-effect rounded-xl p-4">
          <p className="text-sm text-gray-400 mb-1">Total Runs</p>
          <p className="text-2xl font-bold text-white">{totalRuns}</p>
        </div>
        <div className="glass-effect rounded-xl p-4">
          <p className="text-sm text-gray-400 mb-1">Completed</p>
          <p className="text-2xl font-bold text-green-400">{completed}</p>
        </div>
        <div className="glass-effect rounded-xl p-4">
          <p className="text-sm text-gray-400 mb-1">Failed</p>
          <p className="text-2xl font-bold text-red-400">{failed}</p>
        </div>
        <div className="glass-effect rounded-xl p-4">
          <p className="text-sm text-gray-400 mb-1">Pending</p>
          <p className="text-2xl font-bold text-yellow-400">{pending}</p>
        </div>
      </div>

      {/* Runs List */}
      <div className="glass-effect rounded-xl p-6">
        <RunList runs={runs || []} />
      </div>
    </div>
  );
}

