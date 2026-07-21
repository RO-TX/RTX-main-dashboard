'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { toast } from '@/lib/toast';
import { Button, InlinePanel, ImageUploader } from '@/components/ui';
import { Field, Input, Textarea, FormError } from '@/components/form';

export function ReviewModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: '',
    position: '',
    description: '',
  });
  const [image, setImage] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    try {
      await api.post('/content/reviews', { ...form, image: image[0] });
      toast.success('Testimonial added');
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to add testimonial');
      setSaving(false);
    }
  }

  return (
    <InlinePanel onClose={onClose} title="Add Testimonial">
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Name" required>
            <Input required value={form.name} onChange={set('name')} placeholder="Sunita Mehta" />
          </Field>
          <Field label="Position" required>
            <Input required value={form.position} onChange={set('position')} placeholder="Homeowner, Dwarka" />
          </Field>
        </div>
        <Field label="Photo" required>
          <ImageUploader images={image} onChange={setImage} folder="reviews" max={1} />
        </Field>
        <Field label="Testimonial" required>
          <Textarea required value={form.description} onChange={set('description')} rows={3} />
        </Field>

        <FormError message={error} />

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
