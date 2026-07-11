import { useCallback, useEffect, useState } from 'react';
import type { Tournament } from '../types/bracket';
import { api } from '../api/client';

/** Fetch the tournament once, and optionally poll every `pollMs` for live updates. */
export function useTournament(pollMs?: number) {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const t = await api.getTournament();
      setTournament(t);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load tournament');
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

  return { tournament, loading, error, refresh, setTournament };
}
