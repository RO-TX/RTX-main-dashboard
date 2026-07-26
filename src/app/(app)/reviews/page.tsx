'use client';

import { useState } from 'react';
import { Trash2, Plus, Star, MapPin } from 'lucide-react';
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
              <div className="absolute right-4 top-4 flex items-center gap-1">
                <span
                  className={`rounded-full px-2 py-1 text-xs font-semibold ${
                    r.source === 'customer' ? 'bg-primary/15 text-primary' : 'bg-border/40 text-muted'
                  }`}
                >
                  {r.source === 'customer' ? 'Customer' : 'Curated'}
                </span>
                {r.featured && (
                  <span className="rounded-full bg-warning/15 px-2 py-1 text-xs font-semibold text-warning">
                    Featured
                  </span>
                )}
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
                  <p className="text-sm text-muted">{r.position}</p>
                  {r.location && (
                    <p className="flex items-center gap-1 text-sm text-muted">
                      <MapPin className="h-3 w-3" /> {r.location}
                    </p>
                  )}
                </div>
              </div>
              {r.rating > 0 && (
                <div className="mt-2 flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      className={`h-3.5 w-3.5 ${n <= r.rating ? 'fill-warning text-warning' : 'text-border'}`}
                    />
                  ))}
                </div>
              )}
              <p className="mt-3 text-base text-body">&ldquo;{r.description}&rdquo;</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
