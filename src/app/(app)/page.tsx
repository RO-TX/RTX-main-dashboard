'use client';

import {
  ShoppingCart,
  Users,
  Package,
  IndianRupee,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import { formatCurrency, formatDateTime, cn } from '@/lib/format';
import { Card, Loading, ErrorState, StatusBadge } from '@/components/ui';
import type { Overview, RevenuePoint, Order } from '@/lib/types';

export default function OverviewPage() {
  const { data: overview, loading, error } = useApi<Overview>(
    () => api.get<Overview>('/analytics/overview'),
    [],
  );
  const { data: series } = useApi<RevenuePoint[]>(
    () => api.get<RevenuePoint[]>('/analytics/revenue-series', { days: 7 }),
    [],
  );
  const { data: recent } = useApi<Order[]>(
    () => api.get<Order[]>('/analytics/recent-orders', { limit: 6 }),
    [],
  );

  if (loading) return <Loading label="Loading dashboard…" />;
  if (error || !overview) return <ErrorState message={error ?? 'Failed to load'} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-heading">Welcome back! 👋</h1>
        <p className="mt-1 text-sm text-muted">Here&apos;s what&apos;s happening across RTX today.</p>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          highlight
          label="Total Revenue"
          value={formatCurrency(overview.revenue)}
          icon={<IndianRupee className="h-5 w-5" />}
          sub="From completed payments"
        />
        <KpiCard
          label="Total Orders"
          value={overview.totalOrders}
          icon={<ShoppingCart className="h-5 w-5" />}
          sub={`${overview.ordersByStatus?.delivered ?? 0} delivered`}
        />
        <KpiCard
          label="Customers"
          value={overview.totalUsers}
          icon={<Users className="h-5 w-5" />}
          sub="Registered customers"
        />
        <KpiCard
          label="Products"
          value={overview.totalProducts}
          icon={<Package className="h-5 w-5" />}
          sub={`${overview.lowStock} low on stock`}
          warn={overview.lowStock > 0}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue chart */}
        <Card className="lg:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-heading">Revenue Analytics</h2>
              <p className="text-xs text-muted">Last 7 days</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-lg bg-primary-light px-2.5 py-1 text-xs font-semibold text-primary">
              <TrendingUp className="h-3.5 w-3.5" /> This Week
            </span>
          </div>
          <RevenueLine series={series ?? []} />
        </Card>

        {/* Orders by status */}
        <Card>
          <h2 className="mb-4 font-bold text-heading">Orders by Status</h2>
          <StatusBreakdown data={overview.ordersByStatus} total={overview.totalOrders} />
          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border-light pt-4">
            <MiniStat label="Pending Repairs" value={overview.pendingRepairs} />
            <MiniStat label="New Enquiries" value={overview.newEnquiries} />
          </div>
        </Card>
      </div>

      {/* Recent orders */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-bold text-heading">Recent Orders</h2>
          <a href="/orders" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
            View all <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-muted">
                <th className="pb-3 font-semibold">Order</th>
                <th className="pb-3 font-semibold">Customer</th>
                <th className="pb-3 font-semibold">Amount</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody>
              {(recent ?? []).map((o) => (
                <tr key={o._id} className="border-t border-border-light">
                  <td className="py-3 font-medium text-heading">{o.orderId}</td>
                  <td className="py-3">
                    {typeof o.user === 'object' && o.user
                      ? `${o.user.firstName} ${o.user.lastName}`
                      : '—'}
                  </td>
                  <td className="py-3 font-semibold text-heading">{formatCurrency(o.totalAmount)}</td>
                  <td className="py-3">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="py-3 text-muted">{formatDateTime(o.createdAt)}</td>
                </tr>
              ))}
              {(!recent || recent.length === 0) && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted">
                    No orders yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon,
  sub,
  highlight,
  warn,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  sub?: string;
  highlight?: boolean;
  warn?: boolean;
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl p-5',
        highlight
          ? 'border border-navy-700 bg-gradient-to-br from-navy-600 via-navy-800 to-navy-900 text-white shadow-lg shadow-navy-900/25'
          : 'glass-card',
      )}
    >
      {highlight && (
        <>
          {/* pale steel light diffusing up through deep water */}
          <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-navy-300/40 blur-2xl" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
        </>
      )}
      <div className="relative flex items-start justify-between">
        <span className={cn('text-sm font-medium', highlight ? 'text-white/80' : 'text-muted')}>
          {label}
        </span>
        <span
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-xl',
            highlight ? 'bg-white/15 text-white' : 'bg-primary-light text-primary',
          )}
        >
          {icon}
        </span>
      </div>
      <p className={cn('relative mt-3 text-3xl font-extrabold', highlight ? 'text-white' : 'text-heading')}>
        {value}
      </p>
      {sub && (
        <p
          className={cn(
            'relative mt-1 flex items-center gap-1 text-xs',
            highlight ? 'text-white/70' : warn ? 'text-warning' : 'text-muted',
          )}
        >
          {warn && <AlertTriangle className="h-3.5 w-3.5" />}
          {sub}
        </p>
      )}
    </div>
  );
}

