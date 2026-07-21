'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { LogOut, Droplet, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { cn } from '@/lib/format';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';
import { useAuth } from '@/lib/auth-store';
import { useUI } from '@/lib/ui-store';
import { navForRole, GROUP_LABELS, type NavItem } from '@/lib/access';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clear } = useAuth();
  const { sidebarOpen, closeSidebar, collapsed, toggleCollapsed } = useUI();

  const items = navForRole(user?.role ?? 'admin');
  const main = items.filter((i) => i.group === 'main');
  const content = items.filter((i) => i.group === 'content');
  const general = items.filter((i) => i.group === 'general');

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

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  const renderItem = (item: NavItem) => {
    const Icon = item.icon;
    const active = isActive(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={closeSidebar}
        title={collapsed ? item.label : undefined}
        className={cn(
          'group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors duration-200',
          collapsed && 'lg:justify-center lg:px-0',
          active ? 'text-navy-900' : 'text-navy-100 hover:bg-white hover:text-navy-900',
        )}
      >
        {active && (
          <motion.span
            aria-hidden
            layoutId="sidebar-active-pill"
            className="absolute inset-0 rounded-xl bg-white shadow-sm shadow-navy-900/15"
            transition={{ type: 'spring', stiffness: 850, damping: 42, mass: 0.5 }}
          />
        )}
        <Icon className="relative z-10 h-[18px] w-[18px] shrink-0" />
        <span className={cn('relative z-10', collapsed && 'lg:hidden')}>{item.label}</span>
      </Link>
    );
  };

  const groupLabel = (text: string) => (
    <p
      className={cn(
        'mb-1 mt-5 px-3 text-[11px] font-semibold uppercase tracking-wider text-navy-300',
        collapsed && 'lg:hidden',
      )}
    >
      {text}
    </p>
  );

  return (
    <>
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-heading/40 lg:hidden" onClick={closeSidebar} aria-hidden />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex h-screen w-64 shrink-0 flex-col overflow-hidden border-r border-white/10 bg-gradient-to-b from-navy-600 to-navy-800 px-4 py-6 text-white transition-[transform,width] lg:static lg:translate-x-0',
          collapsed && 'lg:w-[74px] lg:px-3',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Brand + collapse toggle */}
        <div className={cn('relative z-10 flex items-center gap-2 px-2', collapsed && 'lg:justify-center lg:px-0')}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
            <Droplet className="h-6 w-6 text-white" fill="currentColor" />
          </div>
          <div className={cn('leading-tight', collapsed && 'lg:hidden')}>
            <p className="text-sm font-extrabold text-white">RO TECHNICAL</p>
            <p className="text-[10px] tracking-[0.3em] text-navy-200">XPERTS</p>
          </div>
          <button
            onClick={toggleCollapsed}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand' : 'Collapse'}
            className={cn(
              'ml-auto hidden rounded-lg p-1.5 text-navy-200 transition hover:bg-white/10 hover:text-white lg:block',
              collapsed && 'lg:hidden',
            )}
          >
            <PanelLeftClose className="h-[18px] w-[18px]" />
          </button>
        </div>

        {collapsed && (
          <button
            onClick={toggleCollapsed}
            aria-label="Expand sidebar"
            title="Expand"
            className="relative z-10 mt-4 hidden place-items-center rounded-xl py-2 text-navy-200 transition hover:bg-white/10 hover:text-white lg:grid"
          >
            <PanelLeftOpen className="h-[18px] w-[18px]" />
          </button>
        )}

        {/* Nav — driven by the central access config, filtered by role */}
        <nav className="relative z-10 mt-8 flex flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden">
          {main.map(renderItem)}
          {content.length > 0 && groupLabel(GROUP_LABELS.content)}
          {content.map(renderItem)}
          {general.length > 0 && groupLabel(GROUP_LABELS.general)}
          {general.map(renderItem)}
        </nav>

        {/* User + logout */}
        <div className="relative z-10 mt-4 border-t border-white/10 pt-4">
          <div className={cn('flex items-center gap-3 px-2', collapsed && 'lg:justify-center lg:px-0')}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-white">
              {user?.firstName?.[0] ?? 'A'}
            </div>
            <div className={cn('min-w-0 flex-1 leading-tight', collapsed && 'lg:hidden')}>
              <p className="truncate text-sm font-semibold text-white">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="truncate text-xs capitalize text-navy-200">
                {user?.role?.replace('_', ' ')}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            title={collapsed ? 'Logout' : undefined}
            className={cn(
              'mt-3 flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-navy-100 transition hover:bg-error/20 hover:text-white',
              collapsed && 'lg:justify-center lg:px-0',
            )}
          >
            <LogOut className="h-[18px] w-[18px] shrink-0" />
            <span className={cn(collapsed && 'lg:hidden')}>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
