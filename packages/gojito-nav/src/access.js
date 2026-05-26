/**
 * User-facing access labels (not Bean/Beef/Guac in primary UI).
 * @param {boolean} isSupabaseConfigured
 * @param {boolean} isAuthenticated
 * @param {string | undefined | null} profileTier
 * @returns {'Guest' | 'Member' | 'Full access'}
 */
export function accessLabel(isSupabaseConfigured, isAuthenticated, profileTier) {
  if (!isSupabaseConfigured || !isAuthenticated) return "Guest";
  const tier = String(profileTier || "").toLowerCase();
  if (tier === "guac" || tier === "gold" || tier === "paid") return "Full access";
  return "Member";
}

/**
 * @param {string | undefined | null} raw
 * @returns {'bean' | 'beef' | 'guac'}
 */
export function normalizeProfileTier(raw) {
  const value = String(raw || "").toLowerCase().trim();
  if (value === "guac" || value === "paid" || value === "gold") return "guac";
  if (value === "beef" || value === "free" || value === "mvp") return "beef";
  return "bean";
}
