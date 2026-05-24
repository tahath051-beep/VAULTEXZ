import { useState, useEffect, useCallback, useRef } from 'react';
import { useWorkbookStore } from '@/stores/workbook.store';

interface LiveRatesResult {
  isLive: boolean;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  secondsAgo: number;
  refresh: () => void;
}

const API_URL = 'https://api.frankfurter.app/latest?from=USD&to=EUR,TRY';
const INTERVAL_MS = 60_000;

export function useLiveRates(): LiveRatesResult {
  const setLiveRate = useWorkbookStore((s) => s.setLiveRate);
  const [isLive, setIsLive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [secondsAgo, setSecondsAgo] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const fetchRates = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(API_URL, { signal: abortRef.current.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      // data.rates = { EUR: 0.93, TRY: 45.5 }
      Object.entries(data.rates as Record<string, number>).forEach(([currency, rate]) => {
        setLiveRate(`USD/${currency}`, rate);
      });
      setIsLive(true);
      setLastUpdated(new Date());
      setSecondsAgo(0);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError('Rate fetch failed');
        setIsLive(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, [setLiveRate]);

  // Initial fetch
  useEffect(() => {
    fetchRates();
    const interval = setInterval(fetchRates, INTERVAL_MS);
    return () => {
      clearInterval(interval);
      abortRef.current?.abort();
    };
  }, [fetchRates]);

  // Seconds-ago ticker
  useEffect(() => {
    if (!lastUpdated) return;
    const ticker = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastUpdated.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(ticker);
  }, [lastUpdated]);

  return { isLive, isLoading, error, lastUpdated, secondsAgo, refresh: fetchRates };
}
