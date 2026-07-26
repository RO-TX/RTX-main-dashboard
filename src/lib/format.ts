export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export function formatCurrency(amount: number): string {
  return inr.format(amount ?? 0);
}

export function formatDate(value: string | Date): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(value: string | Date): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Short relative time ("2m ago", "3h ago", "5d ago") for notification feeds. */
export function timeAgo(value: string | Date): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  const seconds = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(d);
}

/** Tailwind classes for a status pill, keyed by common status strings. */
export function statusColor(status: string): string {
  const s = status.toLowerCase();
  if (['delivered', 'completed', 'paid', 'active', 'closed'].includes(s))
    return 'bg-success/10 text-success';
  if (['shipped', 'processing', 'confirmed', 'contacted'].includes(s))
    return 'bg-primary/10 text-primary';
  if (['pending', 'orderplaced', 'new', 'processing', 'unpaid'].includes(s))
    return 'bg-warning/10 text-warning';
  if (['cancelled', 'failed', 'refunded'].includes(s)) return 'bg-error/10 text-error';
  return 'bg-muted/10 text-muted';
}
