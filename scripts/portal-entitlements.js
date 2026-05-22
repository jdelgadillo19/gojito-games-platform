(function () {
  var STORAGE_KEY = "gojito.profile.v1";
  var DEFAULT_TIER = "bean";
  var Core = window.GojitoEntitlementsCore;

  var statusText = document.getElementById("entitlementStatusText");
  var refreshButton = document.getElementById("entitlementRefreshButton");

  function normalizeTier(raw) {
    var value = String(raw || "").toLowerCase().trim();
    if (value === "guac" || value === "paid" || value === "gold") return "guac";
    if (value === "beef" || value === "free" || value === "mvp") return "beef";
    return "bean";
  }

  async function getSupabaseToken() {
    if (typeof window.GOJITO_GET_ACCESS_TOKEN === "function") {
      try {
        var provided = await window.GOJITO_GET_ACCESS_TOKEN();
        if (provided) return String(provided);
      } catch (_) {}
    }
    if (typeof window.GOJITO_GET_ID_TOKEN === "function") {
      try {
        var legacy = await window.GOJITO_GET_ID_TOKEN();
        if (legacy) return String(legacy);
      } catch (_) {}
    }
    var keys = [
      "gojito.supabase.accessToken",
      "gojito.auth.idToken",
      "gojito.idToken",
    ];
    for (var i = 0; i < keys.length; i++) {
      var token = localStorage.getItem(keys[i]);
      if (token) return token;
    }
    return null;
  }

  function parseEntitlementPayload(payload) {
    if (Core && Core.parseEntitlementApiResponse) {
      var snap = Core.parseEntitlementApiResponse(payload);
      if (snap) return Core.profileFromSnapshot(snap, "backend");
    }
    var accessTier = normalizeTier(payload && (payload.accessTier || payload.profileTier));
    var guacActive = !!(payload && payload.guacActive);
    if (guacActive) accessTier = "guac";
    return {
      accessTier: accessTier,
      profileTier: accessTier,
      guacActive: guacActive,
      updatedAt: new Date().toISOString(),
      source: "backend",
    };
  }

  function readCachedProfile() {
    try {
      var parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (!parsed || typeof parsed !== "object") return null;
      var tier = normalizeTier(parsed.accessTier || parsed.profileTier);
      parsed.accessTier = tier;
      parsed.profileTier = tier;
      return parsed;
    } catch (_) {
      return null;
    }
  }

  function saveProfile(profile) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    window.dispatchEvent(new CustomEvent("gojito-profile-change", { detail: profile }));
  }

  function applyProfileToUi(profile) {
    var tier = normalizeTier(profile && (profile.accessTier || profile.profileTier));
    document.documentElement.setAttribute("data-profile-tier", tier);
    if (!statusText) return;
    if (tier === "guac") {
      statusText.textContent = "Access tier: Guac (paid).";
      return;
    }
    if (tier === "beef") {
      statusText.textContent = "Access tier: Beef (signed in).";
      return;
    }
    statusText.textContent = "Access tier: Bean (guest).";
  }

  var refreshInFlight = false;

  async function fetchProfileFromBackend() {
    var token = await getSupabaseToken();
    if (!token) {
      return {
        accessTier: DEFAULT_TIER,
        profileTier: DEFAULT_TIER,
        guacActive: false,
        updatedAt: new Date().toISOString(),
        source: "guest-fallback",
      };
    }

    var backendBase =
      typeof window.GOJITO_BACKEND_URL === "string" ? window.GOJITO_BACKEND_URL.trim() : "";
    var endpoint = backendBase
      ? backendBase.replace(/\/+$/, "") + "/api/entitlements/me"
      : "/api/entitlements/me";

    var controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    var timeoutId =
      controller &&
      setTimeout(function () {
        controller.abort();
      }, 8000);

    var response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Authorization: "Bearer " + token,
      },
      signal: controller ? controller.signal : undefined,
    });

    if (timeoutId) clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error("Entitlement request failed: " + response.status);
    }

    var payload = await response.json();
    return parseEntitlementPayload(payload);
  }

  async function refreshEntitlements() {
    if (refreshInFlight) return;
    refreshInFlight = true;
    if (refreshButton) refreshButton.disabled = true;
    if (statusText) statusText.textContent = "Syncing access tier...";

    try {
      var profile = await fetchProfileFromBackend();
      applyProfileToUi(profile);
      saveProfile(profile);
    } catch (_) {
      var cached = readCachedProfile();
      if (cached) {
        applyProfileToUi(cached);
        if (statusText) statusText.textContent = statusText.textContent + " (cached)";
      } else {
        applyProfileToUi({ profileTier: DEFAULT_TIER, accessTier: DEFAULT_TIER });
        if (statusText) statusText.textContent = "Using guest tier. Sign in to sync access.";
      }
    } finally {
      refreshInFlight = false;
      if (refreshButton) refreshButton.disabled = false;
    }
  }

  if (refreshButton) {
    refreshButton.addEventListener("click", function () {
      refreshEntitlements();
    });
  }

  window.gojitoRefreshEntitlements = refreshEntitlements;

  window.addEventListener("gojito-profile-change", function (event) {
    var detail = event && event.detail;
    if (detail && (detail.accessTier || detail.profileTier)) {
      applyProfileToUi({
        accessTier: detail.accessTier || detail.profileTier,
        profileTier: detail.profileTier || detail.accessTier,
        guacActive: !!detail.guacActive,
      });
      return;
    }
    var cached = readCachedProfile();
    if (cached) applyProfileToUi(cached);
  });

  var cached = readCachedProfile();
  if (cached) {
    applyProfileToUi(cached);
  }
  refreshEntitlements();
})();
