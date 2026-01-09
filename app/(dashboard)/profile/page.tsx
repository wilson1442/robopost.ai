"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import ProfileForm from "@/components/dashboard/ProfileForm";
import IndustrySelectionModal from "@/components/auth/IndustrySelectionModal";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { UserProfile } from "@/types/database";

export default function ProfilePage() {
  const searchParams = useSearchParams();
  const requireIndustry = searchParams.get("require_industry") === "true";
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        window.location.href = "/sign-in";
        return;
      }

      setUser(authUser);

      // Get user profile
      const { data: userProfile } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();

      setProfile(userProfile);

      // Show modal if industry is required and not set
      if (requireIndustry && (!userProfile?.industry_preference_id)) {
        setShowModal(true);
      }

      setLoading(false);
    }

    loadData();
  }, [requireIndustry]);

  const handleIndustrySelect = async (industryId: string) => {
    const supabase = createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      throw new Error("Not authenticated");
    }

    // Get existing profile to check if this is first time setting
    const { data: existingProfile } = await supabase
      .from("user_profiles")
      .select("industry_preference_id, industry_preference_locked")
      .eq("id", authUser.id)
      .single();

    const isFirstTime = !existingProfile?.industry_preference_id;

    const { error } = await supabase
      .from("user_profiles")
      .upsert(
        {
          id: authUser.id,
          industry_preference_id: industryId,
          industry_preference_locked: isFirstTime ? true : existingProfile?.industry_preference_locked || false,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "id",
        }
      );

    if (error) {
      throw new Error(error.message);
    }

    // Refresh profile data
    const { data: updatedProfile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", authUser.id)
      .single();

    setProfile(updatedProfile);
    setShowModal(false);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="glass-effect rounded-xl p-6">
          <div className="text-center text-gray-400">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Profile Settings</h1>
        <p className="text-gray-400">Manage your account information and preferences</p>
      </div>

      <div className="glass-effect rounded-xl p-6">
        <ProfileForm user={user} profile={profile} />
      </div>

      {showModal && (
        <IndustrySelectionModal onSelect={handleIndustrySelect} />
      )}
    </div>
  );
}
