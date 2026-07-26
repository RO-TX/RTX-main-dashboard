'use client';

import { cn } from '@/lib/format';

export const fieldCls =
  'w-full rounded-xl border border-border bg-navy-100/45 px-3 py-2 text-base text-heading outline-none transition focus:border-primary focus:bg-navy-100/30 focus:ring-2 focus:ring-glow disabled:opacity-60';

export function Field({
  label,
  children,
  hint,
  required,
  error,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  required?: boolean;
  /** Field-level error (e.g. from ApiError.fieldErrors) — shown in place of the hint. */
  error?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-muted">
        {label}
        {required && <span className="text-error"> *</span>}
      </span>
      {children}
      {error ? (
        <span className="mt-1 block text-xs font-medium text-error">{error}</span>
      ) : (
        hint && <span className="mt-1 block text-xs text-muted">{hint}</span>
      )}
    </label>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(fieldCls, props.className)} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(fieldCls, props.className)} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(fieldCls, props.className)} />;
}

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return <div className="rounded-lg bg-error/10 px-3 py-2 text-base text-error">{message}</div>;
}
