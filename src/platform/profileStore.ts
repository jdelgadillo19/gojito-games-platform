import { supabase } from "../supabase/client";

export type UserProfileDoc = {
  uid: string;
  displayName: string;
  email: string | null;
  tier: string;
};

function normalizeTier(tier: string | null | undefined): string {
  const value = String(tier || "").toLowerCase();
  if (value === "guac" || value === "gold" || value === "paid") return "guac";
  return "beef";
}

export async function getUserProfile(uid: string): Promise<UserProfileDoc | null> {
  if (!supabase || !uid) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, email, tier")
    .eq("id", uid)
    .maybeSingle();
  if (error || !data) return null;
  return {
    uid: data.id,
    displayName: data.display_name || "Player",
    email: data.email ?? null,
    tier: normalizeTier(data.tier),
  };
}

export { normalizeTier };
