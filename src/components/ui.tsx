'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, Inbox, X, Check, ChevronDown, ImagePlus } from 'lucide-react';
import { cn, statusColor } from '@/lib/format';
import { fieldCls } from '@/components/form';
import { api, ApiError } from '@/lib/api';
import { toast } from '@/lib/toast';

/**
 * StatusSelect — a fully custom dropdown (NOT a native <select>, so the menu is
 * on-brand and consistent everywhere). The menu renders in a portal so it's
 * never clipped by table overflow. Reused for order status, role, etc.
 */
export function StatusSelect({
  value,
  onChange,
  options,
  format,
  ariaLabel,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  format?: (v: string) => string;
  ariaLabel?: string;
  className?: string;
}) {
  const fmt = format ?? ((v: string) => v.replace(/_/g, ' '));
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, right: 0, minW: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const r = btnRef.current?.getBoundingClientRect();
    if (r) setCoords({ top: r.bottom + 6, right: window.innerWidth - r.right, minW: r.width });

    const onDown = (e: MouseEvent) => {
      const t = e.target as Element;
      if (btnRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      // Cross-portal safety: a click inside ANY body-portaled popup (e.g. this
      // menu nested under another one) must not be treated as "outside".
      if (t.closest?.('[data-dropdown-popup]')) return;
      setOpen(false);
    };
    const onScroll = () => setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className={cn('inline-block', className)}>
      <button
        ref={btnRef}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg border border-border bg-white py-1.5 pl-3 pr-2 text-sm font-semibold capitalize text-heading outline-none transition hover:border-navy-300 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-glow"
      >
        <span>{fmt(value)}</span>
        <ChevronDown className={cn('h-3.5 w-3.5 text-muted transition-transform', open && 'rotate-180')} />
      </button>

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                ref={menuRef}
                role="listbox"
                data-dropdown-popup=""
                onMouseDown={(e) => e.stopPropagation()}
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.13, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  position: 'fixed',
                  top: coords.top,
                  right: coords.right,
                  minWidth: Math.max(coords.minW, 150),
                  maxHeight: `calc(100vh - ${coords.top}px - 8px)`,
                }}
                className="z-[100] overflow-auto rounded-xl border border-border bg-white p-1.5 shadow-[0_18px_50px_-20px_rgba(6,47,79,0.35)]"
              >
                {options.map((o) => {
                  const active = o === value;
                  return (
                    <button
                      key={o}
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => {
                        onChange(o);
                        setOpen(false);
                      }}
                      className={cn(
                        'flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium capitalize transition',
                        active ? 'bg-primary text-white' : 'text-body hover:bg-primary-light hover:text-primary',
                      )}
                    >
                      {fmt(o)}
                      {active && <Check className="h-3.5 w-3.5 shrink-0" />}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}

/**
 * FieldSelect — themed dropdown for form fields (category type, role, etc.).
 * Same portal + solid-menu pattern as StatusSelect, but full-width and with
 * explicit {value,label} options instead of a status-string list. Replaces
 * the native <select> in form.tsx, whose menu/arrow can't be themed.
 */
export function FieldSelect({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  required,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const r = btnRef.current?.getBoundingClientRect();
    if (r) setCoords({ top: r.bottom + 6, left: r.left, width: r.width });

    const onDown = (e: MouseEvent) => {
      const t = e.target as Element;
      if (btnRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      if (t.closest?.('[data-dropdown-popup]')) return;
      setOpen(false);
    };
    const onScroll = () => setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className={cn('relative', className)}>
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-required={required}
        onClick={() => setOpen((o) => !o)}
        className={cn(fieldCls, 'flex items-center justify-between gap-2 text-left')}
      >
        <span className={selected ? 'text-heading' : 'text-muted'}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted transition-transform', open && 'rotate-180')} />
      </button>

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                ref={menuRef}
                role="listbox"
                data-dropdown-popup=""
                onMouseDown={(e) => e.stopPropagation()}
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.13, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  position: 'fixed',
                  top: coords.top,
                  left: Math.max(8, Math.min(coords.left, window.innerWidth - coords.width - 8)),
                  width: coords.width,
                  maxHeight: `calc(100vh - ${coords.top}px - 8px)`,
                }}
                className="z-[100] overflow-auto rounded-xl border border-border bg-white p-1.5 shadow-[0_18px_50px_-20px_rgba(6,47,79,0.35)]"
              >
                {options.map((o) => {
                  const active = o.value === value;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => {
                        onChange(o.value);
                        setOpen(false);
                      }}
                      className={cn(
                        'flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-base font-medium transition',
                        active ? 'bg-primary text-white' : 'text-body hover:bg-primary-light hover:text-primary',
                      )}
                    >
                      {o.label}
                      {active && <Check className="h-3.5 w-3.5 shrink-0" />}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}

/**
 * ImageLightbox — click a thumbnail anywhere to view it full-size. Portals to
 * <body>, locks background scroll while open, closes on Escape/backdrop/✕.
 */
export function ImageLightbox({ src, onClose }: { src: string | null; onClose: () => void }) {
  useEffect(() => {
    if (!src) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [src, onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {src && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 p-6 backdrop-blur-sm"
        >
          <motion.img
            src={src}
            alt=""
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="max-h-[85vh] max-w-[90vw] rounded-2xl object-contain shadow-[0_40px_80px_-24px_rgba(0,0,0,0.5)]"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="fixed right-5 top-5 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/**
 * ImageUploader — direct file upload to S3 (via /uploads/image), replacing
 * raw URL text fields. Supports 1..N images with drag-free file picker,
 * thumbnail previews, per-image remove, and upload progress per slot. Click
 * a thumbnail to open it full-size in ImageLightbox.
 */
export function ImageUploader({
  images,
  onChange,
  folder,
  max = 6,
}: {
  images: string[];
  onChange: (urls: string[]) => void;
  folder: string;
  max?: number;
}) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const slots = Math.max(0, max - images.length);
    const picked = Array.from(files).slice(0, slots);
    if (picked.length === 0) {
      toast.error(`Max ${max} images`);
      return;
    }
    setUploading(true);
    try {
      const uploaded = await Promise.all(picked.map((f) => api.uploadImage(f, folder)));
      onChange([...images, ...uploaded]);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {images.map((url, i) => (
          <div key={url} className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border bg-surface-alt">
            <button
              type="button"
              onClick={() => setPreview(url)}
              aria-label="View image"
              className="block h-full w-full cursor-zoom-in"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-cover transition group-hover:brightness-90" />
            </button>
            <button
              type="button"
              onClick={() => onChange(images.filter((_, idx) => idx !== i))}
              aria-label="Remove image"
              className="pointer-events-none absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:pointer-events-auto group-hover:opacity-100"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {images.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex h-20 w-20 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border text-muted transition hover:border-primary hover:text-primary disabled:opacity-60"
          >
            {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
            <span className="text-xs font-medium">{uploading ? 'Uploading' : 'Add'}</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        multiple
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />
      <ImageLightbox src={preview} onClose={() => setPreview(null)} />
    </div>
  );
}

/**
 * InlinePanel — an in-flow form container (NOT a modal pop-up). Renders as a
 * frosted glass card with a header + close. Use for create/edit forms so they
 * appear within the screen rather than as an overlay.
 */
export function InlinePanel({
  title,
  description,
  onClose,
  children,
}: {
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Row-triggered edits can open this panel far below the current scroll
  // position (it always renders at the top of the page); bring it into view
  // instead of leaving it off-screen above the user.
  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <div ref={ref} className="glass-card mb-5 scroll-mt-4 animate-[slideIn_.2s_ease-out] p-5">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold text-heading">{title}</h2>
          {description && <p className="text-sm text-muted">{description}</p>}
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="rounded-lg p-1.5 text-muted transition hover:bg-surface-alt hover:text-heading"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      {children}
    </div>
  );
}

/**
 * ConfirmButton — inline two-step confirmation (NO pop-up dialog). First click
 * arms it (button morphs to Confirm / Cancel); confirm runs the action.
 */
export function ConfirmButton({
  onConfirm,
  title = 'Delete',
  className,
  children,
}: {
  onConfirm: () => void | Promise<void>;
  title?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [armed, setArmed] = useState(false);

  if (armed) {
    return (
      <span className="inline-flex items-center gap-1">
        <button
          onClick={async () => {
            setArmed(false);
            await onConfirm();
          }}
          className="inline-flex items-center gap-1 rounded-lg bg-error px-2 py-1 text-sm font-semibold text-white transition hover:opacity-90"
        >
          <Check className="h-3.5 w-3.5" /> Confirm
        </button>
        <button
          onClick={() => setArmed(false)}
          className="rounded-lg border border-border bg-surface px-2 py-1 text-sm font-semibold text-body transition hover:bg-surface-alt"
        >
          Cancel
        </button>
      </span>
    );
  }
  return (
    <button
      onClick={() => setArmed(true)}
      title={title}
      className={className}
    >
      {children}
    </button>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="relative mb-9 pt-1">
      {/* Water-ripple rings behind the title — flat concentric circles (no
          gradients), on-brand for an RO/water company. Clearly visible but
          bounded to the header's own height, kept behind via -z-10. Identical
          on every page since PageHeader is the one shared component. */}
      <div aria-hidden className="pointer-events-none absolute -left-4 -top-10 -z-10 h-40 w-40 overflow-hidden">
        <div className="absolute left-0 top-0 h-40 w-40 rounded-full border-[3px] border-primary/25" />
        <div className="absolute left-6 top-6 h-28 w-28 rounded-full border-[3px] border-primary/30" />
        <div className="absolute left-12 top-12 h-16 w-16 rounded-full border-[3px] border-primary/35" />
        <div className="absolute left-[4.5rem] top-[4.5rem] h-7 w-7 rounded-full bg-primary/25" />
      </div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <span aria-hidden className="hidden h-9 w-1.5 rounded-full bg-primary sm:block" />
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-heading sm:text-4xl lg:text-5xl">{title}</h1>
            {subtitle && <p className="mt-1.5 text-base text-muted">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
    </div>
  );
}

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('glass-card p-5', className)}>{children}</div>;
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-sm font-semibold capitalize',
        statusColor(status),
      )}
    >
      {status}
    </span>
  );
}

export function Button({
  children,
  variant = 'primary',
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'outline' }) {
  const styles = {
    primary: 'bg-primary text-white hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25',
    ghost: 'text-body hover:bg-surface-alt',
    outline: 'border border-border bg-surface text-body hover:bg-surface-alt',
  }[variant];
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-base font-semibold transition-all duration-200 hover:scale-[1.02] disabled:pointer-events-none disabled:opacity-60 disabled:hover:scale-100',
        styles,
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-base text-muted">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-error/20 bg-error/5 px-4 py-8 text-center text-base text-error">
      {message}
    </div>
  );
}

export function EmptyState({ message = 'Nothing here yet.' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-16 text-muted">
      <Inbox className="h-8 w-8" />
      <p className="text-base">{message}</p>
    </div>
  );
}

/* Simple table primitives */
export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="glass overflow-x-auto rounded-2xl">
      <table className="w-full text-left text-base">{children}</table>
    </div>
  );
}
export function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        'whitespace-nowrap border-b border-r border-border bg-surface-alt px-4 py-3 text-sm font-semibold uppercase tracking-wide text-muted last:border-r-0',
        className,
      )}
    >
      {children}
    </th>
  );
}
export function Td({
  children,
  className,
  onClick,
}: {
  children?: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}) {
  return (
    <td
      onClick={onClick}
      className={cn(
        'whitespace-nowrap border-b border-r border-border-light px-4 py-3 text-body last:border-r-0',
        className,
      )}
    >
      {children}
    </td>
  );
}

/**
 * DataTable — column-driven table. Every list page defines its columns once
 * (key/label/render) instead of hand-rolling <thead>/<tbody> markup. Pass
 * `onRowClick` to make rows selectable (pairs with DetailPanel below) —
 * interactive cells (edit/delete/status-select) should stop propagation in
 * their own `render` so a click on them doesn't also select the row.
 */
export interface DataTableColumn<T> {
  key: string;
  label: string;
  render: (row: T) => React.ReactNode;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  getRowId,
  onRowClick,
  selectedId,
}: {
  columns: DataTableColumn<T>[];
  data: T[];
  getRowId: (row: T) => string;
  onRowClick?: (row: T) => void;
  selectedId?: string | null;
}) {
  return (
    <Table>
      <thead>
        <tr>
          {columns.map((c) => (
            <Th key={c.key} className={c.className}>
              {c.label}
            </Th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row) => {
          const id = getRowId(row);
          const selected = selectedId === id;
          return (
            <tr
              key={id}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(
                onRowClick && 'cursor-pointer transition hover:bg-primary-light/50',
                selected && 'bg-primary-light/70',
              )}
            >
              {columns.map((c) => (
                <Td key={c.key} className={c.className}>
                  {c.render(row)}
                </Td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
}

/**
 * DetailPanel — the shared "detail card" that opens to the right of a
 * DataTable when a row is clicked (the table compresses via its own
 * max-width, this panel doesn't overlay it). One consistent label/value
 * layout reused across every list page for visual consistency.
 */
export interface DetailField {
  label: string;
  value: React.ReactNode;
}

export function DetailPanel({
  title,
  subtitle,
  image,
  badge,
  fields,
  onClose,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  image?: string;
  badge?: React.ReactNode;
  fields: DetailField[];
  onClose: () => void;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="glass-card sticky top-0 w-full shrink-0 self-start animate-[slideIn_.2s_ease-out] p-5 lg:w-[380px]">
      <div className="mb-4 flex items-start justify-between gap-2">
        <div className="min-w-0">
          {image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="" className="mb-3 h-16 w-16 rounded-xl border border-border object-cover" />
          )}
          <div className="flex items-center gap-2">
            <h3 className="truncate text-lg font-bold text-heading">{title}</h3>
            {badge}
          </div>
          {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="shrink-0 rounded-lg p-1.5 text-muted transition hover:bg-surface-alt hover:text-heading"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <dl className="space-y-3">
        {fields.map((f, i) => (
          <div
            key={i}
            className="flex items-start justify-between gap-3 border-b border-border-light pb-3 last:border-0 last:pb-0"
          >
            <dt className="shrink-0 text-sm text-muted">{f.label}</dt>
            <dd className="min-w-0 text-right text-sm font-medium text-heading">{f.value}</dd>
          </div>
        ))}
      </dl>

      {children && <div className="mt-4">{children}</div>}
      {actions && <div className="mt-4 flex justify-end gap-2 border-t border-border-light pt-4">{actions}</div>}
    </div>
  );
}
