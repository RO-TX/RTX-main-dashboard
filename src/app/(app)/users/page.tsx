'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { toast } from '@/lib/toast';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/lib/auth-store';
import { formatDate, cn } from '@/lib/format';
import {
  PageHeader,
  DataTable,
  DetailPanel,
  Loading,
  ErrorState,
  EmptyState,
  StatusBadge,
  Button,
  StatusSelect,
} from '@/components/ui';
import type { DataTableColumn } from '@/components/ui';
import { FilterChip, Pager } from '@/components/table-controls';
import { UserForm } from './UserForm';
import type { User, Pagination } from '@/lib/types';

const ROLES = ['customer', 'call_center', 'microadmin', 'admin'] as const;
const ROLE_LABEL: Record<string, string> = {
  customer: 'Customer',
  call_center: 'Call Center',
  microadmin: 'Micro Admin',
  admin: 'Admin',
};

export default function UsersPage() {
  const me = useAuth((s) => s.user);
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<User | null>(null);

  const { data, loading, error, refetch } = useApi<{ data: User[]; pagination?: Pagination }>(
    () => api.getList<User[]>('/users', { role: role || undefined, page, limit: 15 }),
    [role, page],
  );

  const isAdmin = me?.role === 'admin';

  async function changeRole(id: string, newRole: string) {
    try {
      await api.patch(`/users/${id}/role`, { role: newRole });
      toast.success(`Role updated to ${ROLE_LABEL[newRole] ?? newRole}`);
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to update role');
    }
  }

  const columns: DataTableColumn<User>[] = [
    {
      key: 'name',
      label: 'Name',
      render: (u) => (
        <span className="font-medium text-heading">
          {u.firstName} {u.lastName}
        </span>
      ),
    },
    { key: 'email', label: 'Email', render: (u) => <span className="text-muted">{u.email}</span> },
    { key: 'mobile', label: 'Mobile', render: (u) => u.mobile || '—' },
    { key: 'role', label: 'Role', render: (u) => <StatusBadge status={ROLE_LABEL[u.role] ?? u.role} /> },
    {
      key: 'joined',
      label: 'Joined',
      render: (u) => (
        <span className="text-muted">{formatDate((u as unknown as { createdAt: string }).createdAt)}</span>
      ),
    },
    ...(isAdmin
      ? [
          {
            key: 'changeRole',
            label: 'Change Role',
            render: (u: User) =>
              u.id === me?.id ? (
                <span className="text-sm text-muted">You</span>
              ) : (
                <div onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                  <StatusSelect
                    ariaLabel="Change role"
                    value={u.role}
                    onChange={(v) => changeRole(u.id, v)}
                    options={[...ROLES]}
                    format={(r) => ROLE_LABEL[r] ?? r}
                  />
                </div>
              ),
          },
        ]
      : []),
  ];

  return (
    <div>
      <PageHeader
        title="Customers & Staff"
        subtitle="All registered accounts — customers, call center, micro admins and admins."
        action={
          isAdmin && (
            <Button onClick={() => setShowCreate((v) => !v)}>
              <Plus className="h-4 w-4" /> Create User
            </Button>
          )
        }
      />

      {showCreate && (
        <UserForm
          onClose={() => setShowCreate(false)}
          onSaved={() => {
            setShowCreate(false);
            refetch();
          }}
        />
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        <FilterChip active={role === ''} onClick={() => { setRole(''); setPage(1); }}>
          All
        </FilterChip>
        {ROLES.map((r) => (
          <FilterChip key={r} active={role === r} onClick={() => { setRole(r); setPage(1); }}>
            {ROLE_LABEL[r]}
          </FilterChip>
        ))}
      </div>

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} />
      ) : !data || data.data.length === 0 ? (
        <EmptyState message="No users found." />
      ) : (
        <div className="flex items-start gap-4">
          <div className={cn('min-w-0 flex-1 transition-all duration-300', selected && 'lg:max-w-[calc(100%-400px)]')}>
            <DataTable
              columns={columns}
              data={data.data}
              getRowId={(u) => u.id}
              onRowClick={setSelected}
              selectedId={selected?.id}
            />
            <Pager pagination={data.pagination} onPage={setPage} />
          </div>
          {selected && (
            <DetailPanel
              title={`${selected.firstName} ${selected.lastName}`}
              subtitle={selected.email}
              badge={<StatusBadge status={ROLE_LABEL[selected.role] ?? selected.role} />}
              onClose={() => setSelected(null)}
              fields={[
                { label: 'Mobile', value: selected.mobile || '—' },
                { label: 'Email verified', value: selected.emailVerified ? 'Yes' : 'No' },
                {
                  label: 'Joined',
                  value: formatDate((selected as unknown as { createdAt: string }).createdAt),
                },
              ]}
              actions={
                isAdmin &&
                selected.id !== me?.id && (
                  <StatusSelect
                    ariaLabel="Change role"
                    value={selected.role}
                    onChange={(v) => changeRole(selected.id, v)}
                    options={[...ROLES]}
                    format={(r) => ROLE_LABEL[r] ?? r}
                  />
                )
              }
            />
          )}
        </div>
      )}
    </div>
  );
}
