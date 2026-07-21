'use client';

import { useState } from 'react';
import { Send, Loader2, Copy, Check } from 'lucide-react';
import { request, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { PageHeader, Card } from '@/components/ui';

const cnBtn =
  'inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:opacity-60';

const PRESETS: { label: string; method: Method; path: string; body?: string }[] = [
  { label: 'GET /auth/me', method: 'GET', path: '/auth/me' },
  { label: 'GET /analytics/overview', method: 'GET', path: '/analytics/overview' },
  { label: 'GET /catalog/products', method: 'GET', path: '/catalog/products?limit=5' },
  { label: 'GET /catalog/categories', method: 'GET', path: '/catalog/categories' },
  { label: 'GET /orders', method: 'GET', path: '/orders?limit=5' },
  { label: 'GET /users', method: 'GET', path: '/users?limit=5' },
  { label: 'GET /content/reviews', method: 'GET', path: '/content/reviews' },
  { label: 'GET /support/repair-requests', method: 'GET', path: '/support/repair-requests' },
  {
    label: 'POST /catalog/categories',
    method: 'POST',
    path: '/catalog/categories',
    body: JSON.stringify(
      { name: 'New Category', catImage: 'https://placehold.co/600x400', description: '' },
      null,
      2,
    ),
  },
  {
    label: 'POST /support/amc-enquiries',
    method: 'POST',
    path: '/support/amc-enquiries',
    body: JSON.stringify(
      { name: 'Test Lead', email: 'lead@example.com', mobile: '9876543210', address: 'Delhi' },
      null,
      2,
    ),
  },
];

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE';
const METHODS: Method[] = ['GET', 'POST', 'PATCH', 'DELETE'];

interface Result {
  status: number;
  ok: boolean;
  ms: number;
  body: unknown;
}

export default function ApiTesterPage() {
  const token = useAuth((s) => s.accessToken);
  const [method, setMethod] = useState<Method>('GET');
  const [path, setPath] = useState('/analytics/overview');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [copied, setCopied] = useState(false);

  function applyPreset(p: (typeof PRESETS)[number]) {
    setMethod(p.method);
    setPath(p.path);
    setBody(p.body ?? '');
    setResult(null);
  }

  async function send() {
    setLoading(true);
    setResult(null);
    const started = performance.now();
    let parsedBody: unknown;
    if (body.trim() && method !== 'GET' && method !== 'DELETE') {
      try {
        parsedBody = JSON.parse(body);
      } catch {
        setResult({ status: 0, ok: false, ms: 0, body: { error: 'Invalid JSON in request body' } });
        setLoading(false);
        return;
      }
    }
    // strip the leading /api if the user typed it
    const cleanPath = path.replace(/^\/api/, '');
    try {
      const res = await request<unknown>(cleanPath, { method, body: parsedBody });
      setResult({ status: 200, ok: true, ms: Math.round(performance.now() - started), body: res });
    } catch (err) {
      const status = err instanceof ApiError ? err.status : 0;
      const payload =
        err instanceof ApiError ? { message: err.message, details: err.details } : { error: String(err) };
      setResult({ status, ok: false, ms: Math.round(performance.now() - started), body: payload });
    } finally {
      setLoading(false);
    }
  }

  function copyResult() {
    navigator.clipboard.writeText(JSON.stringify(result?.body, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div>
      <PageHeader
        title="API Tester"
        subtitle="Send authenticated requests to the RTX backend. Your access token is attached automatically."
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        {/* Request builder */}
        <div className="space-y-4">
          <Card>
            <div className="flex flex-wrap gap-2">
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as Method)}
                className="rounded-xl border border-border bg-surface-alt px-3 py-2.5 text-sm font-semibold text-heading outline-none focus:border-primary"
              >
                {METHODS.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
              <input
                value={path}
                onChange={(e) => setPath(e.target.value)}
                spellCheck={false}
                className="min-w-[240px] flex-1 rounded-xl border border-border bg-surface-alt px-3 py-2.5 font-mono text-sm text-heading outline-none focus:border-primary focus:ring-2 focus:ring-glow"
                placeholder="/catalog/products"
              />
              <button onClick={send} disabled={loading} className={cnBtn}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send
              </button>
            </div>

            {(method === 'POST' || method === 'PATCH') && (
              <div className="mt-3">
                <label className="mb-1 block text-xs font-medium text-muted">Request body (JSON)</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  spellCheck={false}
                  rows={8}
                  className="w-full rounded-xl border border-border bg-navy-900 px-3 py-2.5 font-mono text-xs text-navy-100 outline-none focus:border-primary"
                  placeholder='{ "key": "value" }'
                />
              </div>
            )}
          </Card>

          {/* Response */}
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-bold text-heading">Response</h3>
              {result && (
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                      result.ok ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
                    }`}
                  >
                    {result.status || 'ERR'} · {result.ms}ms
                  </span>
                  <button
                    onClick={copyResult}
                    className="flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs text-muted hover:bg-surface-alt"
                  >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              )}
            </div>
            <pre className="max-h-[420px] overflow-auto rounded-xl bg-navy-900 p-4 font-mono text-xs leading-relaxed text-navy-100">
              {result ? JSON.stringify(result.body, null, 2) : 'Send a request to see the response…'}
            </pre>
          </Card>
        </div>

        {/* Presets */}
        <div className="space-y-3">
          <Card>
            <h3 className="mb-3 font-bold text-heading">Quick endpoints</h3>
            <div className="flex flex-col gap-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => applyPreset(p)}
                  className="rounded-lg px-3 py-2 text-left font-mono text-xs text-body transition hover:bg-primary-light hover:text-primary"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </Card>
          <Card>
            <h3 className="mb-2 text-sm font-bold text-heading">Auth</h3>
            <p className="text-xs text-muted">
              {token ? 'Access token attached ✓' : 'No token — log in first.'}
            </p>
            <p className="mt-2 break-all font-mono text-[10px] text-muted">
              {token ? `${token.slice(0, 32)}…` : ''}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
