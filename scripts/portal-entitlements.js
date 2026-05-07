(function () {
  var STORAGE_KEY = "gojito.profile.v1";
  var DEFAULT_TIER = "bean";

  var statusText = document.getElementById("entitlementStatusText");
  var refreshButton = document.getElementById("entitlementRefreshButton");

  function normalizeTier(raw) {
    var value = String(raw || "").toLowerCase().trim();
    if (value === "guac" || value === "paid" || value === "gold") return "guac";
    if (value === "beef" || value === "free" || value === "mvp") return "beef";
    return "bean";
  }

  function getTokenFromWindowProvider() {
    if (typeof window.GOJITO_GET_ID_TOKEN !== "function") return null;
    return window.GOJITO_GET_ID_TOKEN();
  }

  function getTokenFromStorageFallback() {
    var keys = [
      "gojito.firebase.idToken",
      "gojito.auth.idToken",
      "gojito.idToken",
      "firebase.idToken",
    ];
    for (var i = 0; i < keys.length; i++) {
      var token = localStorage.getItem(keys[i]);
      if (token) return token;
    }
    return null;
  }

  async function getFirebaseToken() {
    try {
      var provided = await getTokenFromWindowProvider();
      if (provided) return String(provided);
    } catch (_) {}
    return getTokenFromStorageFallback();
  }

  function parseEntitlementPayload(payload) {
    var profileTier = normalizeTier(payload && payload.profileTier);
    var guacActive = !!(payload && payload.guacActive);
    return {
      profileTier: profileTier,
      guacActive: guacActive,
      updatedAt: new Date().toISOString(),
      source: "backend",
    };
  }

  function readCachedProfile() {
    try {
      var parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (!parsed || typeof parsed !== "object") return null;
      parsed.profileTier = normalizeTier(parsed.profileTier);
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
    var tier = normalizeTier(profile && profile.profileTier);
    document.documentElement.setAttribute("data-profile-tier", tier);
    if (!statusText) return;
    if (tier === "guac") {
      statusText.textContent = "Access tier: Guac (paid).";
      return;
    }
    if (tier === "beef") {
      statusText.textContent = "Access tier: Beef.";
      return;
    }
    statusText.textContent = "Access tier: Bean (guest).";
  }

  async function fetchProfileFromBackend() {
    var token = await getFirebaseToken();
    if (!token) {
      return {
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

    var response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Authorization: "Bearer " + token,
      },
    });

    if (!response.ok) {
      throw new Error("Entitlement request failed: " + response.status);
    }

    var payload = await response.json();
    return parseEntitlementPayload(payload);
  }

  async function refreshEntitlements() {
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
        applyProfileToUi({ profileTier: DEFAULT_TIER });
        if (statusText) statusText.textContent = "Using guest tier. Sign in to sync paid access.";
      }
    } finally {
      if (refreshButton) refreshButton.disabled = false;
    }
  }

  if (refreshButton) {
    refreshButton.addEventListener("click", function () {
      refreshEntitlements();
    });
  }

  window.gojitoRefreshEntitlements = refreshEntitlements;

  var cached = readCachedProfile();
  if (cached) {
    applyProfileToUi(cached);
  }
  refreshEntitlements();
})();
