"use client";

import { useState, useEffect } from "react";
import { UserSocialAccount } from "@/types/database";

const PLATFORMS = [
  { id: "facebook", name: "Facebook", icon: "📘" },
  { id: "twitter", name: "Twitter", icon: "🐦" },
  { id: "linkedin", name: "LinkedIn", icon: "💼" },
  { id: "instagram", name: "Instagram", icon: "📷" },
  { id: "youtube", name: "YouTube", icon: "▶️" },
  { id: "tiktok", name: "TikTok", icon: "🎵" },
  { id: "pinterest", name: "Pinterest", icon: "📌" },
  { id: "reddit", name: "Reddit", icon: "🤖" },
] as const;

export default function SocialAccountsSection() {
  const [accounts, setAccounts] = useState<UserSocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const response = await fetch("/api/users/social-accounts");
      const data = await response.json();
      if (response.ok) {
        setAccounts(data.accounts || []);
      } else {
        setError(data.error || "Failed to load social accounts");
      }
    } catch (err) {
      setError("Failed to load social accounts");
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (platform: string) => {
    try {
      const response = await fetch(`/api/users/social-accounts/${platform}/connect`, {
        method: "POST",
      });
      const data = await response.json();
      
      if (response.ok && data.authUrl) {
        // Redirect to OAuth provider
        window.location.href = data.authUrl;
      } else {
        setError(data.error || "Failed to initiate connection");
      }
    } catch (err) {
      setError("Failed to connect account");
    }
  };

  const handleDisconnect = async (platform: string) => {
    if (!confirm(`Are you sure you want to disconnect ${platform}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/users/social-accounts/${platform}`, {
        method: "DELETE",
      });

      if (response.ok) {
        loadAccounts();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to disconnect account");
      }
    } catch (err) {
      setError("Failed to disconnect account");
    }
  };

  const getAccountForPlatform = (platform: string) => {
    return accounts.find((acc) => acc.platform === platform);
  };

  if (loading) {
    return (
      <div className="pt-6 border-t border-white/10">
        <p className="text-sm text-gray-400">Loading social accounts...</p>
      </div>
    );
  }

  return (
    <div className="pt-6 border-t border-white/10">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white mb-2">Social Accounts</h3>
        <p className="text-sm text-gray-400">
          Connect your social media accounts to enable direct posting
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {PLATFORMS.map((platform) => {
          const account = getAccountForPlatform(platform.id);
          const isConnected = account && account.is_active;

          return (
            <div
              key={platform.id}
              className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{platform.icon}</span>
                <div>
                  <p className="text-white font-medium">{platform.name}</p>
                  {isConnected && account?.account_url && (
                    <p className="text-xs text-gray-400">{account.account_url}</p>
                  )}
                </div>
              </div>

              {isConnected ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded">
                    Connected
                  </span>
                  <button
                    onClick={() => handleDisconnect(platform.id)}
                    className="text-sm text-red-400 hover:text-red-300 transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleConnect(platform.id)}
                  className="px-4 py-2 bg-white/10 border border-white/20 text-white text-sm font-medium rounded-lg hover:bg-white/20 transition-colors"
                >
                  Connect
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

