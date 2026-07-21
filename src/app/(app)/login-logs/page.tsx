'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import { formatDateTime } from '@/lib/format';
import { PageHeader, Table, Th, Td, Loading, ErrorState, EmptyState } from '@/components/ui';
import { FilterChip, Pager } from '@/components/table-controls';
import type { LoginLog, Pagination } from '@/lib/types';

const FILTERS = [
  { label: 'All', value: undefined },
  { label: 'Successful', value: 'true' },
  { label: 'Failed', value: 'false' },
] as const;

export default function LoginLogsPage() {
  const [success, setSuccess] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);

  const { data, loading, error } = useApi<{ data: LoginLog[]; pagination?: Pagination }>(
    () => api.getList<LoginLog[]>('/auth/login-logs', { success, page, limit: 20 }),
    [success, page],
  );

  return (
    <div>
      <PageHeader title="Login Logs" subtitle="Every login attempt, successful or failed — kept for security audit." />

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <FilterChip
            key={f.label}
            active={success === f.value}
            onClick={() => {
              setSuccess(f.value);
              setPage(1);
            }}
          >
            {f.label}
          </FilterChip>
        ))}
      </div>

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} />
      ) : !data || data.data.length === 0 ? (
        <EmptyState message="No login attempts recorded." />
      ) : (
        <>
          <Table>
            <thead>
              <tr>
                <Th>Result</Th>
                <Th>Email</Th>
                <Th>Role</Th>
                <Th>IP</Th>
                <Th>Device</Th>
                <Th>When</Th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((l) => (
                <tr key={l._id}>
                  <Td>
                    {l.success ? (
                      <span className="inline-flex items-center gap-1.5 text-success">
                        <CheckCircle2 className="h-4 w-4" /> Success
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-error">
                        <XCircle className="h-4 w-4" /> Failed
                      </span>
                    )}
                  </Td>
                  <Td className="font-medium text-heading">{l.email}</Td>
                  <Td className="text-muted">{l.user?.role ?? '—'}</Td>
                  <Td className="text-muted">{l.ip ?? '—'}</Td>
                  <Td className="max-w-xs truncate text-muted">
                    <span title={l.userAgent}>{l.userAgent ?? '—'}</span>
                  </Td>
                  <Td className="whitespace-nowrap text-muted">{formatDateTime(l.createdAt)}</Td>
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
