'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { toast } from '@/lib/toast';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/lib/auth-store';
import { canSeePricing } from '@/lib/access';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { PageHeader, DataTable, Loading, ErrorState, EmptyState, StatusBadge, StatusSelect, Button } from '@/components/ui';
import type { DataTableColumn } from '@/components/ui';
import { FilterChip, Pager } from '@/components/table-controls';
import { ManualOrderModal } from './ManualOrderModal';
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
  const router = useRouter();
  const role = useAuth((s) => s.user?.role) ?? 'admin';
  const showPricing = canSeePricing(role);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);

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

  const columns: DataTableColumn<Order>[] = [
    { key: 'orderId', label: 'Order ID', render: (o) => <span className="font-semibold text-heading">{o.orderId}</span> },
    {
      key: 'customer',
      label: 'Customer',
      render: (o) =>
        typeof o.user === 'object' && o.user
          ? `${o.user.firstName} ${o.user.lastName}`
          : o.guestCustomer
            ? `${o.guestCustomer.name} (walk-in)`
            : '—',
    },
    { key: 'items', label: 'Items', render: (o) => o.items?.length ?? 0 },
    ...(showPricing
      ? [
          {
            key: 'amount',
            label: 'Amount',
            render: (o: Order) => <span className="font-semibold text-heading">{formatCurrency(o.totalAmount)}</span>,
          },
        ]
      : []),
    { key: 'payment', label: 'Payment', render: (o) => <StatusBadge status={o.paymentStatus} /> },
    { key: 'status', label: 'Status', render: (o) => <StatusBadge status={o.status} /> },
    { key: 'date', label: 'Date', render: (o) => <span className="text-muted">{formatDateTime(o.createdAt)}</span> },
    {
      key: 'update',
      label: 'Update',
      render: (o) => (
        <div onClick={(e) => e.stopPropagation()}>
          <StatusSelect ariaLabel="Update order status" value={o.status} onChange={(v) => changeStatus(o._id, v)} options={STATUSES} />
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Orders"
        subtitle="Manage and fulfil customer orders."
        action={
          <Button onClick={() => setShowCreate((v) => !v)}>
            <Plus className="h-4 w-4" /> Create Order
          </Button>
        }
      />

      {showCreate && (
        <ManualOrderModal
          onClose={() => setShowCreate(false)}
          onSaved={() => {
            setShowCreate(false);
            refetch();
          }}
        />
      )}

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
          <DataTable
            columns={columns}
            data={data.data}
            getRowId={(o) => o._id}
            onRowClick={(o) => router.push(`/orders/${o._id}`)}
          />
          <Pager pagination={data.pagination} onPage={setPage} />
        </>
      )}
    </div>
  );
}
