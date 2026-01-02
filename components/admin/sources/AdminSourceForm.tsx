"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RssSource, Industry } from "@/types/database";

interface AdminSourceFormProps {
  source?: RssSource;
  industries: Industry[];
}

export default function AdminSourceForm({ source, industries }: AdminSourceFormProps) {
  const router = useRouter();
  const [url, setUrl] = useState(source?.url || "");
  const [name, setName] = useState(source?.name || "");
  const [industryId, setIndustryId] = useState(source?.industry_id || "");
  const [isPublic, setIsPublic] = useState(source?.is_public || false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const urlToCall = source
        ? `/api/admin/sources/${source.id}`
        : "/api/admin/sources";
      const method = source ? "PATCH" : "POST";

      const response = await fetch(urlToCall, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
          name,
          industry_id: industryId || null,
          is_public: isPublic,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save source");
      }

      setSuccess(source ? "Source updated successfully!" : "Source created successfully!");
      setTimeout(() => {
        router.push("/admin/sources");
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-500/10 border border-green-500/50 rounded-lg text-green-400 text-sm">
          {success}
        </div>
      )}

      <div>
        <label htmlFor="url" className="block text-sm font-medium text-gray-300 mb-2">
          RSS Feed URL *
        </label>
        <input
          id="url"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="https://example.com/feed.xml"
        />
      </div>

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
          Source Name *
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="Example Blog"
        />
      </div>

      <div>
        <label
          htmlFor="industry_id"
          className="block text-sm font-medium text-gray-300 mb-2"
        >
          Industry
        </label>
        <select
          id="industry_id"
          value={industryId}
          onChange={(e) => setIndustryId(e.target.value)}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="">No industry</option>
          {industries.map((industry) => (
            <option key={industry.id} value={industry.id}>
              {industry.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-3">
        <input
          id="is_public"
          type="checkbox"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
          className="w-4 h-4 rounded bg-white/5 border-white/10 text-primary-500 focus:ring-primary-500"
        />
        <label htmlFor="is_public" className="text-sm text-gray-300">
          Make this source public (available to all users)
        </label>
      </div>

      <div className="flex justify-end space-x-4 pt-4 border-t border-white/10">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 bg-white/5 border border-white/10 text-gray-300 font-semibold rounded-lg hover:bg-white/10 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-gradient-accent text-white font-semibold rounded-lg hover-lift hover-glow shadow-lg shadow-primary-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? "Saving..." : source ? "Update Source" : "Create Source"}
        </button>
      </div>
    </form>
  );
}

