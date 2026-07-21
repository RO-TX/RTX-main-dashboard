'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import { toast } from '@/lib/toast';
import { Button, InlinePanel, FieldSelect, ImageUploader } from '@/components/ui';
import { Field, Input, Textarea, FormError } from '@/components/form';
import { formatCurrency } from '@/lib/format';
import type { Category, Product } from '@/lib/types';

/** Create OR edit a product. Pass `product` to edit; omit to create. */
export function ProductModal({
  product,
  onClose,
  onSaved,
}: {
  product?: Product | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!product;
  const { data: categories } = useApi<Category[]>(() => api.get<Category[]>('/catalog/categories'), []);

  const [form, setForm] = useState({
    name: product?.name ?? '',
    skuid: product?.skuid ?? '',
    mrp: product?.mrp?.toString() ?? '',
    price: product?.price?.toString() ?? '',
    gstRate: product?.gstRate?.toString() ?? '18',
    installationCharge: product?.installationCharge?.toString() ?? '0',
    quantity: product?.quantity?.toString() ?? '',
    category:
      (typeof product?.category === 'object' ? product?.category._id : product?.category) ?? '',
    description: product?.description ?? '',
    isTopSeller: product?.isTopSeller ?? false,
    shipment_length: product?.shipment_length ?? '',
    shipment_width: product?.shipment_width ?? '',
    shipment_height: product?.shipment_height ?? '',
    weight: product?.weight ?? '',
    fragile: product?.fragile ?? false,
    warrantyMonths: product?.warrantyMonths?.toString() ?? '12',
    hsnCode: product?.hsnCode ?? '',
    rating: product?.rating?.toString() ?? '0',
    reviewCount: product?.reviewCount?.toString() ?? '0',
  });
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const slugify = (s: string) =>
    s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  // Live price breakup preview
  const mrpN = Number(form.mrp) || 0;
  const priceN = Number(form.price) || 0;
  const gstN = Number(form.gstRate) || 0;
  const installN = Number(form.installationCharge) || 0;
  const baseN = gstN > 0 ? priceN / (1 + gstN / 100) : priceN;
  const gstAmtN = priceN - baseN;
  const discountPct = mrpN > priceN && mrpN > 0 ? Math.round((1 - priceN / mrpN) * 100) : 0;
  const totalN = priceN + installN;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (images.length === 0) {
      setError('At least one product image is required');
      return;
    }
    setSaving(true);
    setError(null);
    const payload = {
      name: form.name,
      skuid: form.skuid,
      mrp: Number(form.mrp) || 0,
      price: Number(form.price),
      gstRate: Number(form.gstRate) || 0,
      installationCharge: Number(form.installationCharge) || 0,
      quantity: Number(form.quantity),
      category: form.category,
      images,
      description: form.description,
      isTopSeller: form.isTopSeller,
      shipment_length: form.shipment_length,
      shipment_width: form.shipment_width,
      shipment_height: form.shipment_height,
      weight: form.weight,
      fragile: form.fragile,
      warrantyMonths: Number(form.warrantyMonths) || 0,
      hsnCode: form.hsnCode,
      rating: Number(form.rating) || 0,
      reviewCount: Number(form.reviewCount) || 0,
    };
    try {
      if (isEdit) {
        await api.patch(`/catalog/products/${product!._id}`, payload);
        toast.success('Product updated');
      } else {
        await api.post('/catalog/products', { ...payload, slug: slugify(form.name) });
        toast.success('Product created');
      }
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save product');
      setSaving(false);
    }
  }

  return (
    <InlinePanel onClose={onClose} title={isEdit ? 'Edit Product' : 'Add Product'}>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Name" required>
          <Input required value={form.name} onChange={set('name')} placeholder="AquaPure 8L RO+UV" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="SKU ID" required>
            <Input required value={form.skuid} onChange={set('skuid')} placeholder="RTX-0001" disabled={isEdit} />
          </Field>
          <Field label="Category" required>
            <FieldSelect
              required
              value={form.category}
              onChange={(v) => setForm((f) => ({ ...f, category: v }))}
              options={(categories ?? []).map((c) => ({ value: c._id, label: c.name }))}
            />
          </Field>
        </div>
        {/* Price breakup — mid-tier grouping (inside the outer form card) */}
        <div className="panel-2 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Price breakup</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Field label="MRP (₹)" hint="List price">
              <Input type="number" min="0" value={form.mrp} onChange={set('mrp')} placeholder="15999" />
            </Field>
            <Field label="Selling (₹)" required hint="Incl. GST">
              <Input required type="number" min="0" value={form.price} onChange={set('price')} placeholder="12999" />
            </Field>
            <Field label="GST %">
              <Input type="number" min="0" max="100" value={form.gstRate} onChange={set('gstRate')} placeholder="18" />
            </Field>
            <Field label="Installation (₹)">
              <Input type="number" min="0" value={form.installationCharge} onChange={set('installationCharge')} placeholder="0" />
            </Field>
          </div>

          {priceN > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 border-t border-border-light pt-3 text-xs sm:grid-cols-4">
              {discountPct > 0 && (
                <Breakup label="Discount" value={`${discountPct}% off`} accent />
              )}
              <Breakup label="Base price" value={formatCurrency(Math.round(baseN))} />
              <Breakup label={`GST (${gstN}%)`} value={formatCurrency(Math.round(gstAmtN))} />
              <Breakup label="Installation" value={installN > 0 ? formatCurrency(installN) : 'Free'} />
              <Breakup label="Total payable" value={formatCurrency(totalN)} strong />
            </div>
          )}
        </div>

        <Field label="Stock qty" required>
          <Input required type="number" min="0" value={form.quantity} onChange={set('quantity')} placeholder="25" />
        </Field>

        <Field label="Images" required hint="First image is used as the primary thumbnail">
          <ImageUploader images={images} onChange={setImages} folder="products" />
        </Field>

        <Field label="Description">
          <Textarea value={form.description} onChange={set('description')} rows={2} />
        </Field>

        {/* Shipping & packaging */}
        <div className="panel-2 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Shipping & packaging</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Field label="Length (cm)">
              <Input value={form.shipment_length} onChange={set('shipment_length')} placeholder="40" />
            </Field>
            <Field label="Width (cm)">
              <Input value={form.shipment_width} onChange={set('shipment_width')} placeholder="30" />
            </Field>
            <Field label="Height (cm)">
              <Input value={form.shipment_height} onChange={set('shipment_height')} placeholder="55" />
            </Field>
            <Field label="Weight (kg)">
              <Input value={form.weight} onChange={set('weight')} placeholder="12.5" />
            </Field>
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm text-body">
            <input
              type="checkbox"
              checked={form.fragile}
              onChange={(e) => setForm((f) => ({ ...f, fragile: e.target.checked }))}
              className="h-4 w-4 rounded border-border accent-primary"
            />
            Fragile — handle with care during shipping
          </label>
        </div>

        {/* Compliance & trust signals */}
        <div className="panel-2 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Compliance & ratings</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Field label="HSN code" hint="For GST invoicing">
              <Input value={form.hsnCode} onChange={set('hsnCode')} placeholder="84212100" />
            </Field>
            <Field label="Warranty (months)">
              <Input type="number" min="0" value={form.warrantyMonths} onChange={set('warrantyMonths')} placeholder="12" />
            </Field>
            <Field label="Rating (0-5)" hint="Shown until real reviews exist">
              <Input type="number" min="0" max="5" step="0.1" value={form.rating} onChange={set('rating')} placeholder="4.8" />
            </Field>
            <Field label="Review count">
              <Input type="number" min="0" value={form.reviewCount} onChange={set('reviewCount')} placeholder="120" />
            </Field>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-body">
          <input
            type="checkbox"
            checked={form.isTopSeller}
            onChange={(e) => setForm((f) => ({ ...f, isTopSeller: e.target.checked }))}
            className="h-4 w-4 rounded border-border accent-primary"
          />
          Mark as top seller
        </label>

        <FormError message={error} />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Product'}
          </Button>
        </div>
      </form>
    </InlinePanel>
  );
}

function Breakup({
  label,
  value,
  strong,
  accent,
}: {
  label: string;
  value: string;
  strong?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted">{label}</span>
      <span
        className={
          strong ? 'font-bold text-heading' : accent ? 'font-semibold text-success' : 'font-medium text-body'
        }
      >
        {value}
      </span>
    </div>
  );
}
