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

export function confirmationPendingError(email: string): AuthError {
  return authError(
    "confirmation_pending",
    `We sent a confirmation link to ${email}. Open that email and click the link to activate your account, then return here to log in.`,
  );
}

export function fromSupabaseError(error: { message: string }): AuthError {
  return authError("auth_failed", error.message);
}
