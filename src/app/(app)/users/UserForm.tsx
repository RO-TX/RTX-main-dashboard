'use client';

import { useState, useRef, useEffect } from 'react';
import { Loader2, X, UserPlus } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { toast } from '@/lib/toast';
import { Button, FieldSelect } from '@/components/ui';
import { Field, Input, FormError } from '@/components/form';

const STAFF_ROLES: { value: string; label: string; hint: string }[] = [
  { value: 'call_center', label: 'Call Center', hint: 'Handles customer calls, orders & service requests' },
  { value: 'microadmin', label: 'Micro Admin', hint: 'Operations — orders, catalog, warehouse' },
  { value: 'admin', label: 'Admin', hint: 'Full access, including staff management' },
];

/**
 * Inline create-staff panel — renders within the page (no modal pop-up).
 * Admin-only: creates call_center / microadmin / admin accounts.
 */
export function UserForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    password: '',
    role: 'call_center',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const roleHint = STAFF_ROLES.find((r) => r.value === form.role)?.hint;

  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.post('/users', {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        mobile: form.mobile || undefined,
        password: form.password,
        role: form.role,
      });
      toast.success('Staff account created');
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create user');
      setSaving(false);
    }
  }

  return (
    <div ref={panelRef} className="glass-card mb-5 scroll-mt-4 animate-[slideIn_.2s_ease-out] p-5">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary-light text-primary">
            <UserPlus className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-bold text-heading">Create staff account</h2>
            <p className="text-xs text-muted">Add a call center agent, micro admin, or admin.</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-muted transition hover:bg-surface-alt hover:text-heading"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="First name" required>
          <Input required value={form.firstName} onChange={set('firstName')} placeholder="Ravi" />
        </Field>
        <Field label="Last name" required>
          <Input required value={form.lastName} onChange={set('lastName')} placeholder="Kumar" />
        </Field>
        <Field label="Role" required hint={roleHint}>
          <FieldSelect
            value={form.role}
            onChange={(v) => setForm((f) => ({ ...f, role: v }))}
            options={STAFF_ROLES.map((r) => ({ value: r.value, label: r.label }))}
          />
        </Field>
        <Field label="Email" required>
          <Input required type="email" value={form.email} onChange={set('email')} placeholder="ravi@rotechnicalxperts.com" />
        </Field>
        <Field label="Mobile" hint="10 digits (optional)">
          <Input value={form.mobile} onChange={set('mobile')} placeholder="9876543210" />
        </Field>
        <Field label="Temporary password" required hint="Min 8 characters">
          <Input required type="text" value={form.password} onChange={set('password')} placeholder="Set a password" />
        </Field>

        <div className="sm:col-span-2 lg:col-span-3">
          <FormError message={error} />
          <div className="mt-1 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? 'Creating…' : 'Create Account'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
