"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Industry } from "@/types/database";

interface IndustrySelectionModalProps {
  onSelect: (industryId: string) => Promise<void>;
}

export default function IndustrySelectionModal({ onSelect }: IndustrySelectionModalProps) {
  const router = useRouter();
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [selectedIndustry, setSelectedIndustry] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch industries
    fetch("/api/industries")
      .then((res) => res.json())
      .then((data) => {
        if (data.industries) {
          setIndustries(data.industries);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch industries:", err);
        setError("Failed to load industries. Please refresh the page.");
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedIndustry) {
      setError("Please select an industry");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onSelect(selectedIndustry);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save industry preference");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="glass-effect rounded-xl p-8 max-w-md w-full mx-4">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Select Your Industry</h2>
          <p className="text-gray-400 text-sm">
            Please select your primary industry to continue. This selection cannot be changed later.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="industry_select"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Industry
            </label>
            <select
              id="industry_select"
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            >
              <option value="">Select an industry...</option>
              {industries.map((industry) => (
                <option key={industry.id} value={industry.id}>
                  {industry.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={loading || !selectedIndustry}
              className="px-6 py-3 bg-gradient-accent text-white font-semibold rounded-lg hover-lift hover-glow shadow-lg shadow-primary-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? "Saving..." : "Continue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

