/** Path hosting — same origin as this portal (prod + *.pages.dev previews). */
window.GOJITO_GAMES = {
  cakeryBakery: "/cakerybakery/",
  calculatorCove: "/calculatorcove/",
};

/**
 * Optional backend base URL for portal entitlement sync.
 * Leave empty to use same-origin /api routes.
 */
window.GOJITO_BACKEND_URL = window.GOJITO_BACKEND_URL || "";
