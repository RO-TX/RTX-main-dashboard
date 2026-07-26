'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import { formatDateTime, cn } from '@/lib/format';
import { PageHeader, DataTable, DetailPanel, Loading, ErrorState, EmptyState } from '@/components/ui';
import type { DataTableColumn } from '@/components/ui';
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
  const [selected, setSelected] = useState<LoginLog | null>(null);

  const { data, loading, error } = useApi<{ data: LoginLog[]; pagination?: Pagination }>(
    () => api.getList<LoginLog[]>('/auth/login-logs', { success, page, limit: 20 }),
    [success, page],
  );

  const columns: DataTableColumn<LoginLog>[] = [
    {
      key: 'result',
      label: 'Result',
      render: (l) =>
        l.success ? (
          <span className="inline-flex items-center gap-1.5 text-success">
            <CheckCircle2 className="h-4 w-4" /> Success
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-error">
            <XCircle className="h-4 w-4" /> Failed
          </span>
        ),
    },
    { key: 'email', label: 'Email', render: (l) => <span className="font-medium text-heading">{l.email}</span> },
    { key: 'role', label: 'Role', render: (l) => <span className="text-muted">{l.user?.role ?? '—'}</span> },
    { key: 'ip', label: 'IP', render: (l) => <span className="text-muted">{l.ip ?? '—'}</span> },
    {
      key: 'device',
      label: 'Device',
      className: 'max-w-xs truncate',
      render: (l) => <span className="text-muted" title={l.userAgent}>{l.userAgent ?? '—'}</span>,
    },
    { key: 'when', label: 'When', className: 'whitespace-nowrap', render: (l) => <span className="text-muted">{formatDateTime(l.createdAt)}</span> },
  ];

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
        <div className="flex items-start gap-4">
          <div className={cn('min-w-0 flex-1 transition-all duration-300', selected && 'lg:max-w-[calc(100%-400px)]')}>
            <DataTable columns={columns} data={data.data} getRowId={(l) => l._id} onRowClick={setSelected} selectedId={selected?._id} />
            <Pager pagination={data.pagination} onPage={setPage} />
          </div>
          {selected && (
            <DetailPanel
              title={selected.email}
              subtitle={formatDateTime(selected.createdAt)}
              badge={
                selected.success ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-semibold text-success">
                    <CheckCircle2 className="h-3 w-3" /> Success
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-error/10 px-2 py-0.5 text-xs font-semibold text-error">
                    <XCircle className="h-3 w-3" /> Failed
                  </span>
                )
              }
              onClose={() => setSelected(null)}
              fields={[
                { label: 'Role', value: selected.user?.role ?? '—' },
                { label: 'IP address', value: selected.ip ?? '—' },
                { label: 'Reason', value: selected.reason ?? '—' },
                { label: 'Device / user agent', value: <span className="break-words">{selected.userAgent ?? '—'}</span> },
              ]}
            />
          )}
        </div>
      )}
    </div>
  );
}
