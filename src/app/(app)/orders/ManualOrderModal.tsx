'use client';

import { useEffect, useState } from 'react';
import { Loader2, Plus, Minus, Trash2, Search } from 'lucide-react';
import { api, ApiError, errorMessage } from '@/lib/api';
import { toast } from '@/lib/toast';
import { formatCurrency } from '@/lib/format';
import { Button, InlinePanel, FieldSelect } from '@/components/ui';
import { Field, Input, Textarea, FormError } from '@/components/form';
import type { Product } from '@/lib/types';

interface LineItem {
  product: Product;
  quantity: number;
}

const PAYMENT_METHODS = [
  { value: 'cod', label: 'Cash on delivery' },
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'upi', label: 'UPI' },
  { value: 'card', label: 'Card' },
  { value: 'wallet', label: 'Wallet' },
];

const STATUSES = [
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
];

export function ManualOrderModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [customer, setCustomer] = useState({ name: '', mobile: '', email: '' });
  const [address, setAddress] = useState({ address: '', city: '', state: '', postalCode: '', country: 'India' });
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [status, setStatus] = useState('confirmed');
  const [notes, setNotes] = useState('');

  const [items, setItems] = useState<LineItem[]>([]);
  const [productQuery, setProductQuery] = useState('');
  const [productResults, setProductResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const q = productQuery.trim();
    if (q.length < 2) {
      setProductResults([]);
      return;
    }
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const res = await api.getList<Product[]>('/catalog/products', { search: q, limit: 6 });
        setProductResults(res.data);
      } catch {
        setProductResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [productQuery]);

  function addProduct(p: Product) {
    setItems((cur) => {
      const existing = cur.find((i) => i.product._id === p._id);
      if (existing) {
        return cur.map((i) => (i.product._id === p._id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...cur, { product: p, quantity: 1 }];
    });
    setProductQuery('');
    setProductResults([]);
  }

  function setQty(id: string, qty: number) {
    setItems((cur) =>
      cur.map((i) => (i.product._id === id ? { ...i, quantity: Math.max(1, qty) } : i)).filter((i) => i.quantity > 0),
    );
  }

  function removeItem(id: string) {
    setItems((cur) => cur.filter((i) => i.product._id !== id));
  }

  const total = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) {
      setError('Add at least one product');
      return;
    }
    setSaving(true);
    setError(null);
    setFieldErrors({});
    try {
      await api.post('/orders/manual', {
        items: items.map((i) => ({ product: i.product._id, quantity: i.quantity })),
        guestCustomer: {
          name: customer.name,
          mobile: customer.mobile,
          email: customer.email || undefined,
        },
        shippingAddress: { ...address, mobile: customer.mobile },
        paymentMethod,
        status,
        notes: notes || undefined,
      });
      toast.success('Order created');
      onSaved();
    } catch (err) {
      if (err instanceof ApiError) setFieldErrors(err.fieldErrors());
      setError(errorMessage(err, 'Failed to create order'));
      setSaving(false);
    }
  }

  return (
    <InlinePanel onClose={onClose} title="Create Order" description="For phone/walk-in orders — no customer account needed.">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <Field label="Customer name" required error={fieldErrors['guestCustomer.name']}>
            <Input required value={customer.name} onChange={(e) => setCustomer((c) => ({ ...c, name: e.target.value }))} />
          </Field>
          <Field label="Mobile" required error={fieldErrors['guestCustomer.mobile']}>
            <Input
              required
              value={customer.mobile}
              onChange={(e) => setCustomer((c) => ({ ...c, mobile: e.target.value }))}
              placeholder="10-digit mobile"
            />
          </Field>
          <Field label="Email" error={fieldErrors['guestCustomer.email']}>
            <Input
              type="email"
              value={customer.email}
              onChange={(e) => setCustomer((c) => ({ ...c, email: e.target.value }))}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Address" required error={fieldErrors['shippingAddress.address']}>
            <Input required value={address.address} onChange={(e) => setAddress((a) => ({ ...a, address: e.target.value }))} />
          </Field>
          <Field label="City" required error={fieldErrors['shippingAddress.city']}>
            <Input required value={address.city} onChange={(e) => setAddress((a) => ({ ...a, city: e.target.value }))} />
          </Field>
          <Field label="State" required error={fieldErrors['shippingAddress.state']}>
            <Input required value={address.state} onChange={(e) => setAddress((a) => ({ ...a, state: e.target.value }))} />
          </Field>
          <Field label="Postal code" required error={fieldErrors['shippingAddress.postalCode']}>
            <Input
              required
              value={address.postalCode}
              onChange={(e) => setAddress((a) => ({ ...a, postalCode: e.target.value }))}
            />
          </Field>
        </div>

        <div>
          <Field label="Products" required error={fieldErrors.items}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                value={productQuery}
                onChange={(e) => setProductQuery(e.target.value)}
                placeholder="Search products to add…"
                className="h-10 w-full rounded-xl border border-border bg-surface pl-9 pr-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-glow"
              />
            </div>
          </Field>

          {(searching || productResults.length > 0) && (
            <div className="mt-1 rounded-xl border border-border bg-white p-1.5 shadow-sm">
              {searching ? (
                <p className="flex items-center gap-2 px-2 py-2 text-sm text-muted">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Searching…
                </p>
              ) : (
                productResults.map((p) => (
                  <button
                    key={p._id}
                    type="button"
                    onClick={() => addProduct(p)}
                    className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-base transition hover:bg-primary-light"
                  >
                    <span className="truncate text-heading">{p.name}</span>
                    <span className="shrink-0 text-sm text-muted">{formatCurrency(p.price)} · {p.quantity} in stock</span>
                  </button>
                ))
              )}
            </div>
          )}

          {items.length > 0 && (
            <div className="mt-3 space-y-2">
              {items.map((i) => (
                <div key={i.product._id} className="flex items-center gap-3 rounded-xl border border-border p-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-medium text-heading">{i.product.name}</p>
                    <p className="text-sm text-muted">{formatCurrency(i.product.price)} each</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setQty(i.product._id, i.quantity - 1)}
                      className="grid h-7 w-7 place-items-center rounded-lg border border-border text-muted hover:text-primary"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-6 text-center text-base font-semibold text-heading">{i.quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQty(i.product._id, i.quantity + 1)}
                      className="grid h-7 w-7 place-items-center rounded-lg border border-border text-muted hover:text-primary"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="w-20 shrink-0 text-right text-base font-semibold text-heading">
                    {formatCurrency(i.product.price * i.quantity)}
                  </p>
                  <button
                    type="button"
                    onClick={() => removeItem(i.product._id)}
                    className="text-muted hover:text-error"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <div className="flex justify-end border-t border-border pt-2 text-base font-bold text-heading">
                Total: {formatCurrency(total)}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Payment method">
            <FieldSelect value={paymentMethod} onChange={setPaymentMethod} options={PAYMENT_METHODS} />
          </Field>
          <Field label="Order status">
            <FieldSelect value={status} onChange={setStatus} options={STATUSES} />
          </Field>
        </div>

        <Field label="Notes">
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        </Field>

        {Object.keys(fieldErrors).length === 0 && <FormError message={error} />}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? 'Creating…' : 'Create Order'}
          </Button>
        </div>
      </form>
    </InlinePanel>
  );
}
