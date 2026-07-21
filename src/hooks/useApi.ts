'use client';

import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '@/lib/api';

interface State<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Minimal data-fetching hook (SWR-lite). Re-runs when any dependency in `deps`
 * changes. Returns { data, loading, error, refetch }.
 */
export function useApi<T>(fetcher: () => Promise<T>, deps: unknown[] = []): State<T> & {
  refetch: () => void;
} {
  const [state, setState] = useState<State<T>>({ data: null, loading: true, error: null });

  const run = useCallback(() => {
    let active = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    fetcher()
      .then((data) => {
        if (active) setState({ data, loading: false, error: null });
      })
      .catch((err) => {
        if (!active) return;
        const message = err instanceof ApiError ? err.message : 'Something went wrong';
        setState({ data: null, loading: false, error: message });
      });
    return () => {
      active = false;
    };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => run(), [run]);

  return { ...state, refetch: run };
}
