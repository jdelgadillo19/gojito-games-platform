import { useState } from "react";
import { GojitoNav } from "@gojito/nav";
import { useAuth } from "../platform/auth";
import { AccountModal } from "./AccountModal";

export function HubGojitoNav() {
  const {
    user,
    isAuthenticated,
    isLoading,
    isSupabaseConfigured,
    logout,
  } = useAuth();
  const [accountModalOpen, setAccountModalOpen] = useState(false);

  return (
    <>
      <GojitoNav
        surface="hub"
        hubUrl="/"
        isLoading={isLoading}
        isAuthenticated={isAuthenticated}
        isSupabaseConfigured={isSupabaseConfigured}
        user={user ? { email: user.email ?? null, full_name: user.user_metadata?.full_name as string | undefined } : undefined}
        onSignIn={() => setAccountModalOpen(true)}
        onSignOut={() => void logout()}
        onRefreshAccess={() => {
          if (typeof window.gojitoRefreshEntitlements === "function") {
            return window.gojitoRefreshEntitlements();
          }
        }}
      />
      <AccountModal open={accountModalOpen} onClose={() => setAccountModalOpen(false)} />
    </>
  );
}
