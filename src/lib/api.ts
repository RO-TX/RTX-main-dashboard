'use client';

import { authStore } from './auth-store';
import type { ApiEnvelope, Pagination } from './types';

// Trim whitespace and a trailing slash — common paste mistakes when setting
// NEXT_PUBLIC_API_URL in a host's dashboard (e.g. a trailing "/" would double
// up against the leading "/" on every path passed to buildUrl).
const BASE = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api').trim().replace(/\/+$/, '');

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }

  /**
   * Per-field messages, e.g. `{ expiryDate: "expiryDate must be after issueDate" }`.
   * Backed by the backend's Zod `.flatten()` shape (`details.fieldErrors`) — pass
   * these to each `<Field error={...}>` so users see exactly which input is wrong,
   * instead of one generic banner at the bottom of the form.
   */
  fieldErrors(): Record<string, string> {
    const d = this.details as { fieldErrors?: Record<string, string[]> } | undefined;
    if (!d?.fieldErrors) return {};
    return Object.fromEntries(
      Object.entries(d.fieldErrors)
        .filter((entry): entry is [string, string[]] => Boolean(entry[1]?.length))
        .map(([field, msgs]) => [field, msgs[0]]),
    );
  }
}

/** Human-readable message for any caught error — use in toasts and error banners. */
export function errorMessage(err: unknown, fallback = 'Something went wrong'): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  auth?: boolean; // attach access token (default true)
  _retry?: boolean;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  let url: URL;
  try {
    url = new URL(BASE + path);
  } catch {
    throw new Error(
      `Invalid API URL "${BASE + path}" — check NEXT_PUBLIC_API_URL (currently "${BASE}"), it must include the protocol (https://...)`,
    );
  }
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== '') url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

/**
 * The backend wraps every Zod validation failure in the generic message
 * "Validation failed", with the actual field-level reason buried in
 * `details.fieldErrors` (Zod's `.flatten()` shape). Surface the first real
 * reason instead — otherwise every form just shows "Validation failed" no
 * matter what's actually wrong.
 */
function formatErrorMessage(message: string | undefined, details: unknown): string {
  const base = message || 'Request failed';
  if (details && typeof details === 'object' && 'fieldErrors' in details) {
    const fieldErrors = (details as { fieldErrors?: Record<string, string[]> }).fieldErrors;
    const first = fieldErrors && Object.entries(fieldErrors).find(([, msgs]) => msgs?.length);
    if (first) return `${first[1][0]} (${first[0]})`;
  }
  return base;
}

let refreshPromise: Promise<boolean> | null = null;

/** Silently exchange the httpOnly refresh cookie for a new access token. */
async function tryRefresh(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch(buildUrl('/auth/refresh'), {
      method: 'POST',
      credentials: 'include',
    })
      .then(async (res) => {
        if (!res.ok) return false;
        const json = (await res.json()) as ApiEnvelope<{ accessToken: string }>;
        if (json?.data?.accessToken) {
          authStore.setToken(json.data.accessToken);
          return true;
        }
        return false;
      })
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

/**
 * Core request. Attaches the bearer token, sends the refresh cookie, and on a
 * 401 transparently refreshes once and retries.
 */
export async function request<T>(path: string, opts: RequestOptions = {}): Promise<ApiEnvelope<T>> {
  const { method = 'GET', body, query, auth = true, _retry = false } = opts;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth && authStore.token) headers.Authorization = `Bearer ${authStore.token}`;

  const res = await fetch(buildUrl(path, query), {
    method,
    headers,
    credentials: 'include',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && auth && !_retry) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return request<T>(path, { ...opts, _retry: true });
    }
    authStore.clear();
  }

  let json: ApiEnvelope<T>;
  try {
    json = (await res.json()) as ApiEnvelope<T>;
  } catch {
    throw new ApiError(res.status, res.statusText || 'Request failed');
  }

  if (!res.ok || json.success === false) {
    throw new ApiError(res.status, formatErrorMessage(json.message, json.details), json.details);
  }
  return json;
}

/** Multipart upload — separate from `request` since it can't be JSON-encoded. */
async function uploadFile(
  path: string,
  formData: FormData,
  _retry = false,
): Promise<ApiEnvelope<{ url: string }>> {
  const headers: Record<string, string> = {};
  if (authStore.token) headers.Authorization = `Bearer ${authStore.token}`;

  const res = await fetch(buildUrl(path), {
    method: 'POST',
    headers,
    credentials: 'include',
    body: formData,
  });

  if (res.status === 401 && !_retry) {
    const refreshed = await tryRefresh();
    if (refreshed) return uploadFile(path, formData, true);
    authStore.clear();
  }

  const json = (await res.json()) as ApiEnvelope<{ url: string }>;
  if (!res.ok || json.success === false) {
    throw new ApiError(res.status, formatErrorMessage(json.message || 'Upload failed', json.details), json.details);
  }
  return json;
}

/* Convenience helpers returning just the data (or data+pagination). */
export const api = {
  get: <T>(path: string, query?: RequestOptions['query']) =>
    request<T>(path, { query }).then((r) => r.data),

  getList: <T>(path: string, query?: RequestOptions['query']) =>
    request<T>(path, { query }).then((r) => ({
      data: r.data,
      pagination: r.meta?.pagination as Pagination | undefined,
    })),

  post: <T>(path: string, body?: unknown, auth = true) =>
    request<T>(path, { method: 'POST', body, auth }).then((r) => r),

  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body }).then((r) => r),

  del: <T>(path: string) => request<T>(path, { method: 'DELETE' }).then((r) => r),

  uploadImage: (file: File, folder: string) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder', folder);
    return uploadFile('/uploads/image', fd).then((r) => r.data.url);
  },
};

export { tryRefresh };
