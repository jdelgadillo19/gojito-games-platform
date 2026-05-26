import { useCallback, useEffect, useId, useRef, useState } from "react";
import { accessLabel, normalizeProfileTier } from "./access.js";

const DEFAULT_GAMES = [
  { label: "Cakery Bakery", href: "/cakerybakery/" },
  { label: "Calculator Cove", href: "/calculatorcove/" },
];

function resolveGames(games) {
  if (games && games.length > 0) return games;
  if (typeof window !== "undefined" && window.GOJITO_GAMES) {
    const g = window.GOJITO_GAMES;
    return [
      { label: "Cakery Bakery", href: g.cakeryBakery || "/cakerybakery/" },
      { label: "Calculator Cove", href: g.calculatorCove || "/calculatorcove/" },
    ];
  }
  return DEFAULT_GAMES;
}

function displayName(user, isAuthenticated, isLoading) {
  if (isLoading) return "Checking session…";
  if (!isAuthenticated) return "Sign in";
  const email = user?.email;
  if (email) return email.split("@")[0];
  return user?.full_name || "Account";
}

function avatarInitial(user, isAuthenticated) {
  if (!isAuthenticated) return "?";
  const src = user?.email || user?.full_name || "?";
  return String(src).charAt(0).toUpperCase();
}

/**
 * @param {object} props
 * @param {'hub' | 'game'} props.surface
 * @param {string} [props.gameTitle]
 * @param {string} [props.hubUrl]
 * @param {boolean} props.isLoading
 * @param {boolean} props.isAuthenticated
 * @param {boolean} props.isSupabaseConfigured
 * @param {{ email?: string | null, full_name?: string | null }} [props.user]
 * @param {string | undefined | null} [props.profileTier]
 * @param {() => void} [props.onSignIn]
 * @param {() => void} [props.onSignOut]
 * @param {() => void | Promise<void>} [props.onRefreshAccess]
 * @param {Array<{ label: string, href: string }>} [props.games]
 * @param {string} [props.iconSrc]
 */
export function GojitoNav({
  surface = "hub",
  gameTitle,
  hubUrl = "/",
  isLoading = false,
  isAuthenticated = false,
  isSupabaseConfigured = true,
  user,
  profileTier,
  onSignIn,
  onSignOut,
  onRefreshAccess,
  games,
  iconSrc = "/gojito-games-hub-icon.svg",
}) {
  const menuId = useId();
  const gamesMenuId = useId();
  const navRef = useRef(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [gamesOpen, setGamesOpen] = useState(false);
  const [domTier, setDomTier] = useState(() =>
    typeof document !== "undefined"
      ? normalizeProfileTier(document.documentElement.getAttribute("data-profile-tier"))
      : "bean",
  );

  const readDomTier = useCallback(() => {
    setDomTier(normalizeProfileTier(document.documentElement.getAttribute("data-profile-tier")));
  }, []);

  useEffect(() => {
    readDomTier();
    window.addEventListener("gojito-profile-change", readDomTier);
    return () => window.removeEventListener("gojito-profile-change", readDomTier);
  }, [readDomTier]);

  const effectiveTier =
    profileTier != null && profileTier !== ""
      ? normalizeProfileTier(profileTier)
      : domTier;

  const access = accessLabel(isSupabaseConfigured, isAuthenticated, effectiveTier);
  const showGameSwitcher = surface === "hub";
  const gameList = resolveGames(games);
  const triggerLabel = displayName(user, isAuthenticated, isLoading);

  useEffect(() => {
    if (!accountOpen && !gamesOpen) return undefined;
    const onDocClick = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setAccountOpen(false);
        setGamesOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        setAccountOpen(false);
        setGamesOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [accountOpen, gamesOpen]);

  const handleAccountTrigger = () => {
    if (isLoading) return;
    if (!isAuthenticated && onSignIn) {
      onSignIn();
      return;
    }
    setAccountOpen((v) => !v);
    setGamesOpen(false);
  };

  const handleRefresh = async () => {
    if (onRefreshAccess) {
      await onRefreshAccess();
    } else if (typeof window.gojitoRefreshEntitlements === "function") {
      await window.gojitoRefreshEntitlements();
    }
    readDomTier();
  };

  const accessClass =
    access === "Full access"
      ? "gojito-nav__badge--full"
      : access === "Member"
        ? "gojito-nav__badge--member"
        : "gojito-nav__badge--guest";

  return (
    <header ref={navRef} className="gojito-nav" aria-label="Gojito Games">
      <a className="gojito-nav__brand" href={hubUrl} aria-label="Back to Gojito Games hub">
        <img src={iconSrc} alt="" width={26} height={26} decoding="async" />
        <span className="gojito-nav__brand-label">Gojito Games</span>
        {surface === "game" && gameTitle ? (
          <span className="gojito-nav__context">{gameTitle}</span>
        ) : null}
      </a>

      <div className="gojito-nav__actions">
        {showGameSwitcher ? (
          <div className="gojito-nav__dropdown-wrap">
            <button
              type="button"
              className="gojito-nav__games-btn"
              aria-expanded={gamesOpen}
              aria-controls={gamesMenuId}
              onClick={() => {
                setGamesOpen((v) => !v);
                setAccountOpen(false);
              }}
            >
              Games <span aria-hidden="true">▾</span>
            </button>
            {gamesOpen ? (
              <div id={gamesMenuId} className="gojito-nav__menu gojito-nav__menu--games" role="menu">
                {gameList.map((game) => (
                  <a key={game.href} className="gojito-nav__menu-item" href={game.href} role="menuitem">
                    {game.label}
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {isSupabaseConfigured ? (
          <div className="gojito-nav__dropdown-wrap">
            <button
              type="button"
              className="gojito-nav__account-btn"
              aria-expanded={accountOpen}
              aria-haspopup={isAuthenticated ? "menu" : "dialog"}
              aria-controls={isAuthenticated ? menuId : undefined}
              onClick={handleAccountTrigger}
            >
              <span className="gojito-nav__avatar" aria-hidden="true">
                {avatarInitial(user, isAuthenticated)}
              </span>
              <span className="gojito-nav__account-label">{triggerLabel}</span>
            </button>
            {accountOpen && isAuthenticated ? (
              <div id={menuId} className="gojito-nav__menu gojito-nav__menu--account" role="menu">
                {user?.email ? (
                  <p className="gojito-nav__menu-email">{user.email}</p>
                ) : null}
                <p className="gojito-nav__menu-row">
                  <span className={`gojito-nav__badge ${accessClass}`}>{access}</span>
                </p>
                {isAuthenticated ? (
                  <p className="gojito-nav__menu-hint">Cloud saves on</p>
                ) : null}
                <button
                  type="button"
                  className="gojito-nav__menu-item gojito-nav__menu-item--btn"
                  role="menuitem"
                  onClick={() => void handleRefresh()}
                >
                  Refresh access
                </button>
                <button
                  type="button"
                  className="gojito-nav__menu-item gojito-nav__menu-item--btn"
                  role="menuitem"
                  onClick={() => {
                    setAccountOpen(false);
                    onSignOut?.();
                  }}
                >
                  Sign out
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </header>
  );
}

export default GojitoNav;
