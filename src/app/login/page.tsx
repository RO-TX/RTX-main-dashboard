'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Droplet, Lock, Mail, Loader2 } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { defaultRouteFor } from '@/lib/access';
import type { User } from '@/lib/types';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const setAuth = useAuth((s) => s.setAuth);

  const [email, setEmail] = useState('admin@rotechnicalxperts.com');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    params.get('error') === 'forbidden' ? 'That account is not a staff account.' : null,
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.post<{ user: User; accessToken: string }>(
        '/auth/login',
        { email, password },
        false,
      );
      const { user, accessToken } = res.data;
      if (user.role === 'customer') {
        setError('This account does not have dashboard access.');
        setLoading(false);
        return;
      }
      setAuth(accessToken, user);
      router.replace(defaultRouteFor(user.role));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login failed');
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      {/* Decorative gradient panel */}
      <div className="grid w-full max-w-4xl overflow-hidden rounded-3xl border border-border bg-surface shadow-xl md:grid-cols-2">
        <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-navy-600 via-navy-800 to-navy-900 p-10 text-white md:flex">
          {/* pale steel light diffusing up through deep water */}
          <div className="pointer-events-none absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-navy-300/40 blur-3xl" />
          <div className="relative z-10 flex items-center gap-2">
            <Droplet className="h-7 w-7" fill="white" />
            <div className="leading-tight">
              <p className="text-lg font-extrabold">RO TECHNICAL</p>
              <p className="text-xs tracking-[0.3em] text-white/80">XPERTS</p>
            </div>
          </div>
          <div className="relative z-10">
            <h2 className="text-3xl font-extrabold leading-tight">
              Pure Water.
              <br />
              Better Business.
            </h2>
            <p className="mt-3 max-w-xs text-sm text-white/80">
              Manage products, orders, customers and service requests — all in one place.
            </p>
          </div>
          <p className="relative z-10 text-xs text-white/60">Admin Dashboard · v0.1</p>
        </div>

        {/* Form */}
        <div className="p-8 md:p-10">
          <h1 className="text-2xl font-extrabold text-heading">Welcome back</h1>
          <p className="mt-1 text-sm text-muted">Sign in to your admin account.</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-heading">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-xl border border-border bg-surface-alt py-2.5 pl-10 pr-3 text-sm text-heading outline-none focus:border-primary focus:ring-2 focus:ring-glow"
                  placeholder="you@rotechnicalxperts.com"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-heading">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-xl border border-border bg-surface-alt py-2.5 pl-10 pr-3 text-sm text-heading outline-none focus:border-primary focus:ring-2 focus:ring-glow"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-error/10 px-3 py-2 text-sm text-error">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 rounded-lg bg-surface-alt px-3 py-2 text-xs text-muted">
            Seed admin — <span className="font-medium text-body">admin@rotechnicalxperts.com</span> /{' '}
            <span className="font-medium text-body">Admin@123</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
