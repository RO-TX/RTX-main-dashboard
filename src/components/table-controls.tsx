'use client';

import type { Pagination } from '@/lib/types';

export function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-sm font-semibold capitalize transition ${
        active
          ? 'bg-primary text-white'
          : 'border border-border bg-surface text-body hover:bg-surface-alt'
      }`}
    >
      {children}
    </button>
  );
}

export function Pager({
  pagination,
  onPage,
}: {
  pagination?: Pagination;
  onPage: (p: number) => void;
}) {
  if (!pagination || pagination.totalPages <= 1) return null;
  const { page, totalPages, total } = pagination;
  return (
    <div className="mt-4 flex items-center justify-between text-base text-muted">
      <span>{total} total</span>
      <div className="flex items-center gap-2">
        <button
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className="rounded-lg border border-border bg-surface px-3 py-1.5 disabled:opacity-40"
        >
          Prev
        </button>
        <span className="text-body">
          {page} / {totalPages}
        </span>
        <button
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
          className="rounded-lg border border-border bg-surface px-3 py-1.5 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
