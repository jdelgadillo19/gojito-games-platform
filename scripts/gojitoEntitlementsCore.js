/**
 * Browser bundle for portal-entitlements.js (no module loader on static shell).
 * Keep in sync with packages/entitlements/src/core.js
 */
(function (root) {
  function normalizeLegacyTier(raw) {
    var value = String(raw ?? "").toLowerCase().trim();
    if (value === "guac" || value === "paid" || value === "gold") return "guac";
    if (value === "beef" || value === "free" || value === "mvp") return "beef";
    return "beef";
  }

  function parseEntitlementApiResponse(data) {
    if (!data || typeof data !== "object") return null;
    var guacActive = Boolean(data.guacActive);
    var accessTier = guacActive ? "guac" : "beef";
    return {
      userId: typeof data.userId === "string" ? data.userId : "",
      accessTier: accessTier,
      guacActive: guacActive,
      stripeCustomerId:
        typeof data.stripeCustomerId === "string" ? data.stripeCustomerId : null,
      stripeSubscriptionId:
        typeof data.stripeSubscriptionId === "string" ? data.stripeSubscriptionId : null,
      guacExpiresAt:
        typeof data.guacExpiresAt === "number" || data.guacExpiresAt === null
          ? data.guacExpiresAt
          : null,
      updatedAt:
        typeof data.updatedAt === "number" || data.updatedAt === null ? data.updatedAt : null,
    };
  }

  function profileFromSnapshot(snapshot, source) {
    return {
      accessTier: snapshot.accessTier,
      profileTier: snapshot.accessTier,
      guacActive: snapshot.guacActive,
      updatedAt: new Date().toISOString(),
      source: source,
    };
  }

  root.GojitoEntitlementsCore = {
    normalizeLegacyTier: normalizeLegacyTier,
    parseEntitlementApiResponse: parseEntitlementApiResponse,
    profileFromSnapshot: profileFromSnapshot,
  };
})(typeof window !== "undefined" ? window : globalThis);
