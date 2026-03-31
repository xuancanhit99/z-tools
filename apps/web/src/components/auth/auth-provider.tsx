"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import type { AuthSessionResponse, AuthUser } from "../../lib/api";
import { getProfile, login, logout, refreshSession, register, setAccessToken } from "../../lib/api";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthState = {
  user: AuthUser;
  accessToken: string;
  tokenType: "Bearer";
  expiresAt: number;
  refreshToken?: string;
};

type SignOutOptions = {
  redirectToLogin?: boolean;
};

type AuthContextValue = {
  status: AuthStatus;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (fullName: string, email: string, password: string) => Promise<void>;
  signOut: (options?: SignOutOptions) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const refreshTokenStorageKey = "hyperz.auth.refreshToken";
const userStorageKey = "hyperz.auth.user";
const refreshLeadTimeMs = 60_000;
const minRefreshDelayMs = 5_000;

type AuthProviderProps = {
  children: ReactNode;
};

function toExpiresAt(expiresIn: number) {
  return Date.now() + expiresIn * 1000;
}

function toAuthState(response: AuthSessionResponse, refreshToken?: string): AuthState {
  return {
    user: response.user,
    accessToken: response.accessToken,
    tokenType: response.tokenType,
    expiresAt: toExpiresAt(response.expiresIn),
    refreshToken: refreshToken ?? response.refreshToken
  };
}

function toRefreshState(
  user: AuthUser,
  refreshToken: string | undefined,
  response: {
    accessToken: string;
    tokenType: "Bearer";
    expiresIn: number;
  }
): AuthState {
  return {
    user,
    accessToken: response.accessToken,
    tokenType: response.tokenType,
    expiresAt: toExpiresAt(response.expiresIn),
    refreshToken
  };
}

function readPersistedUser(): AuthUser | null {
  const rawUser = window.localStorage.getItem(userStorageKey);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as AuthUser;
  } catch {
    window.localStorage.removeItem(userStorageKey);
    return null;
  }
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const persistSession = useCallback((session: AuthState | null) => {
    if (!session) {
      window.localStorage.removeItem(refreshTokenStorageKey);
      window.localStorage.removeItem(userStorageKey);
      return;
    }

    if (session.refreshToken) {
      window.localStorage.setItem(refreshTokenStorageKey, session.refreshToken);
    } else {
      window.localStorage.removeItem(refreshTokenStorageKey);
    }

    window.localStorage.setItem(userStorageKey, JSON.stringify(session.user));
  }, []);

  const applySession = useCallback(
    (nextState: AuthState | null) => {
      setState(nextState);
      setAccessToken(nextState?.accessToken ?? null);
      persistSession(nextState);
    },
    [persistSession]
  );

  const refreshAccess = useCallback(
    async (refreshToken: string, fallbackUser: AuthUser | null) => {
      const refreshed = await refreshSession(refreshToken);
      setAccessToken(refreshed.accessToken);

      const profile = await getProfile(refreshed.accessToken);
      const nextUser = profile.user ?? fallbackUser;

      if (!nextUser) {
        throw new Error("Unable to resolve user profile");
      }

      const nextState = toRefreshState(nextUser, refreshToken, refreshed);
      applySession(nextState);
      return nextState;
    },
    [applySession]
  );

  useEffect(() => {
    let cancelled = false;

    async function hydrateSession() {
      const refreshToken = window.localStorage.getItem(refreshTokenStorageKey) ?? undefined;
      const fallbackUser = readPersistedUser();

      if (!refreshToken) {
        setHydrated(true);
        return;
      }

      try {
        const refreshed = await refreshSession(refreshToken);
        setAccessToken(refreshed.accessToken);

        let nextUser = fallbackUser;

        try {
          const profile = await getProfile(refreshed.accessToken);
          nextUser = profile.user;
        } catch {
          // Keep fallback user if profile endpoint is temporarily unavailable.
        }

        if (!nextUser) {
          throw new Error("Unable to restore user profile");
        }

        const nextState = toRefreshState(nextUser, refreshToken, refreshed);

        if (!cancelled) {
          applySession(nextState);
        }
      } catch {
        if (!cancelled) {
          applySession(null);
        }
      } finally {
        if (!cancelled) {
          setHydrated(true);
        }
      }
    }

    void hydrateSession();

    return () => {
      cancelled = true;
    };
  }, [applySession]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const response = await login({
        email,
        password
      });

      const nextState = toAuthState(response);
      applySession(nextState);
    },
    [applySession]
  );

  const signUp = useCallback(
    async (fullName: string, email: string, password: string) => {
      const response = await register({
        fullName,
        email,
        password
      });

      const nextState = toAuthState(response);
      applySession(nextState);
    },
    [applySession]
  );

  const signOut = useCallback(
    async (options?: SignOutOptions) => {
      const shouldRedirect = options?.redirectToLogin ?? true;
      const refreshToken = state?.refreshToken ?? window.localStorage.getItem(refreshTokenStorageKey) ?? undefined;

      try {
        if (refreshToken) {
          await logout(refreshToken);
        }
      } catch {
        // Local session should still be cleared if remote logout fails.
      } finally {
        applySession(null);
      }

      if (shouldRedirect) {
        window.location.assign("/login");
      }
    },
    [applySession, state?.refreshToken]
  );

  useEffect(() => {
    if (!state?.refreshToken) {
      return;
    }

    const refreshInMs = Math.max(minRefreshDelayMs, state.expiresAt - Date.now() - refreshLeadTimeMs);

    const timeoutId = window.setTimeout(() => {
      void refreshAccess(state.refreshToken as string, state.user).catch(() => {
        void signOut({ redirectToLogin: false });
      });
    }, refreshInMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [refreshAccess, signOut, state]);

  const status: AuthStatus = !hydrated
    ? "loading"
    : state
      ? "authenticated"
      : "unauthenticated";

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user: state?.user ?? null,
      isAuthenticated: status === "authenticated",
      isLoading: status === "loading",
      signIn,
      signUp,
      signOut
    }),
    [signIn, signOut, signUp, state?.user, status]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
