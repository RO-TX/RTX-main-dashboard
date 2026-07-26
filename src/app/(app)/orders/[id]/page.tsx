'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, User as UserIcon, MapPin, CreditCard, Package, StickyNote } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/lib/auth-store';
import { canSeePricing } from '@/lib/access';
import { toast } from '@/lib/toast';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { Loading, ErrorState, Card, StatusBadge, StatusSelect } from '@/components/ui';
import type { Order } from '@/lib/types';

const STATUSES = [
  'orderplaced',
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
];

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const role = useAuth((s) => s.user?.role) ?? 'admin';
  const showPricing = canSeePricing(role);
  const { data: order, loading, error, refetch } = useApi<Order>(() => api.get<Order>(`/orders/${id}`), [id]);
  const [adminNotes, setAdminNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  async function changeStatus(newStatus: string) {
    try {
      await api.patch(`/orders/${id}/status`, { status: newStatus });
      toast.success(`Order marked ${newStatus}`);
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to update order');
    }
  }

  async function saveNotes() {
    if (!order) return;
    setSavingNotes(true);
    try {
      await api.patch(`/orders/${id}/status`, { status: order.status, adminNotes });
      toast.success('Notes saved');
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to save notes');
    } finally {
      setSavingNotes(false);
    }
  }

  if (loading) return <Loading />;
  if (error || !order) return <ErrorState message={error ?? 'Order not found'} />;

  const customerName =
    typeof order.user === 'object' && order.user
      ? `${order.user.firstName} ${order.user.lastName}`
      : (order.guestCustomer?.name ?? 'Unknown customer');
  const customerEmail = typeof order.user === 'object' && order.user ? order.user.email : order.guestCustomer?.email;
  const customerMobile =
    (typeof order.user === 'object' && order.user?.mobile) || order.guestCustomer?.mobile || order.shippingAddress?.mobile;
  const isGuest = !order.user;
  const staffName =
    typeof order.createdByStaff === 'object' && order.createdByStaff
      ? `${order.createdByStaff.firstName} ${order.createdByStaff.lastName}`
      : null;

  return (
    <div>
      <Link href="/orders" className="mb-4 inline-flex items-center gap-1.5 text-base font-medium text-muted transition hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Back to orders
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-heading">{order.orderId}</h1>
          <p className="text-base text-muted">Placed {formatDateTime(order.createdAt)}
            {isGuest && staffName && <> · entered manually by {staffName}</>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={order.paymentStatus} />
          <StatusSelect ariaLabel="Update order status" value={order.status} onChange={changeStatus} options={STATUSES} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <p className="mb-3 flex items-center gap-2 text-base font-semibold text-heading">
              <Package className="h-4 w-4 text-primary" /> Items
            </p>
            <div className="space-y-3">
              {order.items.map((it, i) => {
                const p = typeof it.product === 'object' ? it.product : null;
                return (
                  <div key={i} className="flex items-center gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p?.images?.[0]}
                      alt=""
                      className="h-12 w-12 rounded-lg border border-border object-cover bg-surface-alt"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-medium text-heading">{p?.name ?? 'Product'}</p>
                      <p className="text-sm text-muted">
                        {p?.skuid} · Qty {it.quantity}
                      </p>
                    </div>
                    {showPricing && (
                      <p className="text-base font-semibold text-heading">{formatCurrency(it.price * it.quantity)}</p>
                    )}
                  </div>
                );
              })}
            </div>
            {showPricing && (
              <div className="mt-3 flex justify-between border-t border-border pt-3 text-base font-bold text-heading">
                <span>Total</span>
                <span>{formatCurrency(order.totalAmount)}</span>
              </div>
            )}
          </Card>

          <Card>
            <p className="mb-3 flex items-center gap-2 text-base font-semibold text-heading">
              <StickyNote className="h-4 w-4 text-primary" /> Admin notes
            </p>
            {order.adminNotes && <p className="mb-2 rounded-lg bg-surface-alt p-2 text-sm text-body">{order.adminNotes}</p>}
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Add an internal note…"
              rows={2}
              className="w-full rounded-lg border border-border bg-surface p-2 text-base outline-none focus:border-primary focus:ring-2 focus:ring-glow"
            />
            <button
              onClick={saveNotes}
              disabled={savingNotes || !adminNotes.trim()}
              className="mt-2 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {savingNotes ? 'Saving…' : 'Save note'}
            </button>
            {order.notes && (
              <div className="mt-3 border-t border-border pt-3">
                <p className="text-sm font-semibold text-muted">Customer note</p>
                <p className="text-base text-body">{order.notes}</p>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <p className="mb-3 flex items-center gap-2 text-base font-semibold text-heading">
              <UserIcon className="h-4 w-4 text-primary" /> Customer
              {isGuest && (
                <span className="rounded-full bg-border/40 px-2 py-0.5 text-xs font-semibold text-muted">Walk-in</span>
              )}
            </p>
            <p className="text-base font-medium text-heading">{customerName}</p>
            {customerEmail && <p className="text-sm text-muted">{customerEmail}</p>}
            {customerMobile && <p className="text-sm text-muted">{customerMobile}</p>}
          </Card>

          <Card>
            <p className="mb-3 flex items-center gap-2 text-base font-semibold text-heading">
              <MapPin className="h-4 w-4 text-primary" /> Shipping address
            </p>
            {order.shippingAddress ? (
              <p className="text-base text-body">
                {order.shippingAddress.address}, {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                {order.shippingAddress.postalCode}, {order.shippingAddress.country}
              </p>
            ) : (
              <p className="text-base text-muted">No address on file.</p>
            )}
          </Card>

          <Card>
            <p className="mb-3 flex items-center gap-2 text-base font-semibold text-heading">
              <CreditCard className="h-4 w-4 text-primary" /> Payment
            </p>
            <div className="flex items-center justify-between text-base">
              <span className="text-muted">Method</span>
              <span className="font-medium capitalize text-heading">{order.paymentMethod.replace(/_/g, ' ')}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-base">
              <span className="text-muted">Status</span>
              <StatusBadge status={order.paymentStatus} />
            </div>
            {order.deliveredAt && (
              <div className="mt-1 flex items-center justify-between text-base">
                <span className="text-muted">Delivered</span>
                <span className="font-medium text-heading">{formatDateTime(order.deliveredAt)}</span>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
