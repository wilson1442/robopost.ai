"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Industry, SourceWithDetails } from "@/types/database";
import { RunTriggerRequest } from "@/types/webhooks";

export default function RunTriggerForm() {
  const router = useRouter();
  const [sources, setSources] = useState<SourceWithDetails[]>([]);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [industryId, setIndustryId] = useState<string>("");
  const [promptInstructions, setPromptInstructions] = useState<string>("");
  const [outputFormats, setOutputFormats] = useState<Array<"blog" | "social" | "email" | "webhook">>([]);
  const [destinationType, setDestinationType] = useState<"webhook" | "social" | "email" | "none">("none");
  const [webhookUrl, setWebhookUrl] = useState<string>("");
  const [socialPlatforms, setSocialPlatforms] = useState<string[]>([]);
  const [emailRecipients, setEmailRecipients] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchingData, setFetchingData] = useState(true);

  // Fetch sources and industries on mount
  useEffect(() => {
    async function fetchData() {
      try {
        const [sourcesRes, industriesRes] = await Promise.all([
          fetch("/api/sources"),
          fetch("/api/industries"),
        ]);

        const sourcesData = await sourcesRes.json();
        const industriesData = await industriesRes.json();

        if (sourcesRes.ok) {
          const activeSources = (sourcesData.sources || []).filter(
            (s: SourceWithDetails) => s.isActive
          );
          setSources(activeSources);
        }

        if (industriesRes.ok) {
          setIndustries(industriesData.industries || []);
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError("Failed to load data. Please refresh the page.");
      } finally {
        setFetchingData(false);
      }
    }
    fetchData();
  }, []);

  const handleSourceToggle = (sourceId: string) => {
    setSelectedSourceIds((prev) =>
      prev.includes(sourceId)
        ? prev.filter((id) => id !== sourceId)
        : [...prev, sourceId]
    );
  };

  const handleOutputFormatToggle = (format: "blog" | "social" | "email" | "webhook") => {
    setOutputFormats((prev) =>
      prev.includes(format)
        ? prev.filter((f) => f !== format)
        : [...prev, format]
    );
  };

  const handleSocialPlatformToggle = (platform: string) => {
    setSocialPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (selectedSourceIds.length === 0) {
      setError("Please select at least one RSS source");
      return;
    }

    if (outputFormats.length === 0) {
      setError("Please select at least one output format");
      return;
    }

    // Build destination config
    const destination: RunTriggerRequest["destination"] = {
      type: destinationType,
    };

    if (destinationType === "webhook" && webhookUrl) {
      destination.config = { webhookUrl };
    } else if (destinationType === "social" && socialPlatforms.length > 0) {
      destination.config = { socialPlatforms };
    } else if (destinationType === "email" && emailRecipients) {
      const recipients = emailRecipients
        .split(",")
        .map((email) => email.trim())
        .filter((email) => email.length > 0);
      if (recipients.length > 0) {
        destination.config = { emailRecipients: recipients };
      }
    }

    const payload: RunTriggerRequest = {
      sourceIds: selectedSourceIds,
      industryId: industryId || undefined,
      promptInstructions: promptInstructions || undefined,
      outputFormats,
      destination,
    };

    setLoading(true);
    try {
      const response = await fetch("/api/runs/trigger", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to trigger run");
      }

      // Redirect to run details page
      router.push(`/runs/${data.runId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (fetchingData) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* RSS Sources Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          RSS Sources <span className="text-red-400">*</span>
        </label>
        {sources.length === 0 ? (
          <div className="p-4 bg-white/5 border border-white/10 rounded-lg text-gray-400 text-sm">
            No active sources found. Please{" "}
            <a href="/sources/new" className="text-primary-400 hover:text-primary-300 underline">
              add a source
            </a>{" "}
            first.
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {sources.map((source) => (
              <label
                key={source.id}
                className="flex items-center p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedSourceIds.includes(source.id)}
                  onChange={() => handleSourceToggle(source.id)}
                  className="w-4 h-4 text-primary-500 bg-white/5 border-white/20 rounded focus:ring-primary-500 focus:ring-2"
                />
                <div className="ml-3 flex-1">
                  <div className="text-sm font-medium text-white">{source.name}</div>
                  <div className="text-xs text-gray-400 truncate">{source.url}</div>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Industry Selection */}
      <div>
        <label htmlFor="industry" className="block text-sm font-medium text-gray-300 mb-2">
          Industry (Optional)
        </label>
        <select
          id="industry"
          value={industryId}
          onChange={(e) => setIndustryId(e.target.value)}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none"
        >
          <option value="" className="bg-gray-900 text-gray-100">
            Select an industry...
          </option>
          {industries.map((industry) => (
            <option key={industry.id} value={industry.id} className="bg-gray-900 text-gray-100">
              {industry.name}
            </option>
          ))}
        </select>
      </div>

      {/* Prompt Instructions */}
      <div>
        <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-2">
          Custom Prompt Instructions (Optional)
        </label>
        <textarea
          id="prompt"
          value={promptInstructions}
          onChange={(e) => setPromptInstructions(e.target.value)}
          rows={4}
          placeholder="Add any specific instructions for content generation..."
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
        />
      </div>

      {/* Output Formats */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Output Formats <span className="text-red-400">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          {(["blog", "social", "email", "webhook"] as const).map((format) => (
            <label
              key={format}
              className="flex items-center p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={outputFormats.includes(format)}
                onChange={() => handleOutputFormatToggle(format)}
                className="w-4 h-4 text-primary-500 bg-white/5 border-white/20 rounded focus:ring-primary-500 focus:ring-2"
              />
              <span className="ml-3 text-sm font-medium text-white capitalize">{format}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Destination */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Destination
        </label>
        <div className="space-y-3">
          {(["none", "webhook", "social", "email"] as const).map((type) => (
            <label
              key={type}
              className="flex items-center p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
            >
              <input
                type="radio"
                name="destination"
                value={type}
                checked={destinationType === type}
                onChange={(e) => setDestinationType(e.target.value as typeof destinationType)}
                className="w-4 h-4 text-primary-500 bg-white/5 border-white/20 focus:ring-primary-500 focus:ring-2"
              />
              <span className="ml-3 text-sm font-medium text-white capitalize">{type}</span>
            </label>
          ))}
        </div>

        {/* Destination-specific fields */}
        {destinationType === "webhook" && (
          <div className="mt-3">
            <input
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://example.com/webhook"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        )}

        {destinationType === "social" && (
          <div className="mt-3 space-y-2">
            {(["twitter", "linkedin", "facebook"] as const).map((platform) => (
              <label
                key={platform}
                className="flex items-center p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={socialPlatforms.includes(platform)}
                  onChange={() => handleSocialPlatformToggle(platform)}
                  className="w-4 h-4 text-primary-500 bg-white/5 border-white/20 rounded focus:ring-primary-500 focus:ring-2"
                />
                <span className="ml-3 text-sm font-medium text-white capitalize">{platform}</span>
              </label>
            ))}
          </div>
        )}

        {destinationType === "email" && (
          <div className="mt-3">
            <input
              type="text"
              value={emailRecipients}
              onChange={(e) => setEmailRecipients(e.target.value)}
              placeholder="email1@example.com, email2@example.com"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">
              Separate multiple emails with commas
            </p>
          </div>
        )}
      </div>

      {/* Submit Button */}
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
          disabled={loading || selectedSourceIds.length === 0 || outputFormats.length === 0}
          className="px-6 py-3 bg-gradient-accent text-white font-semibold rounded-lg hover-lift hover-glow shadow-lg shadow-primary-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? "Triggering..." : "Trigger Run"}
        </button>
      </div>
    </form>
  );
}

