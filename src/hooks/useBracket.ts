import { useCallback, useEffect, useState } from 'react';
import type { Bracket } from '../types/bracket';
import { api } from '../api/client';

/** Fetch the bracket once, and optionally poll every `pollMs` for live updates. */
export function useBracket(pollMs?: number) {
  const [bracket, setBracket] = useState<Bracket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const b = await api.getBracket();
      setBracket(b);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load bracket');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    if (!pollMs) return;
    const id = window.setInterval(refresh, pollMs);
    return () => window.clearInterval(id);
  }, [refresh, pollMs]);

  return { bracket, loading, error, refresh, setBracket };
}
