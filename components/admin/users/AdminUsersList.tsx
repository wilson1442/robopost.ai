"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { UserProfile } from "@/types/database";

interface UserWithDetails extends UserProfile {
  email?: string;
  role?: string;
}

interface AdminUsersListProps {
  initialProfiles: UserProfile[];
}

export default function AdminUsersList({ initialProfiles }: AdminUsersListProps) {
  const [users, setUsers] = useState<UserWithDetails[]>(initialProfiles);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch user details from API
    async function loadUserDetails() {
      try {
        const response = await fetch("/api/admin/users");
        if (response.ok) {
          const data = await response.json();
          setUsers(data.users || []);
        }
      } catch (error) {
        console.error("Failed to load user details:", error);
      } finally {
        setLoading(false);
      }
    }

    loadUserDetails();
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Loading users...</div>;
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 mb-4">No users found</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {users.map((user) => (
        <Link
          key={user.id}
          href={`/admin/users/${user.id}`}
          className="block p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-sm font-medium text-white truncate">
                  {user.email || user.id.slice(0, 8) + "..."}
                </h3>
                {user.role === "admin" && (
                  <span className="text-xs text-purple-400 bg-purple-500/10 px-2 py-1 rounded">
                    Admin
                  </span>
                )}
                {user.industry_preference_locked && (
                  <span className="text-xs text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded">
                    Industry Locked
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400">
                User ID: {user.id}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Created: {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>
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
        </Link>
      ))}
    </div>
  );
}

