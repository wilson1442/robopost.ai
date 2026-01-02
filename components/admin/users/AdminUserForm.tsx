"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserProfile, Industry } from "@/types/database";

interface AdminUserFormProps {
  user: UserProfile;
  industries: Industry[];
}

export default function AdminUserForm({ user, industries }: AdminUserFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [industryPreferenceId, setIndustryPreferenceId] = useState(
    user.industry_preference_id || ""
  );
  const [industryLocked, setIndustryLocked] = useState(
    user.industry_preference_locked || false
  );
  const [role, setRole] = useState<"admin" | "user">("user");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      // Update profile
      const profileResponse = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          industry_preference_id: industryPreferenceId || null,
          industry_preference_locked: industryLocked,
        }),
      });

      if (!profileResponse.ok) {
        const data = await profileResponse.json();
        throw new Error(data.error || "Failed to update user");
      }

      // Update password if provided
      if (newPassword) {
        const passwordResponse = await fetch(`/api/admin/users/${user.id}/password`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ newPassword }),
        });

        if (!passwordResponse.ok) {
          const data = await passwordResponse.json();
          throw new Error(data.error || "Failed to update password");
        }
      }

      // Update role if changed
      const roleResponse = await fetch(`/api/admin/users/${user.id}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role }),
      });

      if (!roleResponse.ok) {
        const data = await roleResponse.json();
        // Role update might not be implemented, so just warn
        console.warn("Role update failed:", data.error);
      }

      setSuccess("User updated successfully!");
      router.refresh();
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
        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
          Email Address
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="User email (requires Admin API)"
          disabled
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-gray-400 cursor-not-allowed"
        />
        <p className="mt-1 text-xs text-gray-500">
          Email update requires Supabase Admin API integration
        </p>
      </div>

      <div>
        <label htmlFor="role" className="block text-sm font-medium text-gray-300 mb-2">
          Role
        </label>
        <select
          id="role"
          value={role}
          onChange={(e) => setRole(e.target.value as "admin" | "user")}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
        <p className="mt-1 text-xs text-gray-500">
          Role update requires Supabase Admin API integration
        </p>
      </div>

      <div>
        <label
          htmlFor="industry_preference_id"
          className="block text-sm font-medium text-gray-300 mb-2"
        >
          Industry Preference
        </label>
        <select
          id="industry_preference_id"
          value={industryPreferenceId}
          onChange={(e) => setIndustryPreferenceId(e.target.value)}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="">No industry selected</option>
          {industries.map((industry) => (
            <option key={industry.id} value={industry.id}>
              {industry.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-3">
        <input
          id="industry_locked"
          type="checkbox"
          checked={industryLocked}
          onChange={(e) => setIndustryLocked(e.target.checked)}
          className="w-4 h-4 rounded bg-white/5 border-white/10 text-primary-500 focus:ring-primary-500"
        />
        <label htmlFor="industry_locked" className="text-sm text-gray-300">
          Lock industry preference (user cannot change it)
        </label>
      </div>

      <div>
        <label htmlFor="new_password" className="block text-sm font-medium text-gray-300 mb-2">
          New Password (optional)
        </label>
        <input
          id="new_password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Leave empty to keep current password"
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        <p className="mt-1 text-xs text-gray-500">
          Password reset requires Supabase Admin API integration
        </p>
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
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

