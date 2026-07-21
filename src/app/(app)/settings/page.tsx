'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, User as UserIcon, KeyRound } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { toast } from '@/lib/toast';
import { PageHeader, Card, Button } from '@/components/ui';
import { Field, Input, FormError } from '@/components/form';
import type { User } from '@/lib/types';

export default function SettingsPage() {
  const { user, setUser, clear } = useAuth();
  const router = useRouter();

  return (
    <div className="max-w-2xl">
      <PageHeader title="Settings" subtitle="Manage your account." />
      <div className="space-y-6">
        <ProfileSection user={user} onUpdated={setUser} />
        <PasswordSection
          onChanged={() => {
            clear();
            router.replace('/login');
          }}
        />
      </div>
    </div>
  );
}

function ProfileSection({ user, onUpdated }: { user: User | null; onUpdated: (u: User) => void }) {
  const [form, setForm] = useState({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    mobile: user?.mobile ?? '',
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
      const body: Record<string, string> = {
        firstName: form.firstName,
        lastName: form.lastName,
      };
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
      <div className="mb-4 flex items-center gap-2">
        <UserIcon className="h-5 w-5 text-primary" />
        <h2 className="font-bold text-heading">Profile</h2>
      </div>
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
          <Input value={user?.email ?? ''} disabled />
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

function PasswordSection({ onChanged }: { onChanged: () => void }) {
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
        <h2 className="font-bold text-heading">Change Password</h2>
      </div>
      <form onSubmit={save} className="space-y-3">
        <Field label="Current password" required>
          <Input required type="password" value={form.currentPassword} onChange={set('currentPassword')} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="New password" required hint="Min 8 characters">
            <Input required type="password" value={form.newPassword} onChange={set('newPassword')} />
          </Field>
          <Field label="Confirm new password" required>
            <Input required type="password" value={form.confirm} onChange={set('confirm')} />
          </Field>
        </div>
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
