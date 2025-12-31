"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import SourceForm from "@/components/dashboard/sources/SourceForm";

interface Source {
  id: string;
  url: string;
  name: string;
  isActive: boolean;
  industryId?: string | null;
}

export default function EditSourcePage() {
  const router = useRouter();
  const params = useParams();
  const sourceId = params.id as string;

  const [source, setSource] = useState<Source | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchSource() {
      try {
        const response = await fetch(`/api/sources/${sourceId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch source");
        }

        setSource({
          id: data.source.id,
          url: data.source.url,
          name: data.source.name,
          isActive: data.source.isActive,
          industryId: data.source.industryId,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load source");
      } finally {
        setLoading(false);
      }
    }

    if (sourceId) {
      fetchSource();
    }
  }, [sourceId]);

  const handleSubmit = async (data: {
    url: string;
    name?: string;
    industryId?: string;
  }) => {
    if (!source) return;

    setSubmitting(true);

    try {
      const response = await fetch(`/api/sources/${sourceId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          isActive: source.isActive,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update source");
      }

      router.push("/sources");
      router.refresh();
    } catch (error) {
      setSubmitting(false);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Edit Source</h1>
          <p className="text-gray-400">Loading source details...</p>
        </div>
        <div className="glass-effect rounded-xl p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-white/10 rounded w-3/4"></div>
            <div className="h-10 bg-white/10 rounded"></div>
            <div className="h-10 bg-white/10 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !source) {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Edit Source</h1>
        </div>
        <div className="glass-effect rounded-xl p-6">
          <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400">
            {error || "Source not found"}
          </div>
          <button
            onClick={() => router.push("/sources")}
            className="mt-4 px-4 py-2 bg-white/5 border border-white/10 text-gray-300 rounded-lg hover:bg-white/10 transition-colors"
          >
            Back to Sources
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Edit Source</h1>
        <p className="text-gray-400">
          Update your RSS source configuration
        </p>
      </div>

      <div className="glass-effect rounded-xl p-6">
        <SourceForm source={source} onSubmit={handleSubmit} />
      </div>
    </div>
  );
}

