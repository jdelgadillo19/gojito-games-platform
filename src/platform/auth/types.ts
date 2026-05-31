import type { User } from "@supabase/supabase-js";

export type AuthCredentials = {
  email: string;
  password: string;
};

export type AuthErrorCode =
  | "auth_failed"
  | "confirmation_pending"
  | "not_configured"
  | "validation_failed";

export type AuthError = {
  code: AuthErrorCode;
  message: string;
};

export type AuthResult<T> =
  | { data: T; error: null }
  | { data: null; error: AuthError };

export type AuthUser = User;
