import { useState, type CSSProperties, type FormEvent } from "react";
import { useAuth } from "../platform/auth";

const panelStyle: CSSProperties = {
  margin: "1rem auto",
  maxWidth: "32rem",
  padding: "1rem 1.25rem",
  border: "2px solid #3d7a4a",
  borderRadius: "8px",
  background: "#f4fff6",
  fontFamily: "DM Sans, system-ui, sans-serif",
  color: "#1a2e1f",
};

const labelStyle: CSSProperties = {
  display: "block",
  marginBottom: "0.35rem",
  fontSize: "0.875rem",
  fontWeight: 600,
};

const inputStyle: CSSProperties = {
  width: "100%",
  marginBottom: "0.75rem",
  padding: "0.5rem 0.65rem",
  border: "1px solid #9cb8a3",
  borderRadius: "4px",
  fontSize: "1rem",
  boxSizing: "border-box",
};

const buttonRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.5rem",
  marginTop: "0.5rem",
};

const buttonStyle: CSSProperties = {
  padding: "0.45rem 0.85rem",
  border: "none",
  borderRadius: "4px",
  background: "#2d6a3e",
  color: "#fff",
  fontWeight: 600,
  cursor: "pointer",
};

export function AuthTest() {
  const {
    user,
    isLoading,
    isAuthenticated,
    error,
    login,
    signup,
    logout,
  } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pendingAction, setPendingAction] = useState<
    "login" | "signup" | "logout" | null
  >(null);

  const runAction = async (
    action: "login" | "signup" | "logout",
    handler: () => Promise<unknown>,
  ) => {
    setPendingAction(action);
    try {
      await handler();
    } finally {
      setPendingAction(null);
    }
  };

  const handleLogin = (event: FormEvent) => {
    event.preventDefault();
    void runAction("login", () => login({ email, password }));
  };

  const handleSignup = (event: FormEvent) => {
    event.preventDefault();
    void runAction("signup", () => signup({ email, password }));
  };

  const handleLogout = () => {
    void runAction("logout", () => logout());
  };

  const busy = isLoading || pendingAction !== null;

  return (
    <section style={panelStyle} aria-label="Auth test panel">
      <h2 style={{ margin: "0 0 0.75rem", fontSize: "1.1rem" }}>
        Auth test (temporary)
      </h2>

      <p>
        <strong>Loading:</strong> {busy ? "yes" : "no"}
        {pendingAction ? ` (${pendingAction}…)` : ""}
      </p>
      <p>
        <strong>Signed in:</strong> {isAuthenticated ? "yes" : "no"}
      </p>
      <p>
        <strong>Email:</strong>{" "}
        {user?.email ?? (isAuthenticated ? "(no email on user)" : "—")}
      </p>

      {error && (
        <p role="alert" style={{ color: "#8b2500", margin: "0.5rem 0" }}>
          <strong>Error ({error.code}):</strong> {error.message}
        </p>
      )}

      <form onSubmit={handleLogin}>
        <label style={labelStyle} htmlFor="auth-test-email">
          Email
        </label>
        <input
          id="auth-test-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
          disabled={busy}
        />
        <label style={labelStyle} htmlFor="auth-test-password">
          Password
        </label>
        <input
          id="auth-test-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
          disabled={busy}
        />
        <div style={buttonRowStyle}>
          <button
            type="submit"
            style={buttonStyle}
            disabled={busy}
          >
            Log in
          </button>
          <button
            type="button"
            style={buttonStyle}
            disabled={busy}
            onClick={handleSignup}
          >
            Sign up
          </button>
          <button
            type="button"
            style={{ ...buttonStyle, background: "#5c4033" }}
            disabled={busy || !isAuthenticated}
            onClick={handleLogout}
          >
            Log out
          </button>
        </div>
      </form>
    </section>
  );
}
