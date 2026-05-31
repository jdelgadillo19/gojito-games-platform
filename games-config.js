/** Path hosting — same origin as this portal (production and preview hosts). */
window.GOJITO_GAMES = {
  cakeryBakery: "/cakerybakery/",
  calculatorCove: "/calculatorcove/",
};

/**
 * Optional API base for legacy entitlement sync. Leave empty — entitlements
 * are read from Supabase `profiles.tier` when unset.
 */
window.GOJITO_BACKEND_URL = window.GOJITO_BACKEND_URL || "";
