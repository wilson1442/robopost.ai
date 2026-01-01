"use client";

import Link from "next/link";
import { AgentRun } from "@/types/database";
import { useEffect, useState, useRef } from "react";

interface RunListProps {
  runs: AgentRun[];
}

export default function RunList({ runs: initialRuns }: RunListProps) {
  const [runs, setRuns] = useState<AgentRun[]>(initialRuns);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Poll for updates when there are any pending or processing runs
  useEffect(() => {
    const hasActiveRuns = runs.some(
      (run) => run.status === "pending" || run.status === "processing"
    );

    // Clear any existing interval
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    if (!hasActiveRuns) {
      return;
    }

    pollIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch("/api/runs?limit=50");
        if (!response.ok) {
          console.error("Failed to fetch runs updates");
          return;
        }

        const data = await response.json();
        if (data.runs) {
          setRuns(data.runs);

          // Stop polling if no active runs remain
          const stillHasActiveRuns = data.runs.some(
            (run: AgentRun) =>
              run.status === "pending" || run.status === "processing"
          );
          if (!stillHasActiveRuns && pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
        }
      } catch (error) {
        console.error("Error polling for runs updates:", error);
      }
    }, 5000); // Poll every 5 seconds (less frequent than detail page)

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [runs]);
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 text-green-400";
      case "failed":
        return "bg-red-500/20 text-red-400";
      case "processing":
        return "bg-yellow-500/20 text-yellow-400";
      case "pending":
        return "bg-gray-500/20 text-gray-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  if (runs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 mb-4">No runs yet</p>
        <Link
          href="/runs/new"
          className="inline-flex items-center px-4 py-2 bg-gradient-accent text-white font-semibold rounded-lg hover-lift hover-glow shadow-lg shadow-primary-500/50 transition-all"
        >
          Trigger Your First Run
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {runs.map((run) => (
        <Link
          key={run.id}
          href={`/runs/${run.id}`}
          className="block p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-primary-500/50 transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1">
              <div className={`w-2 h-2 rounded-full ${
                run.status === "completed" ? "bg-green-400" :
                run.status === "failed" ? "bg-red-400" :
                run.status === "processing" ? "bg-yellow-400" :
                "bg-gray-400"
              }`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  Run {run.id.slice(0, 8)}...
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(run.triggered_at).toLocaleString()}
                  {run.completed_at && ` • Completed: ${new Date(run.completed_at).toLocaleString()}`}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(run.status)}`}>
                {run.status}
              </span>
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

