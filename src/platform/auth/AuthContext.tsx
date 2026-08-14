import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../supabase/client";
import {
  getAccessToken,
  getCurrentUser,
  login as loginWithPassword,
  logout as signOut,
  signInWithGoogle as signInWithGoogleOAuth,
  signup as signUpWithPassword,
} from "./auth";
import {
  dispatchGojitoProfileChange,
  fetchEntitlementsFromBackend,
  registerGojitoAccessTokenProvider,
} from "@gojito/entitlements";
import { submitFullAccessRequest, dispatchGojitoProfileTierChange, type FullAccessRequestResult } from "@gojito/shared";
import type { AuthCredentials, AuthError, AuthResult } from "./types";
import { getUserProfile } from "../profileStore";

export type AuthContextValue = {
  user: User | null;
  session: Session | null;
  profileTier: string | undefined;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: AuthError | null;
  login: (credentials: AuthCredentials) => Promise<AuthResult<User>>;
  signup: (credentials: AuthCredentials) => Promise<AuthResult<User>>;
  signInWithGoogle: () => Promise<AuthResult<void>>;
  logout: () => Promise<AuthResult<void>>;
  isSupabaseConfigured: boolean;
  refreshUser: () => Promise<AuthResult<User | null>>;
  refreshEntitlements: () => Promise<boolean>;
  clearError: () => void;
  requestFullAccess: (
    source?: string,
    contextNote?: string | null,
  ) => Promise<FullAccessRequestResult>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profileTier, setProfileTier] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  const applySession = useCallback((nextSession: Session | null) => {
    setSession(nextSession);
    setUser(nextSession?.user ?? null);
  }, []);

  const syncProfileTierFromSupabase = useCallback(async (activeSession: Session | null) => {
    const uid = activeSession?.user?.id;
    if (!uid || !supabase) {
      setProfileTier(undefined);
      return;
    }
    const doc = await getUserProfile(uid);
    const tier = doc?.tier ?? "beef";
    setProfileTier(tier);
    dispatchGojitoProfileTierChange(tier);
  }, []);

  const syncHubEntitlements = useCallback(async (activeSession: Session | null) => {
    const apiBase = import.meta.env.VITE_GOJITO_API_URL;
    if (typeof apiBase !== "string" || !apiBase.trim() || !activeSession) return;
    const token = await getAccessToken(activeSession);
    if (!token) return;
    const snapshot = await fetchEntitlementsFromBackend(apiBase.trim(), token);
    if (snapshot) {
      dispatchGojitoProfileChange(snapshot, "backend");
      try {
        const tier = snapshot.accessTier === "guac" ? "guac" : "beef";
        localStorage.setItem(
          "gojito.profile.v1",
          JSON.stringify({
            accessTier: tier,
            profileTier: tier,
            guacActive: snapshot.guacActive,
            updatedAt: new Date().toISOString(),
            source: "backend",
          }),
        );
      } catch {
        /* ignore quota */
      }
    }
  }, []);

  useEffect(() => {
    if (!supabase) return;
    registerGojitoAccessTokenProvider(async () => {
      const current = session ?? (await supabase.auth.getSession()).data.session ?? null;
      return getAccessToken(current);
    });
  }, [session]);

  useEffect(() => {
    if (!session) {
      setProfileTier(undefined);
      return;
    }
    void syncProfileTierFromSupabase(session);
  }, [session, syncProfileTierFromSupabase]);

  useEffect(() => {
    if (!session) return;
    void syncHubEntitlements(session);
  }, [session, syncHubEntitlements]);

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      applySession(null);
      return;
    }

    let isMounted = true;

    const finishLoading = () => {
      if (isMounted) {
        setIsLoading(false);
      }
    };

    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!isMounted) {
        return;
      }

      if (sessionError) {
        setError({
          code: "auth_failed",
          message: sessionError.message,
        });
        applySession(null);
      } else {
        applySession(data.session);
        void syncProfileTierFromSupabase(data.session);
      }

      finishLoading();
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, nextSession) => {
        if (!isMounted) {
          return;
        }
        applySession(nextSession);
        setError(null);
        finishLoading();
        if (event !== "TOKEN_REFRESHED") {
          void syncProfileTierFromSupabase(nextSession);
        }
      },
    );

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, [applySession, syncProfileTierFromSupabase]);

  const runAuthAction = useCallback(
    async <T,>(action: () => Promise<AuthResult<T>>): Promise<AuthResult<T>> => {
      setError(null);
      const result = await action();
      if (result.error) {
        setError(result.error);
      }
      return result;
    },
    [],
  );

  const login = useCallback(
    (credentials: AuthCredentials) =>
      runAuthAction(() => loginWithPassword(credentials)),
    [runAuthAction],
  );

  const signup = useCallback(
    (credentials: AuthCredentials) =>
      runAuthAction(() => signUpWithPassword(credentials)),
    [runAuthAction],
  );

  const signInWithGoogle = useCallback(
    () => runAuthAction(() => signInWithGoogleOAuth()),
    [runAuthAction],
  );

  const logout = useCallback(
    () => runAuthAction(() => signOut()),
    [runAuthAction],
  );

  const refreshEntitlements = useCallback(async (): Promise<boolean> => {
    if (!supabase) return false;
    const { data } = await supabase.auth.getSession();
    const uid = data.session?.user?.id;
    if (!uid) {
      setProfileTier(undefined);
      return false;
    }
    const doc = await getUserProfile(uid);
    const tier = doc?.tier ?? "beef";
    setProfileTier(tier);
    dispatchGojitoProfileTierChange(tier);
    return Boolean(doc);
  }, []);

  const refreshUser = useCallback(
    () =>
      runAuthAction(async () => {
        const result = await getCurrentUser();
        if (result.error) {
          return result;
        }
        if (result.data) {
          setUser(result.data);
        } else {
          setUser(null);
          setSession(null);
        }
        return result;
      }),
    [runAuthAction],
  );

  useEffect(() => {
    window.gojitoRefreshEntitlements = () => refreshEntitlements();
    return () => {
      if (window.gojitoRefreshEntitlements) {
        window.gojitoRefreshEntitlements = undefined;
      }
    };
  }, [refreshEntitlements]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const requestFullAccess = useCallback(
    async (source = "hub_nav", contextNote?: string | null) => {
      if (!user?.id) {
        return submitFullAccessRequest(null, { userId: "", source, contextNote });
      }
      return submitFullAccessRequest(supabase, {
        userId: user.id,
        email: user.email ?? null,
        displayName:
          (user.user_metadata?.full_name as string | undefined) ??
          (user.user_metadata?.name as string | undefined) ??
          null,
        source,
        contextNote,
      });
    },
    [user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      profileTier,
      isAuthenticated: Boolean(session),
      isLoading,
      error,
      login,
      signup,
      signInWithGoogle,
      logout,
      isSupabaseConfigured: Boolean(supabase),
      refreshUser,
      refreshEntitlements,
      clearError,
      requestFullAccess,
    }),
    [
      clearError,
      error,
      isLoading,
      login,
      logout,
      profileTier,
      refreshEntitlements,
      refreshUser,
      requestFullAccess,
      session,
      signInWithGoogle,
      signup,
      user,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
