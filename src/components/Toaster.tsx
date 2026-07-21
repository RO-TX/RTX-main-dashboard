'use client';

import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import { useToastStore, type ToastType } from '@/lib/toast';
import { cn } from '@/lib/format';

const ICONS: Record<ToastType, typeof Info> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const STYLES: Record<ToastType, string> = {
  success: 'border-success/30 text-success',
  error: 'border-error/30 text-error',
  info: 'border-primary/30 text-primary',
};

export function Toaster() {
  const { toasts, dismiss } = useToastStore();

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[100] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((t) => {
        const Icon = ICONS[t.type];
        return (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto flex items-start gap-3 rounded-xl border bg-surface px-4 py-3 shadow-lg shadow-heading/5 animate-[slideIn_.2s_ease-out]',
              STYLES[t.type],
            )}
          >
            <Icon className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="flex-1 text-sm font-medium text-heading">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              className="rounded p-0.5 text-muted transition hover:text-heading"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
