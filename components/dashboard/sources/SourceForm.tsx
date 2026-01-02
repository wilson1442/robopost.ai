"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Industry, SourceFormData, SourceWithDetails } from "@/types/database";

interface SourceFormProps {
  source?: Pick<SourceWithDetails, "id" | "url" | "name" | "isActive" | "industryId"> | null;
  onSubmit: (data: SourceFormData) => Promise<void>;
  onCancel?: () => void;
}

export default function SourceForm({ source, onSubmit, onCancel }: SourceFormProps) {
  const router = useRouter();
  const [url, setUrl] = useState(source?.url || "");
  const [name, setName] = useState(source?.name || "");
  const [industryId, setIndustryId] = useState<string>(source?.industryId || "");
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchingIndustries, setFetchingIndustries] = useState(true);

  // Fetch industries on mount
  useEffect(() => {
    async function fetchIndustries() {
      try {
        const response = await fetch("/api/industries");
        const data = await response.json();
        if (response.ok) {
          setIndustries(data.industries || []);
          console.log("[SourceForm] Loaded industries:", data.industries?.length || 0);
        } else {
          console.error("[SourceForm] Industries API error:", data.error);
          setError(`Failed to load industries: ${data.error || "Unknown error"}`);
        }
      } catch (err) {
        console.error("[SourceForm] Failed to fetch industries:", err);
        setError("Failed to load industries. Please refresh the page.");
      } finally {
        setFetchingIndustries(false);
      }
    }
    fetchIndustries();
  }, []);

  // Auto-fill name from URL when URL changes (only if creating new source)
  useEffect(() => {
    if (!source && url) {
      try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname.replace("www.", "");
        if (!name) {
          setName(hostname);
        }
      } catch {
        // Invalid URL, ignore
      }
    }
  }, [url, source, name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await onSubmit({
        url,
        name: name || undefined,
        industryId: industryId || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.back();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="url" className="block text-sm font-medium text-gray-300 mb-2">
          RSS Feed URL <span className="text-red-400">*</span>
        </label>
        <input
          id="url"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/feed.xml"
          required
          disabled={!!source}
          className={`w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
            source ? "cursor-not-allowed opacity-60" : ""
          }`}
        />
        {source && (
          <p className="mt-1 text-xs text-gray-500">
            URL cannot be changed. Create a new source to use a different URL.
          </p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Enter the full URL to an RSS or Atom feed.
        </p>
      </div>

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
          Custom Name (Optional)
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Custom Feed Name"
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        <p className="mt-1 text-xs text-gray-500">
          Give this source a custom name. If left empty, the feed name will be used.
        </p>
      </div>

      <div>
        <label htmlFor="industry" className="block text-sm font-medium text-gray-300 mb-2">
          Industry (Optional)
        </label>
        <select
          id="industry"
          value={industryId}
          onChange={(e) => setIndustryId(e.target.value)}
          disabled={fetchingIndustries}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed appearance-none"
        >
          <option value="" className="bg-gray-900 text-gray-100">
            Select an industry...
          </option>
          {industries.map((industry) => (
            <option 
              key={industry.id} 
              value={industry.id}
              className="bg-gray-900 text-gray-100"
            >
              {industry.name}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-500">
          Categorize this source by industry for better organization.
        </p>
      </div>

      <div className="flex justify-end space-x-4 pt-4 border-t border-white/10">
        <button
          type="button"
          onClick={handleCancel}
          className="px-6 py-3 bg-white/5 border border-white/10 text-gray-300 font-semibold rounded-lg hover:bg-white/10 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !url}
          className="px-6 py-3 bg-gradient-accent text-white font-semibold rounded-lg hover-lift hover-glow shadow-lg shadow-primary-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? "Saving..." : source ? "Update Source" : "Add Source"}
        </button>
      </div>
    </form>
  );
}

