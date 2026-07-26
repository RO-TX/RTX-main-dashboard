'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
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
  Button,
  ConfirmButton,
} from '@/components/ui';
import type { DataTableColumn } from '@/components/ui';
import { CategoryModal } from './CategoryModal';
import type { Category } from '@/lib/types';

export default function CategoriesPage() {
  const { data, loading, error, refetch } = useApi<Category[]>(
    () => api.get<Category[]>('/catalog/categories', { withProducts: true }),
    [],
  );
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [selected, setSelected] = useState<Category | null>(null);

  async function remove(c: Category) {
    const count = c.products?.length ?? 0;
    try {
      await api.del(`/catalog/categories/${c._id}${count > 0 ? '?force=true' : ''}`);
      toast.success('Category deleted');
      setSelected((s) => (s?._id === c._id ? null : s));
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to delete');
    }
  }

  const columns: DataTableColumn<Category>[] = [
    {
      key: 'category',
      label: 'Category',
      render: (c) => (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={c.catImage} alt="" className="h-10 w-14 rounded-lg border border-border object-cover" />
          <span className="font-medium text-heading">{c.name}</span>
        </div>
      ),
    },
    { key: 'slug', label: 'Slug', render: (c) => <span className="text-muted">{c.slug}</span> },
    {
      key: 'products',
      label: 'Products',
      render: (c) => <span className="font-semibold text-heading">{c.products?.length ?? 0}</span>,
    },
    { key: 'created', label: 'Created', render: (c) => <span className="text-muted">{formatDate(c.createdAt)}</span> },
    {
      key: 'actions',
      label: '',
      render: (c) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setEditing(c)}
            className="rounded-lg p-2 text-muted transition hover:bg-primary-light hover:text-primary"
            title="Edit"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <ConfirmButton
            onConfirm={() => remove(c)}
            title={`Delete "${c.name}"${(c.products?.length ?? 0) > 0 ? ' and its products' : ''}`}
            className="rounded-lg p-2 text-muted transition hover:bg-error/10 hover:text-error"
          >
            <Trash2 className="h-4 w-4" />
          </ConfirmButton>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Categories"
        subtitle="Product groupings shown across the store."
        action={
          <Button onClick={() => { setEditing(null); setShowCreate((v) => !v); }}>
            <Plus className="h-4 w-4" /> Add Category
          </Button>
        }
      />

      {showCreate && (
        <CategoryModal onClose={() => setShowCreate(false)} onSaved={() => { setShowCreate(false); refetch(); }} />
      )}
      {editing && (
        <CategoryModal category={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); refetch(); }} />
      )}

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} />
      ) : !data || data.length === 0 ? (
        <EmptyState message="No categories yet." />
      ) : (
        <div className="flex items-start gap-4">
          <div className={cn('min-w-0 flex-1 transition-all duration-300', selected && 'lg:max-w-[calc(100%-400px)]')}>
            <DataTable columns={columns} data={data} getRowId={(c) => c._id} onRowClick={setSelected} selectedId={selected?._id} />
          </div>
          {selected && (
            <DetailPanel
              title={selected.name}
              subtitle={selected.slug}
              image={selected.catImage}
              onClose={() => setSelected(null)}
              fields={[
                { label: 'Type', value: selected.categoryType },
                { label: 'Products', value: selected.products?.length ?? 0 },
                { label: 'Created', value: formatDate(selected.createdAt) },
                { label: 'Description', value: selected.description || '—' },
              ]}
              actions={
                <>
                  <Button variant="outline" onClick={() => { setEditing(selected); setSelected(null); }}>
                    <Pencil className="h-4 w-4" /> Edit
                  </Button>
                  <ConfirmButton
                    onConfirm={() => remove(selected)}
                    title={`Delete "${selected.name}"${(selected.products?.length ?? 0) > 0 ? ' and its products' : ''}`}
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
