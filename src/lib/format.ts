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
