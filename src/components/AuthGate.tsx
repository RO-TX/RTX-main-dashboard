'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-store';
import { api, tryRefresh } from '@/lib/api';
import { canAccess, defaultRouteFor } from '@/lib/access';
import type { User } from '@/lib/types';

/**
 * Wraps authenticated pages. On mount it confirms the session (validates the
 * stored token via /auth/me, silently refreshing if needed). Staff-only: a
 * logged-in customer is bounced to /login. Renders children once verified.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { accessToken, user, hydrated, setUser, clear } = useAuth();
  const [checking, setChecking] = useState(true);

  // Route-level RBAC: if the role can't see this page, send it to its home.
  useEffect(() => {
    if (user && !canAccess(user.role, pathname)) {
      router.replace(defaultRouteFor(user.role));
    }
  }, [user, pathname, router]);

  useEffect(() => {
    if (!hydrated) return;
    let active = true;

    (async () => {
      // No token at all → try the refresh cookie once, else login.
      if (!accessToken) {
        const ok = await tryRefresh();
        if (!ok) return active && router.replace('/login');
      }
      try {
        const me = await api.get<User>('/auth/me');
        if (!active) return;
        if (me.role === 'customer') {
          clear();
          return router.replace('/login?error=forbidden');
        }
        setUser(me);
        setChecking(false);
      } catch {
        if (active) router.replace('/login');
      }
    })();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  if (!hydrated || checking || !user || !canAccess(user.role, pathname)) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
