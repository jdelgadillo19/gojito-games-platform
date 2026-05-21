import type { User } from "@supabase/supabase-js";
import { supabase } from "../supabase/client";
import {
  fromSupabaseError,
  notConfiguredError,
  validationError,
} from "./errors";
import type { AuthCredentials, AuthError, AuthResult, AuthUser } from "./types";

function assertConfigured(): AuthError | null {
  if (!supabase) {
    return notConfiguredError();
  }
  return null;
}

function validateCredentials({
  email,
  password,
}: AuthCredentials): AuthError | null {
  const trimmedEmail = email.trim();
  if (!trimmedEmail) {
    return validationError("Email is required.");
  }
  if (!password) {
    return validationError("Password is required.");
  }
  if (password.length < 6) {
    return validationError("Password must be at least 6 characters.");
  }
  return null;
}

export async function login(
  credentials: AuthCredentials,
): Promise<AuthResult<AuthUser>> {
  const configError = assertConfigured();
  if (configError) {
    return { data: null, error: configError };
  }

  const validation = validateCredentials(credentials);
  if (validation) {
    return { data: null, error: validation };
  }

  const { data, error } = await supabase!.auth.signInWithPassword({
    email: credentials.email.trim(),
    password: credentials.password,
  });

  if (error) {
    return { data: null, error: fromSupabaseError(error) };
  }

  if (!data.user) {
    return {
      data: null,
      error: fromSupabaseError({ message: "Sign-in succeeded but no user was returned." }),
    };
  }

  return { data: data.user, error: null };
}

export async function signup(
  credentials: AuthCredentials,
): Promise<AuthResult<AuthUser>> {
  const configError = assertConfigured();
  if (configError) {
    return { data: null, error: configError };
  }

  const validation = validateCredentials(credentials);
  if (validation) {
    return { data: null, error: validation };
  }

  const { data, error } = await supabase!.auth.signUp({
    email: credentials.email.trim(),
    password: credentials.password,
  });

  if (error) {
    return { data: null, error: fromSupabaseError(error) };
  }

  if (!data.user) {
    return {
      data: null,
      error: fromSupabaseError({ message: "Sign-up succeeded but no user was returned." }),
    };
  }

  return { data: data.user, error: null };
}

export async function logout(): Promise<AuthResult<void>> {
  const configError = assertConfigured();
  if (configError) {
    return { data: null, error: configError };
  }

  const { error } = await supabase!.auth.signOut();
  if (error) {
    return { data: null, error: fromSupabaseError(error) };
  }

  return { data: undefined, error: null };
}

export async function getCurrentUser(): Promise<AuthResult<User | null>> {
  const configError = assertConfigured();
  if (configError) {
    return { data: null, error: configError };
  }

  const { data, error } = await supabase!.auth.getUser();
  if (error) {
    return { data: null, error: fromSupabaseError(error) };
  }

  return { data: data.user, error: null };
}
