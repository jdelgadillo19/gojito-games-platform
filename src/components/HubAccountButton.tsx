import { useState } from "react";
import { useAuth } from "../platform/auth";
import { AccountModal } from "./AccountModal";

export function HubAccountButton() {
  const { isAuthenticated, user, isLoading, isSupabaseConfigured } = useAuth();
  const [open, setOpen] = useState(false);

  if (!isSupabaseConfigured) return null;

  const label = isLoading
    ? "Account…"
    : isAuthenticated
      ? user?.email?.split("@")[0] ?? "Account"
      : "Sign in";

  return (
    <>
      <button
        type="button"
        className="hub-account-btn"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        {label}
      </button>
      <AccountModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
