'use client';

import { useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { toast } from '@/lib/toast';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/lib/auth-store';
import { canSeePricing } from '@/lib/access';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { PageHeader, Table, Th, Td, Loading, ErrorState, EmptyState, StatusBadge, StatusSelect } from '@/components/ui';
import { FilterChip, Pager } from '@/components/table-controls';
import type { Order, Pagination } from '@/lib/types';

const STATUSES = [
  'orderplaced',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
];

export default function OrdersPage() {
  const role = useAuth((s) => s.user?.role) ?? 'admin';
  const showPricing = canSeePricing(role);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, loading, error, refetch } = useApi<{ data: Order[]; pagination?: Pagination }>(
    () => api.getList<Order[]>('/orders', { status: status || undefined, page, limit: 15 }),
    [status, page],
  );

  async function changeStatus(id: string, newStatus: string) {
    try {
      await api.patch(`/orders/${id}/status`, { status: newStatus });
      toast.success(`Order marked ${newStatus}`);
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to update order');
    }
  }

  return (
    <div>
      <PageHeader title="Orders" subtitle="Manage and fulfil customer orders." />

      <div className="mb-4 flex flex-wrap gap-2">
        <FilterChip active={status === ''} onClick={() => { setStatus(''); setPage(1); }}>
          All
        </FilterChip>
        {STATUSES.map((s) => (
          <FilterChip key={s} active={status === s} onClick={() => { setStatus(s); setPage(1); }}>
            {s}
          </FilterChip>
        ))}
      </div>

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} />
      ) : !data || data.data.length === 0 ? (
        <EmptyState message="No orders found." />
      ) : (
        <>
          <Table>
            <thead>
              <tr>
                <Th>Order ID</Th>
                <Th>Customer</Th>
                <Th>Items</Th>
                {showPricing && <Th>Amount</Th>}
                <Th>Payment</Th>
                <Th>Status</Th>
                <Th>Date</Th>
                <Th>Update</Th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((o) => (
                <tr key={o._id}>
                  <Td className="font-semibold text-heading">{o.orderId}</Td>
                  <Td>
                    {typeof o.user === 'object' && o.user
                      ? `${o.user.firstName} ${o.user.lastName}`
                      : '—'}
                  </Td>
                  <Td>{o.items?.length ?? 0}</Td>
                  {showPricing && (
                    <Td className="font-semibold text-heading">{formatCurrency(o.totalAmount)}</Td>
                  )}
                  <Td>
                    <StatusBadge status={o.paymentStatus} />
                  </Td>
                  <Td>
                    <StatusBadge status={o.status} />
                  </Td>
                  <Td className="text-muted">{formatDateTime(o.createdAt)}</Td>
                  <Td>
                    <StatusSelect
                      ariaLabel="Update order status"
                      value={o.status}
                      onChange={(v) => changeStatus(o._id, v)}
                      options={STATUSES}
                    />
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
          <Pager pagination={data.pagination} onPage={setPage} />
        </>
      )}
    </div>
  );
}
