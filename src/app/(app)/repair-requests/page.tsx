'use client';

import { useState } from 'react';
import { Paperclip, ImageIcon, Video, ExternalLink } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { toast } from '@/lib/toast';
import { useApi } from '@/hooks/useApi';
import { formatDate, cn } from '@/lib/format';
import { PageHeader, DataTable, DetailPanel, Loading, ErrorState, EmptyState, StatusBadge, Button } from '@/components/ui';
import type { DataTableColumn } from '@/components/ui';
import { FilterChip, Pager } from '@/components/table-controls';
import type { RepairRequest, RepairAttachment, Pagination } from '@/lib/types';

export default function RepairRequestsPage() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<RepairRequest | null>(null);

  const { data, loading, error, refetch } = useApi<{ data: RepairRequest[]; pagination?: Pagination }>(
    () => api.getList<RepairRequest[]>('/support/repair-requests', { status: status || undefined, page, limit: 15 }),
    [status, page],
  );

  async function toggle(id: string, current: string) {
    const next = current === 'pending' ? 'completed' : 'pending';
    try {
      await api.patch(`/support/repair-requests/${id}`, { status: next });
      toast.success(`Marked ${next}`);
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to update');
    }
  }

  const columns: DataTableColumn<RepairRequest>[] = [
    { key: 'requestId', label: 'Request ID', render: (r) => <span className="font-semibold text-heading">{r.requestId}</span> },
    { key: 'customer', label: 'Customer', render: (r) => r.name },
    { key: 'contact', label: 'Contact', render: (r) => <span className="text-muted">{r.mobile}</span> },
    { key: 'city', label: 'City', render: (r) => r.city },
    { key: 'media', label: 'Media', render: (r) => (r.attachments?.length ? `${r.attachments.length} files` : '—') },
    { key: 'payment', label: 'Payment', render: (r) => <StatusBadge status={r.paymentStatus} /> },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'date', label: 'Date', render: (r) => <span className="text-muted">{formatDate(r.createdAt)}</span> },
    {
      key: 'action',
      label: 'Action',
      render: (r) => (
        <button
          onClick={(e) => { e.stopPropagation(); toggle(r._id, r.status); }}
          className="rounded-lg border border-border bg-surface px-2.5 py-1 text-sm font-semibold text-primary transition hover:bg-primary-light"
        >
          {r.status === 'pending' ? 'Mark done' : 'Reopen'}
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Repair Requests" subtitle="Delhi-NCR home repair bookings — with customer photos & videos of the fault." />

      <div className="mb-4 flex gap-2">
        <FilterChip active={status === ''} onClick={() => { setStatus(''); setPage(1); }}>All</FilterChip>
        <FilterChip active={status === 'pending'} onClick={() => { setStatus('pending'); setPage(1); }}>Pending</FilterChip>
        <FilterChip active={status === 'completed'} onClick={() => { setStatus('completed'); setPage(1); }}>Completed</FilterChip>
      </div>

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} />
      ) : !data || data.data.length === 0 ? (
        <EmptyState message="No repair requests." />
      ) : (
        <div className="flex items-start gap-4">
          <div className={cn('min-w-0 flex-1 transition-all duration-300', selected && 'lg:max-w-[calc(100%-400px)]')}>
            <DataTable columns={columns} data={data.data} getRowId={(r) => r._id} onRowClick={setSelected} selectedId={selected?._id} />
            <Pager pagination={data.pagination} onPage={setPage} />
          </div>
          {selected && (
            <DetailPanel
              title={selected.requestId}
              subtitle={selected.name}
              badge={<StatusBadge status={selected.status} />}
              onClose={() => setSelected(null)}
              fields={[
                { label: 'Mobile', value: selected.mobile },
                { label: 'Email', value: selected.email },
                { label: 'City', value: selected.city },
                { label: 'Pincode', value: selected.pincode },
                { label: 'Payment', value: <StatusBadge status={selected.paymentStatus} /> },
                { label: 'Date', value: formatDate(selected.createdAt) },
              ]}
              actions={
                <Button onClick={() => toggle(selected._id, selected.status)}>
                  {selected.status === 'pending' ? 'Mark done' : 'Reopen'}
                </Button>
              }
            >
              <div>
                <p className="mb-2 text-sm font-semibold text-muted">Issue description</p>
                <p className="text-sm text-body">{selected.description}</p>
              </div>
              {(selected.attachments?.length ?? 0) > 0 && (
                <div className="mt-4">
                  <MediaGallery attachments={selected.attachments!} />
                </div>
              )}
            </DetailPanel>
          )}
        </div>
      )}
    </div>
  );
}

function MediaGallery({ attachments }: { attachments: RepairAttachment[] }) {
  return (
    <div>
      <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-muted">
        <Paperclip className="h-3.5 w-3.5" /> Customer uploads ({attachments.length})
      </p>
      <div className="flex flex-col gap-3">
        {attachments.map((a, i) =>
          a.type === 'video' ? (
            <div key={i} className="overflow-hidden rounded-xl border border-border bg-black">
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <video src={a.url} controls preload="metadata" className="h-40 w-full object-cover" />
              <div className="flex items-center gap-1.5 bg-surface px-2.5 py-1.5 text-sm text-muted">
                <Video className="h-3.5 w-3.5" /> {a.filename ?? 'video'}
              </div>
            </div>
          ) : (
            <a
              key={i}
              href={a.url}
              target="_blank"
              rel="noreferrer"
              className="group relative overflow-hidden rounded-xl border border-border"
              title="Open full size"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={a.url} alt={a.filename ?? 'attachment'} className="h-40 w-full object-cover transition group-hover:scale-105" />
              <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-md bg-heading/60 text-white opacity-0 transition group-hover:opacity-100">
                <ExternalLink className="h-3.5 w-3.5" />
              </span>
              <span className="absolute inset-x-0 bottom-0 flex items-center gap-1.5 bg-heading/60 px-2.5 py-1 text-sm text-white">
                <ImageIcon className="h-3.5 w-3.5" /> {a.filename ?? 'image'}
              </span>
            </a>
          ),
        )}
      </div>
    </div>
  );
}
