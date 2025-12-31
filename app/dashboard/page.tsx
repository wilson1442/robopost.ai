import { requireAuth } from "@/lib/auth/auth";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function DashboardPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  // Get user stats
  const [sourcesResult, runsResult] = await Promise.all([
    supabase
      .from("user_sources")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_active", true),
    supabase
      .from("agent_runs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
  ]);

  const activeSources = sourcesResult.count || 0;
  const totalRuns = runsResult.count || 0;

  // Get recent runs
  const { data: recentRuns } = await supabase
    .from("agent_runs")
    .select("id, status, triggered_at, completed_at")
    .eq("user_id", user.id)
    .order("triggered_at", { ascending: false })
    .limit(5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Welcome back, {user.email?.split("@")[0]}
        </h1>
        <p className="text-gray-400">Here's what's happening with your content automation</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-effect rounded-xl p-6 hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Active Sources</p>
              <p className="text-3xl font-bold text-white">{activeSources}</p>
            </div>
            <div className="w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-primary-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
          </div>
          <Link
            href="/sources"
            className="mt-4 inline-block text-sm text-primary-400 hover:text-primary-300 transition-colors"
          >
            Manage sources →
          </Link>
        </div>

        <div className="glass-effect rounded-xl p-6 hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Total Runs</p>
              <p className="text-3xl font-bold text-white">{totalRuns}</p>
            </div>
            <div className="w-12 h-12 bg-accent-500/20 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-accent-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="glass-effect rounded-xl p-6 hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Account Status</p>
              <p className="text-3xl font-bold text-green-400">Active</p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="glass-effect rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/sources/new"
            className="p-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 hover:border-primary-500/50 transition-all"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-primary-400"
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
              </div>
              <div>
                <p className="font-medium text-white">Add RSS Source</p>
                <p className="text-sm text-gray-400">Connect a new content source</p>
              </div>
            </div>
          </Link>

          <Link
            href="/dashboard/profile"
            className="p-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 hover:border-primary-500/50 transition-all"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-accent-500/20 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-accent-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium text-white">Update Profile</p>
                <p className="text-sm text-gray-400">Manage your account settings</p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      {recentRuns && recentRuns.length > 0 && (
        <div className="glass-effect rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {recentRuns.map((run) => (
              <div
                key={run.id}
                className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      run.status === "completed"
                        ? "bg-green-400"
                        : run.status === "failed"
                        ? "bg-red-400"
                        : "bg-yellow-400"
                    }`}
                  />
                  <div>
                    <p className="text-sm font-medium text-white">
                      Run {run.id.slice(0, 8)}...
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(run.triggered_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded ${
                    run.status === "completed"
                      ? "bg-green-500/20 text-green-400"
                      : run.status === "failed"
                      ? "bg-red-500/20 text-red-400"
                      : "bg-yellow-500/20 text-yellow-400"
                  }`}
                >
                  {run.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

