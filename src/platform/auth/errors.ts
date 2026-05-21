import type { AuthError, AuthErrorCode } from "./types";

function authError(code: AuthErrorCode, message: string): AuthError {
  return { code, message };
}

export function notConfiguredError(): AuthError {
  return authError(
    "not_configured",
    "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
  );
}

export function validationError(message: string): AuthError {
  return authError("validation_failed", message);
}

export function fromSupabaseError(error: { message: string }): AuthError {
  return authError("auth_failed", error.message);
}
