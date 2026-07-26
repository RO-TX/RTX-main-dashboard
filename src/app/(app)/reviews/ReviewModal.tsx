'use client';

import { useState } from 'react';
import { Loader2, Star } from 'lucide-react';
import { api, ApiError, errorMessage } from '@/lib/api';
import { toast } from '@/lib/toast';
import { Button, InlinePanel, ImageUploader } from '@/components/ui';
import { Field, Input, Textarea, FormError } from '@/components/form';

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          className="p-0.5"
        >
          <Star className={`h-5 w-5 ${n <= value ? 'fill-warning text-warning' : 'text-border'}`} />
        </button>
      ))}
    </div>
  );
}

export function ReviewModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: '',
    position: '',
    description: '',
    location: '',
    rating: 5,
    featured: false,
  });
  const [image, setImage] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const set =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (image.length === 0) {
      setError('A photo is required');
      return;
    }
    setSaving(true);
    setError(null);
    setFieldErrors({});
    try {
      await api.post('/content/reviews', { ...form, image: image[0] });
      toast.success('Testimonial added');
      onSaved();
    } catch (err) {
      if (err instanceof ApiError) setFieldErrors(err.fieldErrors());
      setError(errorMessage(err, 'Failed to add testimonial'));
      setSaving(false);
    }
  }

  return (
    <InlinePanel onClose={onClose} title="Add Testimonial">
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Name" required error={fieldErrors.name}>
            <Input required value={form.name} onChange={set('name')} placeholder="Sunita Mehta" />
          </Field>
          <Field label="Position" required error={fieldErrors.position}>
            <Input required value={form.position} onChange={set('position')} placeholder="Homeowner, Dwarka" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Location" error={fieldErrors.location}>
            <Input value={form.location} onChange={set('location')} placeholder="Dwarka, Delhi" />
          </Field>
          <Field label="Rating" error={fieldErrors.rating}>
            <StarPicker value={form.rating} onChange={(v) => setForm((f) => ({ ...f, rating: v }))} />
          </Field>
        </div>
        <Field label="Photo" required error={fieldErrors.image}>
          <ImageUploader images={image} onChange={setImage} folder="reviews" max={1} />
        </Field>
        <Field label="Testimonial" required error={fieldErrors.description}>
          <Textarea required value={form.description} onChange={set('description')} rows={3} />
        </Field>
        <label className="flex items-center gap-2 text-base text-body">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
            className="h-4 w-4 rounded border-border accent-primary"
          />
          Featured — show first on the homepage
        </label>

        {Object.keys(fieldErrors).length === 0 && <FormError message={error} />}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? 'Saving…' : 'Add Testimonial'}
          </Button>
        </div>
      </form>
    </InlinePanel>
  );
}
