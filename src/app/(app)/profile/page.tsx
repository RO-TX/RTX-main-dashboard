'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, KeyRound, Mail, Phone, ShieldCheck } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { toast } from '@/lib/toast';
import { PageHeader, Card, Button, StatusBadge } from '@/components/ui';
import { Field, Input, FormError } from '@/components/form';
import type { User } from '@/lib/types';

const ROLE_LABEL: Record<string, string> = {
  customer: 'Customer',
  call_center: 'Call Center',
  microadmin: 'Micro Admin',
  admin: 'Admin',
};

export default function ProfilePage() {
  const { user, setUser, clear } = useAuth();
  const router = useRouter();

  if (!user) return null;

  return (
    <div className="max-w-3xl">
      <PageHeader title="My Profile" subtitle="Your account details and security." />

      {/* Profile hero */}
      <Card className="mb-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-navy-600 to-navy-800 text-3xl font-extrabold text-white shadow-lg shadow-navy-900/25">
            {user.firstName?.[0] ?? 'A'}
            {user.lastName?.[0] ?? ''}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <h2 className="text-xl font-bold text-heading">
                {user.firstName} {user.lastName}
              </h2>
              <StatusBadge status={ROLE_LABEL[user.role] ?? user.role} />
              {user.emailVerified && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                  <ShieldCheck className="h-3.5 w-3.5" /> Verified
                </span>
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-sm text-muted sm:justify-start">
              <span className="inline-flex items-center gap-1.5">
                <Mail className="h-4 w-4" /> {user.email}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Phone className="h-4 w-4" /> {user.mobile || 'No mobile added'}
              </span>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <ProfileForm user={user} onUpdated={setUser} />
        <PasswordForm
          onChanged={() => {
            clear();
            router.replace('/login');
          }}
        />
      </div>
    </div>
  );
}

function ProfileForm({ user, onUpdated }: { user: User; onUpdated: (u: User) => void }) {
  const [form, setForm] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    mobile: user.mobile ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, string> = { firstName: form.firstName, lastName: form.lastName };
      if (form.mobile) body.mobile = form.mobile;
      const res = await api.patch<User>('/auth/profile', body);
      onUpdated(res.data);
      toast.success('Profile updated');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <h3 className="mb-4 font-bold text-heading">Edit details</h3>
      <form onSubmit={save} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name" required>
            <Input required value={form.firstName} onChange={set('firstName')} />
          </Field>
          <Field label="Last name" required>
            <Input required value={form.lastName} onChange={set('lastName')} />
          </Field>
        </div>
        <Field label="Email">
          <Input value={user.email} disabled />
        </Field>
        <Field label="Mobile" hint="10 digits">
          <Input value={form.mobile} onChange={set('mobile')} placeholder="9876543210" />
        </Field>
        <FormError message={error} />
        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Profile
          </Button>
        </div>
      </form>
    </Card>
  );
}

function PasswordForm({ onChanged }: { onChanged: () => void }) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.newPassword !== form.confirm) {
      setError('New passwords do not match');
      return;
    }
    setSaving(true);
    try {
      await api.patch('/auth/password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      toast.success('Password changed — please log in again');
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to change password');
      setSaving(false);
    }
  }

  return (
    <Card>
      <div className="mb-4 flex items-center gap-2">
        <KeyRound className="h-5 w-5 text-primary" />
        <h3 className="font-bold text-heading">Change password</h3>
      </div>
      <form onSubmit={save} className="space-y-3">
        <Field label="Current password" required>
          <Input required type="password" value={form.currentPassword} onChange={set('currentPassword')} />
        </Field>
        <Field label="New password" required hint="Min 8 characters">
          <Input required type="password" value={form.newPassword} onChange={set('newPassword')} />
        </Field>
        <Field label="Confirm new password" required>
          <Input required type="password" value={form.confirm} onChange={set('confirm')} />
        </Field>
        <FormError message={error} />
        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Change Password
          </Button>
        </div>
      </form>
    </Card>
  );
}
