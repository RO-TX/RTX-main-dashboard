'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bell, Mail, Search, Menu, LogOut, Settings, Package, ShoppingCart, Users, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-store';
import { useUI } from '@/lib/ui-store';
import { api, ApiError, request } from '@/lib/api';
import { toast } from '@/lib/toast';
import { timeAgo, cn } from '@/lib/format';
import type { Notification, Product, Order, User } from '@/lib/types';

/* ── Quick search: products/orders/customers, debounced, grouped dropdown ── */
function QuickSearch() {
  const router = useRouter();
  const isAdmin = useAuth((s) => s.user?.role === 'admin');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ products: Product[]; orders: Order[]; users: User[] }>({
    products: [],
    orders: [],
    users: [],
  });
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults({ products: [], orders: [], users: [] });
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      const [products, orders, users] = await Promise.allSettled([
        api.getList<Product[]>('/catalog/products', { search: q, limit: 5 }),
        api.getList<Order[]>('/orders', { search: q, limit: 5 }),
        isAdmin ? api.getList<User[]>('/users', { search: q, limit: 5 }) : Promise.resolve({ data: [] as User[] }),
      ]);
      setResults({
        products: products.status === 'fulfilled' ? products.value.data : [],
        orders: orders.status === 'fulfilled' ? orders.value.data : [],
        users: users.status === 'fulfilled' ? users.value.data : [],
      });
      setLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [query, isAdmin]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const hasResults = results.products.length || results.orders.length || results.users.length;
  const showDropdown = open && query.trim().length >= 2;

  function go(path: string) {
    setOpen(false);
    setQuery('');
    router.push(path);
  }

  return (
    <div ref={wrapRef} className="relative flex-1">
      <Search className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-navy-300" />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setOpen(true)}
        placeholder="Search orders, products, customers…"
        className="h-11 w-full rounded-xl border border-white/15 bg-white/10 pl-11 pr-16 text-base text-white placeholder:text-navy-300 outline-none transition focus:border-white/30 focus:bg-white/15"
      />
      <kbd className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-white/15 bg-white/10 px-1.5 py-0.5 text-xs font-medium text-navy-300 sm:block">
        ⌘ K
      </kbd>

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[70vh] overflow-auto rounded-xl border border-border bg-white p-2 text-body shadow-[0_18px_50px_-20px_rgba(6,47,79,0.4)]">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-6 text-base text-muted">
              <Loader2 className="h-4 w-4 animate-spin" /> Searching…
            </div>
          ) : !hasResults ? (
            <p className="px-3 py-6 text-center text-base text-muted">No matches for &ldquo;{query}&rdquo;</p>
          ) : (
            <>
              {results.products.length > 0 && (
                <SearchGroup icon={<Package className="h-3.5 w-3.5" />} label="Products">
                  {results.products.map((p) => (
                    <SearchRow key={p._id} title={p.name} subtitle={p.skuid} onClick={() => go('/products')} />
                  ))}
                </SearchGroup>
              )}
              {results.orders.length > 0 && (
                <SearchGroup icon={<ShoppingCart className="h-3.5 w-3.5" />} label="Orders">
                  {results.orders.map((o) => (
                    <SearchRow
                      key={o._id}
                      title={o.orderId}
                      subtitle={typeof o.user === 'object' && o.user ? `${o.user.firstName} ${o.user.lastName}` : o.guestCustomer?.name ?? '—'}
                      onClick={() => go(`/orders/${o._id}`)}
                    />
                  ))}
                </SearchGroup>
              )}
              {results.users.length > 0 && (
                <SearchGroup icon={<Users className="h-3.5 w-3.5" />} label="Customers">
                  {results.users.map((u) => (
                    <SearchRow key={u.id} title={`${u.firstName} ${u.lastName}`} subtitle={u.email} onClick={() => go('/users')} />
                  ))}
                </SearchGroup>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function SearchGroup({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="mb-1 last:mb-0">
      <p className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
        {icon} {label}
      </p>
      {children}
    </div>
  );
}

function SearchRow({ title, subtitle, onClick }: { title: string; subtitle?: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full flex-col items-start rounded-lg px-3 py-2 text-left transition hover:bg-primary-light"
    >
      <span className="text-base font-medium text-heading">{title}</span>
      {subtitle && <span className="text-sm text-muted">{subtitle}</span>}
    </button>
  );
}

/* ── Notifications: real backend-backed feed with unread count + mark read ── */
function NotificationsMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      const res = await request<Notification[]>('/notifications', { query: { limit: 10 } });
      setItems(res.data);
      const count = (res.meta as { unreadCount?: number } | undefined)?.unreadCount;
      if (typeof count === 'number') setUnreadCount(count);
    } catch {
      /* silent — notification bell shouldn't break the shell */
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  async function openNotification(n: Notification) {
    setOpen(false);
    router.push(n.link);
    try {
      await api.patch(`/notifications/${n._id}/read`);
      load();
    } catch {
      /* ignore */
    }
  }

  async function markAllRead() {
    try {
      await api.post('/notifications/read-all');
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to update');
    }
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-xl p-2.5 text-navy-100 transition hover:bg-white/10"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 animate-pulse items-center justify-center rounded-full bg-error px-1 text-[9px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-white text-body shadow-[0_18px_50px_-20px_rgba(6,47,79,0.4)]">
          <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
            <p className="text-base font-semibold text-heading">Notifications</p>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-sm font-medium text-primary hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-auto">
            {items.length === 0 ? (
              <p className="px-3 py-6 text-center text-base text-muted">You&apos;re all caught up.</p>
            ) : (
              items.map((n) => {
                const unread = !n.readBy?.length;
                return (
                  <button
                    key={n._id}
                    onClick={() => openNotification(n)}
                    className={cn(
                      'flex w-full flex-col items-start gap-0.5 border-b border-border/60 px-3 py-2.5 text-left transition last:border-0 hover:bg-primary-light',
                      unread && 'bg-primary-light/40',
                    )}
                  >
                    <div className="flex w-full items-center gap-2">
                      {unread && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                      <span className="text-base font-medium text-heading">{n.title}</span>
                    </div>
                    <span className="text-sm text-muted">{n.message}</span>
                    <span className="text-xs text-muted">{timeAgo(n.createdAt)}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Profile: avatar dropdown with Settings + Logout ── */
function ProfileMenu() {
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const clear = useAuth((s) => s.clear);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  async function logout() {
    try {
      await api.post('/auth/logout', undefined, false);
    } catch {
      /* ignore */
    }
    clear();
    toast.info('Logged out');
    router.replace('/login');
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        title="My account"
        className="ml-2 flex items-center gap-3 rounded-xl border-l border-white/15 py-1 pl-3 pr-1 transition hover:bg-white/10"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-base font-bold text-white ring-2 ring-white/20">
          {user?.firstName?.[0] ?? 'A'}
        </div>
        <div className="hidden leading-tight sm:block">
          <p className="text-base font-semibold text-white">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="text-sm text-navy-300">{user?.email}</p>
        </div>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl border border-border bg-white p-1.5 text-body shadow-[0_18px_50px_-20px_rgba(6,47,79,0.4)]">
          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-base font-medium text-body transition hover:bg-primary-light hover:text-primary"
          >
            <Settings className="h-4 w-4" /> Settings
          </Link>
          <button
            onClick={logout}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-base font-medium text-error transition hover:bg-error/10"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      )}
    </div>
  );
}

export function Topbar() {
  const toggleSidebar = useUI((s) => s.toggleSidebar);

  return (
    <header className="sticky top-0 z-10 flex items-center gap-4 border-b border-white/10 bg-navy-900 px-4 py-3 sm:px-6">
      <button
        onClick={toggleSidebar}
        className="rounded-xl p-2 text-navy-100 transition hover:bg-white/10 lg:hidden"
        aria-label="Toggle menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <QuickSearch />

      <div className="flex shrink-0 items-center gap-2">
        <button
          onClick={() => toast.info('Mail is coming soon')}
          title="Mail — coming soon"
          className="relative rounded-xl p-2.5 text-navy-100 transition hover:bg-white/10"
        >
          <Mail className="h-5 w-5" />
        </button>

        <NotificationsMenu />
        <ProfileMenu />
      </div>
    </header>
  );
}