function RevenueLine({ series }: { series: RevenuePoint[] }) {
  if (series.length === 0) return <div className="h-56" />;
  const max = Math.max(1, ...series.map((s) => s.revenue));
  const W = 720;
  const H = 240;
  const pad = { l: 26, r: 26, t: 24, b: 40 };
  const plotW = W - pad.l - pad.r;
  const plotH = H - pad.t - pad.b;
  const n = series.length;
  const xAt = (i: number) => (n <= 1 ? pad.l + plotW / 2 : pad.l + (i / (n - 1)) * plotW);
  const yAt = (v: number) => pad.t + plotH - (v / max) * plotH;
  const pts = series.map((s, i) => ({ ...s, x: xAt(i), y: yAt(s.revenue) }));
  const line = pts.map((p, i) => `${i ? 'L' : 'M'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const baseY = pad.t + plotH;
  const area = `M ${pts[0].x.toFixed(1)} ${baseY} ${pts
    .map((p) => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ')} L ${pts[n - 1].x.toFixed(1)} ${baseY} Z`;
  const day = (d: string) => new Date(d).toLocaleDateString('en-IN', { weekday: 'short' });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-56 w-full overflow-visible">
      <defs>
        <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#062f4f" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#062f4f" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* gridlines */}
      {[0, 0.5, 1].map((t) => (
        <line
          key={t}
          x1={pad.l}
          x2={W - pad.r}
          y1={pad.t + plotH * (1 - t)}
          y2={pad.t + plotH * (1 - t)}
          className="stroke-border"
          strokeWidth="1"
          strokeDasharray="3 5"
          vectorEffect="non-scaling-stroke"
        />
      ))}
      <path d={area} fill="url(#revFill)" />
      <path
        d={line}
        fill="none"
        className="stroke-primary"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      {pts.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="4.5"
          className="fill-surface stroke-primary"
          strokeWidth="2.5"
          vectorEffect="non-scaling-stroke"
        >
          <title>{formatCurrency(p.revenue)}</title>
        </circle>
      ))}
      {pts.map((p, i) => (
        <text key={`t${i}`} x={p.x} y={H - 14} textAnchor="middle" className="fill-muted" fontSize="15">
          {day(p.date)}
        </text>
      ))}
    </svg>
  );
}

const STATUS_ORDER = ['orderplaced', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];

function StatusBreakdown({ data, total }: { data: Record<string, number>; total: number }) {
  const entries = STATUS_ORDER.filter((s) => data[s]).map((s) => [s, data[s]] as const);
  if (entries.length === 0) return <p className="text-sm text-muted">No orders yet.</p>;
  return (
    <div className="space-y-3">
      {entries.map(([status, count]) => (
        <div key={status}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="capitalize text-body">{status}</span>
            <span className="font-semibold text-heading">{count}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-alt">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${Math.round((count / Math.max(total, 1)) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-surface-alt p-3">
      <p className="text-2xl font-extrabold text-heading">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
