import type { ComponentType } from "react";

export type GojitoNavProps = {
  surface?: "hub" | "game";
  gameTitle?: string;
  hubUrl?: string;
  isLoading?: boolean;
  isAuthenticated?: boolean;
  isSupabaseConfigured?: boolean;
  user?: { email?: string | null; full_name?: string | null };
  profileTier?: string | null;
  onSignIn?: () => void;
  onSignOut?: () => void;
  onRefreshAccess?: () => void | Promise<void>;
  games?: Array<{ label: string; href: string }>;
  iconSrc?: string;
};

export const GojitoNav: ComponentType<GojitoNavProps>;
export default GojitoNav;
