'use client';

import { useState } from 'react';
import { XCircle, Plus, ZoomIn } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import { toast } from '@/lib/toast';
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
  ConfirmButton,
  ImageLightbox,
} from '@/components/ui';
import type { DataTableColumn } from '@/components/ui';
import { CertificationModal } from './CertificationModal';
import type { Certification } from '@/lib/types';

export default function CertificationsPage() {
  const { data, loading, error, refetch } = useApi<Certification[]>(
    () => api.get<Certification[]>('/content/certifications'),
    [],
  );
  const [showCreate, setShowCreate] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selected, setSelected] = useState<Certification | null>(null);

  async function deactivate(id: string) {
    try {
      await api.del(`/content/certifications/${id}`);
      toast.success('Certification deactivated');
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to deactivate');
    }
  }

  const columns: DataTableColumn<Certification>[] = [
    {
      key: 'certificate',
      label: 'Certificate',
      render: (c) => (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setPreview(c.image); }}
            aria-label="View certificate"
            className="grid h-12 w-16 shrink-0 cursor-zoom-in place-items-center overflow-hidden rounded-lg border border-border bg-surface-alt"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={c.image} alt="" className="h-full w-full object-contain" />
          </button>
          <span className="font-medium text-heading">{c.title}</span>
        </div>
      ),
    },
    { key: 'issuedBy', label: 'Issued By', render: (c) => c.issuedBy },
    { key: 'verificationId', label: 'Verification ID', render: (c) => <span className="text-muted">{c.verificationId}</span> },
    { key: 'validTill', label: 'Valid Till', render: (c) => formatDate(c.expiryDate) },
    { key: 'status', label: 'Status', render: (c) => <StatusBadge status={c.isActive ? 'active' : 'inactive'} /> },
    {
      key: 'actions',
      label: '',
      render: (c) =>
        c.isActive && (
          <div onClick={(e) => e.stopPropagation()}>
            <ConfirmButton
              onConfirm={() => deactivate(c._id)}
              title="Deactivate certification"
              className="inline-flex items-center gap-1 rounded-lg p-2 text-muted transition hover:bg-error/10 hover:text-error"
            >
              <XCircle className="h-4 w-4" />
            </ConfirmButton>
          </div>
        ),
    },
  ];

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
        <div className="flex items-start gap-4">
          <div className={cn('min-w-0 flex-1 transition-all duration-300', selected && 'lg:max-w-[calc(100%-400px)]')}>
            <DataTable columns={columns} data={data} getRowId={(c) => c._id} onRowClick={setSelected} selectedId={selected?._id} />
          </div>
          {selected && (
            <DetailPanel
              title={selected.title}
              subtitle={selected.issuedBy}
              badge={<StatusBadge status={selected.isActive ? 'active' : 'inactive'} />}
              onClose={() => setSelected(null)}
              fields={[
                { label: 'Verification ID', value: selected.verificationId },
                { label: 'Issue date', value: formatDate(selected.issueDate) },
                { label: 'Valid till', value: formatDate(selected.expiryDate) },
                { label: 'Description', value: selected.description || '—' },
              ]}
              actions={
                <>
                  <button
                    onClick={() => setPreview(selected.image)}
                    className="flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-body transition hover:bg-surface-alt"
                  >
                    <ZoomIn className="h-4 w-4" /> View certificate
                  </button>
                  {selected.isActive && (
                    <ConfirmButton
                      onConfirm={() => deactivate(selected._id)}
                      title="Deactivate certification"
                      className="rounded-xl border border-error/20 px-4 py-2 text-sm font-semibold text-error transition hover:bg-error/10"
                    >
                      Deactivate
                    </ConfirmButton>
                  )}
                </>
              }
            />
          )}
        </div>
      )}

      <ImageLightbox src={preview} onClose={() => setPreview(null)} />
    </div>
  );
}
