"use client";

import { useRouter } from "next/navigation";
import SourceList from "./SourceList";
import { SourceWithDetails } from "@/types/database";

interface SourceListClientProps {
  sources: SourceWithDetails[];
}

export default function SourceListClient({ sources }: SourceListClientProps) {
  const router = useRouter();

  const handleToggleActive = async (id: string, isActive: boolean) => {
    const response = await fetch(`/api/sources/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        isActive: !isActive,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Failed to update source");
    }

    router.refresh();
  };

  const handleDelete = async (id: string) => {
    const response = await fetch(`/api/sources/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Failed to delete source");
    }

    router.refresh();
  };

  return (
    <SourceList
      sources={sources}
      onToggleActive={handleToggleActive}
      onDelete={handleDelete}
    />
  );
}

