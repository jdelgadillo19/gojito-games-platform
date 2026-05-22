import { useState, type CSSProperties, type FormEvent } from "react";
import { useAuth } from "../platform/auth";

const overlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 60,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "1rem",
  background: "rgba(0, 0, 0, 0.55)",
};

const panelStyle: CSSProperties = {
  width: "100%",
  maxWidth: "22rem",
  padding: "1.25rem 1.5rem",
  borderRadius: "12px",
  background: "#f4fff6",
  border: "2px solid #3d7a4a",
  color: "#1a2e1f",
  fontFamily: "DM Sans, system-ui, sans-serif",
  boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
};

const inputStyle: CSSProperties = {
  width: "100%",
  marginBottom: "0.65rem",
  padding: "0.5rem 0.65rem",
  border: "1px solid #9cb8a3",
  borderRadius: "6px",
  fontSize: "1rem",
  boxSizing: "border-box",
};

const btnPrimary: CSSProperties = {
  padding: "0.5rem 1rem",
  border: "none",
  borderRadius: "6px",
  background: "#2d6a3e",
  color: "#fff",
  fontWeight: 600,
  cursor: "pointer",
};

const btnSecondary: CSSProperties = {
  ...btnPrimary,
  background: "#e8f5eb",
  color: "#1a2e1f",
  border: "1px solid #9cb8a3",
};

type AccountModalProps = {
  open: boolean;
  onClose: () => void;
};

export function AccountModal({ open, onClose }: AccountModalProps) {
  const {
    user,
    isAuthenticated,
    isLoading,
    isSupabaseConfigured,
    error,
    login,
    signup,
    signInWithGoogle,
    logout,
    clearError,
  } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  async function handleEmailSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    clearError();
    const action = mode === "signin" ? login : signup;
    await action({ email, password });
    setBusy(false);
  }

  async function handleGoogle() {
    setBusy(true);
    clearError();
    await signInWithGoogle();
    setBusy(false);
  }

  async function handleLogout() {
    setBusy(true);
    await logout();
    setBusy(false);
    onClose();
  }

  if (!isSupabaseConfigured) {
    return (
      <div style={overlayStyle} role="dialog" aria-modal="true" aria-labelledby="account-title">
        <div style={panelStyle}>
          <h2 id="account-title" style={{ marginTop: 0 }}>
            Account
          </h2>
          <p>Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.</p>
          <button type="button" style={btnSecondary} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={overlayStyle}
      role="dialog"
      aria-modal="true"
      aria-labelledby="account-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div style={panelStyle}>
        <h2 id="account-title" style={{ marginTop: 0, marginBottom: "0.5rem" }}>
          Gojito account
        </h2>

        {isAuthenticated && user ? (
          <>
            <p style={{ margin: "0 0 1rem", fontSize: "0.9rem" }}>
              Signed in as <strong>{user.email ?? user.id}</strong>
            </p>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <button type="button" style={btnSecondary} disabled={busy} onClick={() => void handleLogout()}>
                Log out
              </button>
              <button type="button" style={btnSecondary} onClick={onClose}>
                Close
              </button>
            </div>
          </>
        ) : (
          <>
            <p style={{ margin: "0 0 0.75rem", fontSize: "0.875rem", opacity: 0.85 }}>
              One sign-in works across Cakery Bakery and Calculator Cove.
            </p>
            <button
              type="button"
              style={{ ...btnPrimary, width: "100%", marginBottom: "0.75rem" }}
              disabled={busy || isLoading}
              onClick={() => void handleGoogle()}
            >
              Continue with Google
            </button>
            <form onSubmit={(e) => void handleEmailSubmit(e)}>
              <label htmlFor="gojito-email" style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                Email
              </label>
              <input
                id="gojito-email"
                type="email"
                autoComplete="email"
                required
                style={inputStyle}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <label htmlFor="gojito-password" style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                Password
              </label>
              <input
                id="gojito-password"
                type="password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                required
                minLength={6}
                style={inputStyle}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
                <button type="submit" style={btnPrimary} disabled={busy || isLoading}>
                  {mode === "signin" ? "Log in" : "Create account"}
                </button>
                <button
                  type="button"
                  style={btnSecondary}
                  onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                >
                  {mode === "signin" ? "Need an account?" : "Have an account?"}
                </button>
              </div>
            </form>
            {error ? (
              <p role="alert" style={{ color: "#9b2c2c", fontSize: "0.85rem", margin: "0.5rem 0 0" }}>
                {error.message}
              </p>
            ) : null}
            <button type="button" style={{ ...btnSecondary, marginTop: "0.5rem" }} onClick={onClose}>
              Close
            </button>
          </>
        )}
      </div>
    </div>
  );
}
