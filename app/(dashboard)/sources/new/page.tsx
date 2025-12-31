"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SourceForm from "@/components/dashboard/sources/SourceForm";

export default function NewSourcePage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (data: {
    url: string;
    name?: string;
    industryId?: string;
  }) => {
    setSubmitting(true);

    try {
      const response = await fetch("/api/sources", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: data.url,
          name: data.name,
          industryId: data.industryId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create source");
      }

      router.push("/sources");
      router.refresh();
    } catch (error) {
      setSubmitting(false);
      throw error;
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Add RSS Source</h1>
        <p className="text-gray-400">
          Add a new RSS feed source to your content automation pipeline
        </p>
      </div>

      <div className="glass-effect rounded-xl p-6">
        <SourceForm onSubmit={handleSubmit} />
      </div>
    </div>
  );
}

