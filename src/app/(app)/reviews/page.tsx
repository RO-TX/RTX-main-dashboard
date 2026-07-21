'use client';

import { useState } from 'react';
import { Trash2, Plus } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import { toast } from '@/lib/toast';
import { PageHeader, Loading, ErrorState, EmptyState, Card, Button, ConfirmButton } from '@/components/ui';
import { ReviewModal } from './ReviewModal';
import type { Review } from '@/lib/types';

export default function ReviewsPage() {
  const { data, loading, error, refetch } = useApi<Review[]>(
    () => api.get<Review[]>('/content/reviews'),
    [],
  );
  const [showCreate, setShowCreate] = useState(false);

  async function remove(id: string) {
    try {
      await api.del(`/content/reviews/${id}`);
      toast.success('Testimonial deleted');
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to delete');
    }
  }

  return (
    <div>
      <PageHeader
        title="Testimonials"
        subtitle="Homepage customer testimonials."
        action={
          <Button onClick={() => setShowCreate((v) => !v)}>
            <Plus className="h-4 w-4" /> Add Testimonial
          </Button>
        }
      />

      {showCreate && (
        <ReviewModal onClose={() => setShowCreate(false)} onSaved={() => { setShowCreate(false); refetch(); }} />
      )}

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} />
      ) : !data || data.length === 0 ? (
        <EmptyState message="No testimonials yet." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.map((r) => (
            <Card key={r._id} className="relative">
              <div className="absolute right-4 top-4">
                <ConfirmButton
                  onConfirm={() => remove(r._id)}
                  title="Delete testimonial"
                  className="rounded-lg p-1.5 text-muted transition hover:bg-error/10 hover:text-error"
                >
                  <Trash2 className="h-4 w-4" />
                </ConfirmButton>
              </div>
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.image} alt="" className="h-12 w-12 rounded-full border border-border object-cover" />
                <div>
                  <p className="font-semibold text-heading">{r.name}</p>
                  <p className="text-xs text-muted">{r.position}</p>
                </div>
              </div>
              <p className="mt-3 text-sm text-body">&ldquo;{r.description}&rdquo;</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
