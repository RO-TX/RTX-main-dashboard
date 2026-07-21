'use client';

import { Fragment, useState } from 'react';
import { Paperclip, ChevronDown, ImageIcon, Video, ExternalLink } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { toast } from '@/lib/toast';
import { useApi } from '@/hooks/useApi';
import { formatDate, cn } from '@/lib/format';
import { PageHeader, Table, Th, Td, Loading, ErrorState, EmptyState, StatusBadge } from '@/components/ui';
import { FilterChip, Pager } from '@/components/table-controls';
import type { RepairRequest, RepairAttachment, Pagination } from '@/lib/types';

export default function RepairRequestsPage() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);

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
        <>
          <Table>
            <thead>
              <tr>
                <Th>Request ID</Th>
                <Th>Customer</Th>
                <Th>Contact</Th>
                <Th>City</Th>
                <Th>Issue</Th>
                <Th>Media</Th>
                <Th>Payment</Th>
                <Th>Status</Th>
                <Th>Date</Th>
                <Th>Action</Th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((r) => {
                const media = r.attachments ?? [];
                const isOpen = expanded === r._id;
                return (
                  <Fragment key={r._id}>
                    <tr>
                      <Td className="font-semibold text-heading">{r.requestId}</Td>
                      <Td>{r.name}</Td>
                      <Td className="text-muted">{r.mobile}</Td>
                      <Td>{r.city}</Td>
                      <Td className="max-w-[200px] truncate">{r.description}</Td>
                      <Td>
                        {media.length > 0 ? (
                          <button
                            onClick={() => setExpanded(isOpen ? null : r._id)}
                            className={cn(
                              'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition',
                              isOpen
                                ? 'border-primary bg-primary-light text-primary'
                                : 'border-border bg-surface text-body hover:bg-surface-alt',
                            )}
                          >
                            <Paperclip className="h-3.5 w-3.5" />
                            {media.length}
                            <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', isOpen && 'rotate-180')} />
                          </button>
                        ) : (
                          <span className="text-xs text-muted">—</span>
                        )}
                      </Td>
                      <Td><StatusBadge status={r.paymentStatus} /></Td>
                      <Td><StatusBadge status={r.status} /></Td>
                      <Td className="text-muted">{formatDate(r.createdAt)}</Td>
                      <Td>
                        <button
                          onClick={() => toggle(r._id, r.status)}
                          className="rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-primary transition hover:bg-primary-light"
                        >
                          {r.status === 'pending' ? 'Mark done' : 'Reopen'}
                        </button>
                      </Td>
                    </tr>
                    {isOpen && media.length > 0 && (
                      <tr>
                        <td colSpan={10} className="border-b border-border-light bg-surface-alt/50 px-4 py-4">
                          <MediaGallery attachments={media} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </Table>
          <Pager pagination={data.pagination} onPage={setPage} />
        </>
      )}
    </div>
  );
}

function MediaGallery({ attachments }: { attachments: RepairAttachment[] }) {
  return (
    <div>
      <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
        <Paperclip className="h-3.5 w-3.5" /> Customer uploads ({attachments.length})
      </p>
      <div className="flex flex-wrap gap-3">
        {attachments.map((a, i) =>
          a.type === 'video' ? (
            <div key={i} className="overflow-hidden rounded-xl border border-border bg-black">
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <video src={a.url} controls preload="metadata" className="h-40 w-64 object-cover" />
              <div className="flex items-center gap-1.5 bg-surface px-2.5 py-1.5 text-xs text-muted">
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
              <img src={a.url} alt={a.filename ?? 'attachment'} className="h-40 w-52 object-cover transition group-hover:scale-105" />
              <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-md bg-heading/60 text-white opacity-0 transition group-hover:opacity-100">
                <ExternalLink className="h-3.5 w-3.5" />
              </span>
              <span className="absolute inset-x-0 bottom-0 flex items-center gap-1.5 bg-heading/60 px-2.5 py-1 text-xs text-white">
                <ImageIcon className="h-3.5 w-3.5" /> {a.filename ?? 'image'}
              </span>
            </a>
          ),
        )}
      </div>
    </div>
  );
}
