'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import { toast } from '@/lib/toast';
import { formatDate } from '@/lib/format';
import {
  PageHeader,
  Table,
  Th,
  Td,
  Loading,
  ErrorState,
  EmptyState,
  Button,
  ConfirmButton,
} from '@/components/ui';
import { CategoryModal } from './CategoryModal';
import type { Category } from '@/lib/types';

export default function CategoriesPage() {
  const { data, loading, error, refetch } = useApi<Category[]>(
    () => api.get<Category[]>('/catalog/categories', { withProducts: true }),
    [],
  );
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  async function remove(c: Category) {
    const count = c.products?.length ?? 0;
    try {
      await api.del(`/catalog/categories/${c._id}${count > 0 ? '?force=true' : ''}`);
      toast.success('Category deleted');
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to delete');
    }
  }

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
        <Table>
          <thead>
            <tr>
              <Th>Category</Th>
              <Th>Slug</Th>
              <Th>Products</Th>
              <Th>Created</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {data.map((c) => (
              <tr key={c._id}>
                <Td>
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.catImage} alt="" className="h-10 w-14 rounded-lg border border-border object-cover" />
                    <span className="font-medium text-heading">{c.name}</span>
                  </div>
                </Td>
                <Td className="text-muted">{c.slug}</Td>
                <Td className="font-semibold text-heading">{c.products?.length ?? 0}</Td>
                <Td className="text-muted">{formatDate(c.createdAt)}</Td>
                <Td>
                  <div className="flex items-center gap-1">
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
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
