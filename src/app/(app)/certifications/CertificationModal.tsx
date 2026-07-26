'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { api, ApiError, errorMessage } from '@/lib/api';
import { toast } from '@/lib/toast';
import { Button, InlinePanel, ImageUploader } from '@/components/ui';
import { Field, Input, Textarea, FormError } from '@/components/form';

export function CertificationModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    title: '',
    issuedBy: '',
    verificationId: '',
    issueDate: '',
    expiryDate: '',
    description: '',
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
      setError('A certificate image is required');
      return;
    }
    setSaving(true);
    setError(null);
    setFieldErrors({});
    try {
      await api.post('/content/certifications', { ...form, image: image[0] });
      toast.success('Certification added');
      onSaved();
    } catch (err) {
      if (err instanceof ApiError) {
        setFieldErrors(err.fieldErrors());
      }
      setError(errorMessage(err, 'Failed to add certification'));
      setSaving(false);
    }
  }

  return (
    <InlinePanel onClose={onClose} title="Add Certification">
      <form onSubmit={submit} className="space-y-3">
        <Field label="Title" required error={fieldErrors.title}>
          <Input required value={form.title} onChange={set('title')} placeholder="ISO 9001:2015 Quality Management" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Issued By" required error={fieldErrors.issuedBy}>
            <Input required value={form.issuedBy} onChange={set('issuedBy')} placeholder="Bureau of Indian Standards" />
          </Field>
          <Field label="Verification ID" required error={fieldErrors.verificationId}>
            <Input required value={form.verificationId} onChange={set('verificationId')} placeholder="ISO-2024-RTX-001" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Issue Date" required error={fieldErrors.issueDate}>
            <Input required type="date" value={form.issueDate} onChange={set('issueDate')} />
          </Field>
          <Field label="Expiry Date" required error={fieldErrors.expiryDate} hint="Must be after the issue date">
            <Input required type="date" value={form.expiryDate} onChange={set('expiryDate')} />
          </Field>
        </div>
        <Field label="Image" required error={fieldErrors.image}>
          <ImageUploader images={image} onChange={setImage} folder="certifications" max={1} />
        </Field>
        <Field label="Description" required error={fieldErrors.description}>
          <Textarea required value={form.description} onChange={set('description')} rows={2} />
        </Field>

        {Object.keys(fieldErrors).length === 0 && <FormError message={error} />}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? 'Saving…' : 'Add Certification'}
          </Button>
        </div>
      </form>
    </InlinePanel>
  );
}
