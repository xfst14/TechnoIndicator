// src/hooks/useLiveMarket.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  COMMODITIES,
  fetchLiveWaterPrice,
  perturbPrices,
  type CommodityId,
  type LiveWaterQuote,
} from '../lib/model';

/** Builds initial prices from COMMODITIES base values. */
function getInitialPrices(): Record<CommodityId, number> {
  return Object.fromEntries(
    COMMODITIES.map((c) => [c.id, c.base]),
  ) as Record<CommodityId, number>;
}

/** Polling interval (ms) when live-streaming is enabled. */
const STREAM_INTERVAL_MS = 8_000;

export interface UseLiveMarketReturn {
  prices: Record<CommodityId, number>;
  jitter: number;
  lastUpdated: Date;
  waterLive: LiveWaterQuote | null;
  waterFetching: boolean;
  isLive: boolean;
  streaming: boolean;
  refresh: () => void;
  fetchWater: () => Promise<void>;
  toggleLive: () => void;
}

export function useLiveMarket(): UseLiveMarketReturn {
  const [prices, setPrices] = useState<Record<CommodityId, number>>(getInitialPrices);
  const [jitter, setJitter] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(() => new Date());
  const [waterLive, setWaterLive] = useState<LiveWaterQuote | null>(null);
  const [waterFetching, setWaterFetching] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [streaming, setStreaming] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /** One-shot refresh: perturb all prices. */
  const refresh = useCallback(() => {
    setPrices((cur) => perturbPrices(cur));
    setJitter((j) => j + Math.random());
    setLastUpdated(new Date());
  }, []);

  /** Fetch real-time water futures price. */
  const fetchWater = useCallback(async () => {
    setWaterFetching(true);
    try {
      const quote = await fetchLiveWaterPrice();
      setWaterLive(quote);
      setPrices((cur) => ({ ...cur, water: quote.price }));
      setJitter((j) => j + Math.random());
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch live water price:', err);
    } finally {
      setWaterFetching(false);
    }
  }, []);

  /** Toggle auto-streaming (simulated live feed via periodic perturb). */
  const toggleLive = useCallback(() => {
    setIsLive((prev) => !prev);
  }, []);

  // Start / stop the streaming interval when isLive changes.
  useEffect(() => {
    if (isLive) {
      setStreaming(true);
      intervalRef.current = setInterval(() => {
        setPrices((cur) => perturbPrices(cur));
        setJitter((j) => j + Math.random());
        setLastUpdated(new Date());
      }, STREAM_INTERVAL_MS);
    } else {
      setStreaming(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isLive]);

  return {
    prices,
    jitter,
    lastUpdated,
    waterLive,
    waterFetching,
    isLive,
    streaming,
    refresh,
    fetchWater,
    toggleLive,
  };
}
