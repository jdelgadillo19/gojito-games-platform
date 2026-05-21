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
import { getCurrentUser, login as loginWithPassword, logout as signOut, signup as signUpWithPassword } from "./auth";
import type { AuthCredentials, AuthError, AuthResult } from "./types";

export type AuthContextValue = {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: AuthError | null;
  login: (credentials: AuthCredentials) => Promise<AuthResult<User>>;
  signup: (credentials: AuthCredentials) => Promise<AuthResult<User>>;
  logout: () => Promise<AuthResult<void>>;
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
      logout,
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
      signup,
      user,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
