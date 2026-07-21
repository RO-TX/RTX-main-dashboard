'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from './types';

interface AuthState {
  accessToken: string | null;
  user: User | null;
  hydrated: boolean;
  setAuth: (token: string, user: User) => void;
  setUser: (user: User) => void;
  clear: () => void;
  setHydrated: () => void;
}

/**
 * Holds the short-lived access token + current user. Persisted to localStorage
 * so a page reload keeps you logged in; the httpOnly refresh cookie is the real
 * source of truth and is used to silently re-issue tokens.
 */
export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      hydrated: false,
      setAuth: (accessToken, user) => set({ accessToken, user }),
      setUser: (user) => set({ user }),
      clear: () => set({ accessToken: null, user: null }),
      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: 'rtx-admin-auth',
      partialize: (s) => ({ accessToken: s.accessToken, user: s.user }),
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    },
  ),
);

/* Non-hook accessors for use inside the API client (outside React). */
export const authStore = {
  get token() {
    return useAuth.getState().accessToken;
  },
  setToken(token: string) {
    useAuth.setState({ accessToken: token });
  },
  clear() {
    useAuth.getState().clear();
  },
};
