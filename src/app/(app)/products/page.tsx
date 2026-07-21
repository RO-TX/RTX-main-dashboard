'use client';

import { useState } from 'react';
import { Plus, Search, Trash2, Pencil, List, LayoutGrid, Star } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import { toast } from '@/lib/toast';
import { formatCurrency, cn } from '@/lib/format';
import {
  PageHeader,
  Table,
  Th,
  Td,
  Loading,
  ErrorState,
  EmptyState,
  Button,
  StatusBadge,
  ConfirmButton,
} from '@/components/ui';
import { Pager } from '@/components/table-controls';
import { ProductModal } from './ProductModal';
import type { Product, Pagination } from '@/lib/types';

export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [view, setView] = useState<'table' | 'grid'>('table');

  // debounce search
  function onSearch(v: string) {
    setSearch(v);
    clearTimeout((onSearch as unknown as { t?: number }).t);
    (onSearch as unknown as { t?: number }).t = window.setTimeout(() => {
      setDebounced(v);
      setPage(1);
    }, 350);
  }

  const { data, loading, error, refetch } = useApi<{ data: Product[]; pagination?: Pagination }>(
    () =>
      api.getList<Product[]>('/catalog/products', {
        search: debounced || undefined,
        page,
        limit: 12,
      }),
    [debounced, page],
  );

  async function remove(id: string) {
    try {
      await api.del(`/catalog/products/${id}`);
      toast.success('Product deleted');
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to delete');
    }
  }

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle="Your full product catalog."
        action={
          <Button onClick={() => { setEditing(null); setShowCreate((v) => !v); }}>
            <Plus className="h-4 w-4" /> Add Product
          </Button>
        }
      />

      {showCreate && (
        <ProductModal
          onClose={() => setShowCreate(false)}
          onSaved={() => {
            setShowCreate(false);
            refetch();
          }}
        />
      )}
      {editing && (
        <ProductModal
          product={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            refetch();
          }}
        />
      )}

      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search products…"
            className="w-full rounded-xl border border-border bg-surface py-2.5 pl-10 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-glow"
          />
        </div>

        {/* Rows vs. card preview — the card view mirrors how the product will
            look to a customer on the storefront (photo, price, rating). */}
        <div className="flex shrink-0 items-center gap-1 rounded-xl border border-border bg-surface p-1">
          <button
            type="button"
            onClick={() => setView('table')}
            title="Row view"
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition',
              view === 'table' ? 'bg-primary text-white' : 'text-muted hover:text-heading',
            )}
          >
            <List className="h-3.5 w-3.5" /> Rows
          </button>
          <button
            type="button"
            onClick={() => setView('grid')}
            title="Card preview"
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition',
              view === 'grid' ? 'bg-primary text-white' : 'text-muted hover:text-heading',
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" /> Cards
          </button>
        </div>
      </div>

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} />
      ) : !data || data.data.length === 0 ? (
        <EmptyState message="No products found." />
      ) : view === 'grid' ? (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {data.data.map((p) => (
              <ProductCard key={p._id} product={p} onEdit={() => setEditing(p)} onDelete={() => remove(p._id)} />
            ))}
          </div>
          <Pager pagination={data.pagination} onPage={setPage} />
        </>
      ) : (
        <>
          <Table>
            <thead>
              <tr>
                <Th>Product</Th>
                <Th>SKU</Th>
                <Th>Category</Th>
                <Th>Price</Th>
                <Th>Stock</Th>
                <Th>Status</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((p) => (
                <tr key={p._id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.images?.[0]}
                        alt=""
                        className="h-10 w-10 rounded-lg border border-border object-cover"
                      />
                      <span className="font-medium text-heading">{p.name}</span>
                    </div>
                  </Td>
                  <Td className="text-muted">{p.skuid}</Td>
                  <Td>{typeof p.category === 'object' ? p.category.name : '—'}</Td>
                  <Td className="font-semibold text-heading">{formatCurrency(p.price)}</Td>
                  <Td>
                    <span className={cn('font-semibold', p.quantity <= 5 ? 'text-warning' : 'text-body')}>
                      {p.quantity}
                    </span>
                  </Td>
                  <Td>
                    <StatusBadge status={p.isActive ? 'active' : 'inactive'} />
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditing(p)}
                        className="rounded-lg p-2 text-muted transition hover:bg-primary-light hover:text-primary"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <ConfirmButton
                        onConfirm={() => remove(p._id)}
                        title="Delete product"
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
          <Pager pagination={data.pagination} onPage={setPage} />
        </>
      )}
    </div>
  );
}

/**
 * ProductCard — a storefront-style preview (photo, rating, price, stock) so
 * an admin can see roughly how the product will read to a customer, with the
 * usual edit/delete controls revealed on hover.
 */
function ProductCard({
  product: p,
  onEdit,
  onDelete,
}: {
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const hasDiscount = (p.mrp ?? 0) > p.price;
  const discountPct = hasDiscount ? Math.round((1 - p.price / (p.mrp as number)) * 100) : 0;

  return (
    <div className="group glass-card overflow-hidden">
      <div className="relative aspect-square bg-surface-alt">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.images?.[0]} alt="" className="h-full w-full object-cover" />

        <div className="pointer-events-none absolute inset-0 flex items-start justify-between p-2 opacity-0 transition group-hover:pointer-events-auto group-hover:opacity-100">
          <StatusBadge status={p.isActive ? 'active' : 'inactive'} />
          <div className="flex items-center gap-1">
            <button
              onClick={onEdit}
              title="Edit"
              className="grid h-8 w-8 place-items-center rounded-full bg-white/90 text-muted shadow-[0_4px_16px_-4px_rgba(6,47,79,0.25)] transition hover:text-primary"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <ConfirmButton
              onConfirm={onDelete}
              title="Delete product"
              className="grid h-8 w-8 place-items-center rounded-full bg-white/90 text-muted shadow-[0_4px_16px_-4px_rgba(6,47,79,0.25)] transition hover:text-error"
            >
              <Trash2 className="h-4 w-4" />
            </ConfirmButton>
          </div>
        </div>

        {hasDiscount && (
          <span className="absolute bottom-2 left-2 rounded-full bg-error px-2 py-0.5 text-[10px] font-bold text-white">
            {discountPct}% OFF
          </span>
        )}
      </div>

      <div className="p-3">
        <p className="truncate text-sm font-semibold text-heading">{p.name}</p>
        <p className="text-xs text-muted">{typeof p.category === 'object' ? p.category.name : ''}</p>

        {(p.rating ?? 0) > 0 && (
          <div className="mt-1 flex items-center gap-1 text-xs text-muted">
            <Star className="h-3.5 w-3.5 fill-warning text-warning" />
            <span className="font-medium text-heading">{p.rating}</span>
            <span>({p.reviewCount ?? 0})</span>
          </div>
        )}

        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-base font-bold text-heading">{formatCurrency(p.price)}</span>
          {hasDiscount && (
            <span className="text-xs text-muted line-through">{formatCurrency(p.mrp as number)}</span>
          )}
        </div>

        <p className={cn('mt-1 text-xs font-medium', p.quantity <= 5 ? 'text-warning' : 'text-success')}>
          {p.quantity > 0 ? `${p.quantity} in stock` : 'Out of stock'}
        </p>
      </div>
    </div>
  );
}
