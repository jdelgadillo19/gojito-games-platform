import { useState } from "react";
import { GojitoNav } from "@gojito/nav";
import { useAuth } from "../platform/auth";
import { AccountModal } from "./AccountModal";

export function HubGojitoNav() {
  const {
    user,
    profileTier,
    isAuthenticated,
    isLoading,
    isSupabaseConfigured,
    logout,
    requestFullAccess,
    refreshEntitlements,
  } = useAuth();
  const [accountModalOpen, setAccountModalOpen] = useState(false);

  return (
    <>
      <GojitoNav
        surface="hub"
        hubUrl="/"
        profileTier={profileTier}
        isLoading={isLoading}
        isAuthenticated={isAuthenticated}
        isSupabaseConfigured={isSupabaseConfigured}
        user={user ? { email: user.email ?? null, full_name: user.user_metadata?.full_name as string | undefined } : undefined}
        onSignIn={() => setAccountModalOpen(true)}
        onSignOut={() => void logout()}
        onRefreshAccess={async () => {
          await refreshEntitlements();
        }}
        onRequestFullAccess={() => requestFullAccess("hub_nav")}
      />
      <AccountModal open={accountModalOpen} onClose={() => setAccountModalOpen(false)} />
    </>
  );
}
