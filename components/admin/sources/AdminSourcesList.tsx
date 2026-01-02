"use client";

import { useState } from "react";
import Link from "next/link";
import { RssSource, Industry } from "@/types/database";

interface SourceWithIndustry extends RssSource {
  industries?: Industry | null;
}

interface AdminSourcesListProps {
  sources: SourceWithIndustry[];
}

export default function AdminSourcesList({ sources }: AdminSourcesListProps) {
  const [sourcesList, setSourcesList] = useState(sources);
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this source? This action cannot be undone.")) {
      return;
    }

    setLoading((prev) => ({ ...prev, [id]: true }));

    try {
      const response = await fetch(`/api/admin/sources/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSourcesList((prev) => prev.filter((s) => s.id !== id));
      } else {
        const data = await response.json();
        alert(data.error || "Failed to delete source");
      }
    } catch (error) {
      alert("Failed to delete source");
    } finally {
      setLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  if (sourcesList.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 mb-4">No sources found</p>
        <Link
          href="/admin/sources/new"
          className="inline-flex items-center px-4 py-2 bg-gradient-accent text-white font-semibold rounded-lg hover-lift hover-glow shadow-lg shadow-primary-500/50 transition-all"
        >
          Create First Source
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sourcesList.map((source) => (
        <div
          key={source.id}
          className="p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-sm font-medium text-white truncate">
                  {source.name}
                </h3>
                {source.is_public && (
                  <span className="text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded">
                    Public
                  </span>
                )}
                {source.industries && (
                  <span className="text-xs text-gray-400 bg-white/5 px-2 py-1 rounded">
                    {source.industries.name}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 truncate">{source.url}</p>
              <p className="text-xs text-gray-500 mt-1">
                Created: {new Date(source.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <Link
                href={`/admin/sources/${source.id}/edit`}
                className="px-3 py-1.5 text-sm bg-white/10 border border-white/20 text-white rounded-lg hover:bg-white/20 transition-colors"
              >
                Edit
              </Link>
              <button
                onClick={() => handleDelete(source.id)}
                disabled={loading[source.id]}
                className="px-3 py-1.5 text-sm bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-50"
              >
                {loading[source.id] ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

