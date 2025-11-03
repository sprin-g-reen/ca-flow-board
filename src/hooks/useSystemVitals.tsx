import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getValidatedToken } from '@/lib/auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface SystemVitals {
  cpu?: {
    load?: string | number;
    system?: string | number;
    user?: string | number;
    idle?: string | number;
  };
  memory?: {
    used?: string | number;
    total?: string | number;
    usage?: string | number;
  };
  uptime?: number;
  // optional fields sometimes returned by different backends
  threads?: number;
  threadCount?: number;
  processes?: number;
  processCount?: number;
  loadAverages?: {
    oneMin?: string | number;
    fiveMin?: string | number;
    fifteenMin?: string | number;
  }
}

export const useSystemVitals = (pollIntervalSec = 5) => {
  const [vitals, setVitals] = useState<SystemVitals | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVitals = async () => {
      try {
        const token = getValidatedToken();
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const response = await fetch(`${API_BASE_URL}/vitals`, {
          headers,
        });

        if (!response.ok) {
          throw new Error('Failed to fetch system vitals');
        }

        const raw = await response.json();

        // Normalize common shapes from different backends
        const data: any = raw || {};

        const normalized: SystemVitals = {
          cpu: data.cpu || (data.load ? { load: data.load } : undefined) || undefined,
          memory: data.memory || data.mem || undefined,
          uptime: data.uptime || data.uptime_seconds || data.uptime_sec || undefined,
          threads: data.threads ?? data.threadCount ?? data.thread_count ?? undefined,
          threadCount: data.threadCount ?? data.threads ?? data.thread_count ?? undefined,
          processes: data.processes ?? data.processCount ?? data.process_count ?? undefined,
          processCount: data.processCount ?? data.processes ?? data.process_count ?? undefined,
          loadAverages: (() => {
            if (data.loadAverages) return data.loadAverages;
            if (Array.isArray(data.loadavg) && data.loadavg.length >= 3) {
              return { oneMin: data.loadavg[0], fiveMin: data.loadavg[1], fifteenMin: data.loadavg[2] };
            }
            if (data.loadavg1 || data.loadavg5 || data.loadavg15) {
              return { oneMin: data.loadavg1, fiveMin: data.loadavg5, fifteenMin: data.loadavg15 };
            }
            return undefined;
          })(),
        };

        setVitals(normalized);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        setError(errorMessage);
        toast.error('Could not load system vitals.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVitals(); // Initial fetch

    const intervalId = setInterval(fetchVitals, pollIntervalSec * 1000);

    return () => clearInterval(intervalId);
  }, [pollIntervalSec]);

  return { vitals, isLoading, error };
};
