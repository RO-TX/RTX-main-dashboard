'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { toast } from '@/lib/toast';
import { useApi } from '@/hooks/useApi';
import { formatDate, cn } from '@/lib/format';
import { PageHeader, DataTable, DetailPanel, Loading, ErrorState, EmptyState, StatusBadge, ConfirmButton, StatusSelect } from '@/components/ui';
import type { DataTableColumn } from '@/components/ui';
import { FilterChip, Pager } from '@/components/table-controls';
import type { AmcEnquiry, Pagination } from '@/lib/types';

const STATUSES = ['new', 'contacted', 'closed'] as const;

export default function AmcEnquiriesPage() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<AmcEnquiry | null>(null);

  const { data, loading, error, refetch } = useApi<{ data: AmcEnquiry[]; pagination?: Pagination }>(
    () => api.getList<AmcEnquiry[]>('/support/amc-enquiries', { status: status || undefined, page, limit: 15 }),
    [status, page],
  );

  async function setStatusOf(id: string, s: string) {
    try {
      await api.patch(`/support/amc-enquiries/${id}`, { status: s });
      toast.success(`Marked ${s}`);
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to update');
    }
  }
  async function remove(id: string) {
    try {
      await api.del(`/support/amc-enquiries/${id}`);
      toast.success('Enquiry deleted');
      setSelected((s) => (s?._id === id ? null : s));
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to delete');
    }
  }

  const columns: DataTableColumn<AmcEnquiry>[] = [
    { key: 'name', label: 'Name', render: (e) => <span className="font-medium text-heading">{e.name}</span> },
    {
      key: 'contact',
      label: 'Contact',
      render: (e) => (
        <div className="text-muted">
          <div>{e.mobile}</div>
          <div className="text-sm">{e.email}</div>
        </div>
      ),
    },
    { key: 'address', label: 'Address', className: 'max-w-[160px] truncate', render: (e) => e.address },
    { key: 'message', label: 'Message', className: 'max-w-[200px] truncate', render: (e) => e.message || '—' },
    { key: 'status', label: 'Status', render: (e) => <StatusBadge status={e.status} /> },
    { key: 'date', label: 'Date', render: (e) => <span className="text-muted">{formatDate(e.createdAt)}</span> },
    {
      key: 'actions',
      label: 'Actions',
      render: (e) => (
        <div className="flex items-center gap-2" onClick={(ev) => ev.stopPropagation()}>
          <StatusSelect ariaLabel="Update enquiry status" value={e.status} onChange={(v) => setStatusOf(e._id, v)} options={[...STATUSES]} />
          <ConfirmButton
            onConfirm={() => remove(e._id)}
            title="Delete enquiry"
            className="rounded-lg p-1.5 text-muted transition hover:bg-error/10 hover:text-error"
          >
            <Trash2 className="h-4 w-4" />
          </ConfirmButton>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="AMC Enquiries" subtitle="Annual maintenance contract leads." />

      <div className="mb-4 flex gap-2">
        <FilterChip active={status === ''} onClick={() => { setStatus(''); setPage(1); }}>All</FilterChip>
        {STATUSES.map((s) => (
          <FilterChip key={s} active={status === s} onClick={() => { setStatus(s); setPage(1); }}>{s}</FilterChip>
        ))}
      </div>

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} />
      ) : !data || data.data.length === 0 ? (
        <EmptyState message="No enquiries." />
      ) : (
        <div className="flex items-start gap-4">
          <div className={cn('min-w-0 flex-1 transition-all duration-300', selected && 'lg:max-w-[calc(100%-400px)]')}>
            <DataTable columns={columns} data={data.data} getRowId={(e) => e._id} onRowClick={setSelected} selectedId={selected?._id} />
            <Pager pagination={data.pagination} onPage={setPage} />
          </div>
          {selected && (
            <DetailPanel
              title={selected.name}
              subtitle={selected.email}
              badge={<StatusBadge status={selected.status} />}
              onClose={() => setSelected(null)}
              fields={[
                { label: 'Mobile', value: selected.mobile },
                { label: 'Address', value: selected.address },
                { label: 'Message', value: selected.message || '—' },
                { label: 'Date', value: formatDate(selected.createdAt) },
              ]}
              actions={
                <>
                  <StatusSelect
                    ariaLabel="Update enquiry status"
                    value={selected.status}
                    onChange={(v) => setStatusOf(selected._id, v)}
                    options={[...STATUSES]}
                  />
                  <ConfirmButton
                    onConfirm={() => remove(selected._id)}
                    title="Delete enquiry"
                    className="rounded-xl border border-error/20 px-4 py-2 text-sm font-semibold text-error transition hover:bg-error/10"
                  >
                    Delete
                  </ConfirmButton>
                </>
              }
            />
          )}
        </div>
      )}
    </div>
  );
}
