import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  FolderTree,
  Users,
  Star,
  BadgeCheck,
  Wrench,
  ClipboardList,
  Settings,
  TerminalSquare,
  CircleUser,
  ShieldCheck,
} from 'lucide-react';
import type { Role } from './types';

/**
 * ── Central access control ──────────────────────────────────────────────────
 * ONE place that decides what each role sees and can reach. To change a panel's
 * scope (admin / microadmin / call_center), edit the `roles` here — the sidebar,
 * route guard, and landing redirect all read from this. Lets each role's panel
 * be reasoned about / worked on independently.
 *
 * Roles:
 *   admin       — everything.
 *   microadmin  — Orders (no pricing), Repair Requests, AMC Enquiries. Nothing else.
 *   call_center — same operational set as microadmin (calls/orders/service).
 *   customer    — no dashboard access (bounced at login).
 */

export type NavGroup = 'main' | 'content' | 'general';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: Role[];
  group: NavGroup;
}

const STAFF_OPS: Role[] = ['admin', 'microadmin', 'call_center'];
const ADMIN_ONLY: Role[] = ['admin'];
const EVERYONE: Role[] = ['admin', 'microadmin', 'call_center'];

export const NAV: NavItem[] = [
  { href: '/', label: 'Overview', icon: LayoutDashboard, roles: ADMIN_ONLY, group: 'main' },
  { href: '/orders', label: 'Orders', icon: ShoppingCart, roles: STAFF_OPS, group: 'main' },
  { href: '/products', label: 'Products', icon: Package, roles: ADMIN_ONLY, group: 'main' },
  { href: '/categories', label: 'Categories', icon: FolderTree, roles: ADMIN_ONLY, group: 'main' },
  { href: '/users', label: 'Customers', icon: Users, roles: ADMIN_ONLY, group: 'main' },

  { href: '/reviews', label: 'Testimonials', icon: Star, roles: ADMIN_ONLY, group: 'content' },
  { href: '/certifications', label: 'Certifications', icon: BadgeCheck, roles: ADMIN_ONLY, group: 'content' },
  { href: '/repair-requests', label: 'Repair Requests', icon: Wrench, roles: STAFF_OPS, group: 'content' },
  { href: '/amc-enquiries', label: 'AMC Enquiries', icon: ClipboardList, roles: STAFF_OPS, group: 'content' },

  { href: '/profile', label: 'My Profile', icon: CircleUser, roles: EVERYONE, group: 'general' },
  { href: '/login-logs', label: 'Login Logs', icon: ShieldCheck, roles: ADMIN_ONLY, group: 'general' },
  { href: '/settings', label: 'Settings', icon: Settings, roles: ADMIN_ONLY, group: 'general' },
  { href: '/api-tester', label: 'API Tester', icon: TerminalSquare, roles: ADMIN_ONLY, group: 'general' },
];

export const GROUP_LABELS: Record<Exclude<NavGroup, 'main'>, string> = {
  content: 'Content & Support',
  general: 'General',
};

/** Nav items visible to a role, in declared order. */
export function navForRole(role: Role): NavItem[] {
  return NAV.filter((n) => n.roles.includes(role));
}

/** Match a pathname to its nav item (root or nested). */
function itemForPath(path: string): NavItem | undefined {
  return NAV.find((n) => (n.href === '/' ? path === '/' : path.startsWith(n.href)));
}

/** Can this role open this path? Unknown routes are allowed (e.g. not-found). */
export function canAccess(role: Role, path: string): boolean {
  const item = itemForPath(path);
  return item ? item.roles.includes(role) : true;
}

/** Where a role should land after login (first accessible operational page). */
export function defaultRouteFor(role: Role): string {
  const first = NAV.find(
    (n) => n.roles.includes(role) && n.group !== 'general',
  );
  return first?.href ?? '/profile';
}

/* ── Permission flags ── */

/** Only admins see money (order amounts, revenue). Microadmin/call center do not. */
export function canSeePricing(role: Role): boolean {
  return role === 'admin';
}
