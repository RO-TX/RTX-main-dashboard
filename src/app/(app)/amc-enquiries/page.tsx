'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { toast } from '@/lib/toast';
import { useApi } from '@/hooks/useApi';
import { formatDate } from '@/lib/format';
import { PageHeader, Table, Th, Td, Loading, ErrorState, EmptyState, StatusBadge, ConfirmButton, StatusSelect } from '@/components/ui';
import { FilterChip, Pager } from '@/components/table-controls';
import type { AmcEnquiry, Pagination } from '@/lib/types';

const STATUSES = ['new', 'contacted', 'closed'] as const;

export default function AmcEnquiriesPage() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

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
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to delete');
    }
  }

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
        <>
          <Table>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Contact</Th>
                <Th>Address</Th>
                <Th>Message</Th>
                <Th>Status</Th>
                <Th>Date</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((e) => (
                <tr key={e._id}>
                  <Td className="font-medium text-heading">{e.name}</Td>
                  <Td className="text-muted">
                    <div>{e.mobile}</div>
                    <div className="text-xs">{e.email}</div>
                  </Td>
                  <Td className="max-w-[160px] truncate">{e.address}</Td>
                  <Td className="max-w-[200px] truncate">{e.message || '—'}</Td>
                  <Td><StatusBadge status={e.status} /></Td>
                  <Td className="text-muted">{formatDate(e.createdAt)}</Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <StatusSelect
                        ariaLabel="Update enquiry status"
                        value={e.status}
                        onChange={(v) => setStatusOf(e._id, v)}
                        options={[...STATUSES]}
                      />
                      <ConfirmButton
                        onConfirm={() => remove(e._id)}
                        title="Delete enquiry"
                        className="rounded-lg p-1.5 text-muted transition hover:bg-error/10 hover:text-error"
                      >
                        <Trash2 className="h-4 w-4" />
                      </ConfirmButton>
                    </div>
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
