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
import type { AuthCredentials, AuthError, AuthResult } from "./types";

export type AuthContextValue = {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: AuthError | null;
  login: (credentials: AuthCredentials) => Promise<AuthResult<User>>;
  signup: (credentials: AuthCredentials) => Promise<AuthResult<User>>;
  signInWithGoogle: () => Promise<AuthResult<void>>;
  logout: () => Promise<AuthResult<void>>;
  isSupabaseConfigured: boolean;
  refreshUser: () => Promise<AuthResult<User | null>>;
  clearError: () => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  const applySession = useCallback((nextSession: Session | null) => {
    setSession(nextSession);
    setUser(nextSession?.user ?? null);
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
      }

      finishLoading();
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (!isMounted) {
          return;
        }
        applySession(nextSession);
        setError(null);
        finishLoading();
      },
    );

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, [applySession]);

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

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      isAuthenticated: Boolean(session),
      isLoading,
      error,
      login,
      signup,
      signInWithGoogle,
      logout,
      isSupabaseConfigured: Boolean(supabase),
      refreshUser,
      clearError,
    }),
    [
      clearError,
      error,
      isLoading,
      login,
      logout,
      refreshUser,
      session,
      signInWithGoogle,
      signup,
      user,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
