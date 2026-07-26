'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { api, ApiError, errorMessage } from '@/lib/api';
import { toast } from '@/lib/toast';
import { Button, InlinePanel, FieldSelect, ImageUploader } from '@/components/ui';
import { Field, Input, Textarea, FormError } from '@/components/form';
import type { Category } from '@/lib/types';

export function CategoryModal({
  category,
  onClose,
  onSaved,
}: {
  category?: Category | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!category;
  const [form, setForm] = useState({
    name: category?.name ?? '',
    description: category?.description ?? '',
    categoryType: category?.categoryType ?? 'homecategory',
  });
  const [image, setImage] = useState(category?.catImage ? [category.catImage] : []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const set =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (image.length === 0) {
      setError('A category image is required');
      return;
    }
    setSaving(true);
    setError(null);
    setFieldErrors({});
    const payload = { ...form, catImage: image[0] };
    try {
      if (isEdit) {
        await api.patch(`/catalog/categories/${category!._id}`, payload);
        toast.success('Category updated');
      } else {
        await api.post('/catalog/categories', payload);
        toast.success('Category created');
      }
      onSaved();
    } catch (err) {
      if (err instanceof ApiError) setFieldErrors(err.fieldErrors());
      setError(errorMessage(err, 'Failed to save category'));
      setSaving(false);
    }
  }

  return (
    <InlinePanel onClose={onClose} title={isEdit ? 'Edit Category' : 'Add Category'}>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Name" required error={fieldErrors.name}>
          <Input required value={form.name} onChange={set('name')} placeholder="Domestic RO Systems" />
        </Field>
        <Field label="Image" required error={fieldErrors.catImage}>
          <ImageUploader images={image} onChange={setImage} folder="categories" max={1} />
        </Field>
        <Field label="Type" error={fieldErrors.categoryType}>
          <FieldSelect
            value={form.categoryType}
            onChange={(v) => setForm((f) => ({ ...f, categoryType: v as typeof f.categoryType }))}
            options={[
              { value: 'homecategory', label: 'Home' },
              { value: 'customcategory', label: 'Custom' },
              { value: 'customplushome', label: 'Custom + Home' },
            ]}
          />
        </Field>
        <Field label="Description" error={fieldErrors.description}>
          <Textarea value={form.description} onChange={set('description')} rows={2} />
        </Field>

        {Object.keys(fieldErrors).length === 0 && <FormError message={error} />}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Category'}
          </Button>
        </div>
      </form>
    </InlinePanel>
  );
}
