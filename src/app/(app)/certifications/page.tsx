'use client';

import { useState } from 'react';
import { XCircle, Plus } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import { toast } from '@/lib/toast';
import { formatDate } from '@/lib/format';
import { PageHeader, Table, Th, Td, Loading, ErrorState, EmptyState, StatusBadge, Button, ConfirmButton } from '@/components/ui';
import { CertificationModal } from './CertificationModal';
import type { Certification } from '@/lib/types';

export default function CertificationsPage() {
  const { data, loading, error, refetch } = useApi<Certification[]>(
    () => api.get<Certification[]>('/content/certifications'),
    [],
  );
  const [showCreate, setShowCreate] = useState(false);

  async function deactivate(id: string) {
    try {
      await api.del(`/content/certifications/${id}`);
      toast.success('Certification deactivated');
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to deactivate');
    }
  }

  return (
    <div>
      <PageHeader
        title="Certifications"
        subtitle="Company credentials & quality certifications."
        action={
          <Button onClick={() => setShowCreate((v) => !v)}>
            <Plus className="h-4 w-4" /> Add Certification
          </Button>
        }
      />

      {showCreate && (
        <CertificationModal onClose={() => setShowCreate(false)} onSaved={() => { setShowCreate(false); refetch(); }} />
      )}

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} />
      ) : !data || data.length === 0 ? (
        <EmptyState message="No certifications yet." />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Certificate</Th>
              <Th>Issued By</Th>
              <Th>Verification ID</Th>
              <Th>Valid Till</Th>
              <Th>Status</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {data.map((c) => (
              <tr key={c._id}>
                <Td>
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.image} alt="" className="h-10 w-14 rounded-lg border border-border object-cover" />
                    <span className="font-medium text-heading">{c.title}</span>
                  </div>
                </Td>
                <Td>{c.issuedBy}</Td>
                <Td className="text-muted">{c.verificationId}</Td>
                <Td>{formatDate(c.expiryDate)}</Td>
                <Td>
                  <StatusBadge status={c.isActive ? 'active' : 'inactive'} />
                </Td>
                <Td>
                  {c.isActive && (
                    <ConfirmButton
                      onConfirm={() => deactivate(c._id)}
                      title="Deactivate certification"
                      className="inline-flex items-center gap-1 rounded-lg p-2 text-muted transition hover:bg-error/10 hover:text-error"
                    >
                      <XCircle className="h-4 w-4" />
                    </ConfirmButton>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
