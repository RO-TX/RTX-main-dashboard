'use client';

import Link from 'next/link';
import { Bell, Mail, Search, Menu } from 'lucide-react';
import { useAuth } from '@/lib/auth-store';
import { useUI } from '@/lib/ui-store';

export function Topbar() {
  const user = useAuth((s) => s.user);
  const toggleSidebar = useUI((s) => s.toggleSidebar);

  return (
    <header className="sticky top-0 z-10 flex items-center gap-4 border-b border-white/10 bg-gradient-to-r from-navy-700 to-navy-800 px-4 py-3 text-white sm:px-6">
      <button
        onClick={toggleSidebar}
        className="rounded-xl p-2 text-navy-100 transition hover:bg-white/10 lg:hidden"
        aria-label="Toggle menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Search — full length, dark */}
      <div className="relative flex-1">
        <Search className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-navy-200" />
        <input
          placeholder="Search orders, products, customers…"
          className="h-11 w-full rounded-xl border border-white/15 bg-white/10 pl-11 pr-16 text-sm text-white placeholder:text-navy-200 outline-none transition focus:border-white/30 focus:bg-white/15"
        />
        <kbd className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-white/15 bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-navy-200 sm:block">
          ⌘ K
        </kbd>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button className="relative rounded-xl p-2.5 text-navy-100 transition hover:bg-white/10">
          <Mail className="h-5 w-5" />
        </button>
        <button className="relative rounded-xl p-2.5 text-navy-100 transition hover:bg-white/10">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-glow text-[9px] font-bold text-navy-900">
            3
          </span>
        </button>

        <Link
          href="/profile"
          title="My profile"
          className="ml-2 flex items-center gap-3 rounded-xl border-l border-white/15 py-1 pl-3 pr-1 transition hover:bg-white/10"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-sm font-bold text-white">
            {user?.firstName?.[0] ?? 'A'}
          </div>
          <div className="hidden leading-tight sm:block">
            <p className="text-sm font-semibold text-white">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-navy-200">{user?.email}</p>
          </div>
        </Link>
      </div>
    </header>
  );
}
