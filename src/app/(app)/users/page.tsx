'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { toast } from '@/lib/toast';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/lib/auth-store';
import { formatDate } from '@/lib/format';
import {
  PageHeader,
  Table,
  Th,
  Td,
  Loading,
  ErrorState,
  EmptyState,
  StatusBadge,
  Button,
  StatusSelect,
} from '@/components/ui';
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
        <>
          <Table>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Mobile</Th>
                <Th>Role</Th>
                <Th>Joined</Th>
                {isAdmin && <Th>Change Role</Th>}
              </tr>
            </thead>
            <tbody>
              {data.data.map((u) => (
                <tr key={u.id}>
                  <Td className="font-medium text-heading">
                    {u.firstName} {u.lastName}
                  </Td>
                  <Td className="text-muted">{u.email}</Td>
                  <Td>{u.mobile || '—'}</Td>
                  <Td>
                    <StatusBadge status={ROLE_LABEL[u.role] ?? u.role} />
                  </Td>
                  <Td className="text-muted">{formatDate((u as unknown as { createdAt: string }).createdAt)}</Td>
                  {isAdmin && (
                    <Td>
                      {u.id === me?.id ? (
                        <span className="text-xs text-muted">You</span>
                      ) : (
                        <StatusSelect
                          ariaLabel="Change role"
                          value={u.role}
                          onChange={(v) => changeRole(u.id, v)}
                          options={[...ROLES]}
                          format={(r) => ROLE_LABEL[r] ?? r}
                        />
                      )}
                    </Td>
                  )}
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
