import { useCallback, useEffect, useRef, useState } from "react";
import {
  COMMODITIES,
  TICK_MS,
  WATER_POLL_MS,
  fetchLiveWaterPrice,
  perturbPrices,
  tickPrices,
  type CommodityId,
  type LiveWaterQuote,
} from "../lib/model";

type Prices = Record<CommodityId, number>;

const initialPrices = (): Prices =>
  Object.fromEntries(COMMODITIES.map((c) => [c.id, c.base])) as Prices;

/**
 * Streaming market simulation.
 *
 * Prices update on their own every TICK_MS so the dashboard is genuinely
 * "real-time" rather than waiting for a manual refresh. The stream:
 *   - can be paused / resumed by the user,
 *   - auto-pauses while the browser tab is hidden (saves CPU + battery),
 *   - re-polls the live water quote on a slower cadence,
 *   - still supports an immediate manual refresh (bigger perturbation).
 */
export function useLiveMarket() {
  const [prices, setPrices] = useState<Prices>(initialPrices);
  const [jitter, setJitter] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(() => new Date());
  const [waterLive, setWaterLive] = useState<LiveWaterQuote | null>(null);
  const [waterFetching, setWaterFetching] = useState(false);
  const [isLive, setIsLive] = useState(true);
  const [tabVisible, setTabVisible] = useState(
    () => typeof document === "undefined" || !document.hidden,
  );

  const streaming = isLive && tabVisible;
  const waterFetchingRef = useRef(false);

  /* Pause the feed whenever the tab is in the background. */
  useEffect(() => {
    const onVisibility = () => setTabVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  /* The heartbeat: small mean-reverting moves on every tick. */
  useEffect(() => {
    if (!streaming) return;
    const id = window.setInterval(() => {
      setPrices((p) => tickPrices(p));
      setLastUpdated(new Date());
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [streaming]);

  const fetchWater = useCallback(async (silent = false) => {
    if (waterFetchingRef.current) return;
    waterFetchingRef.current = true;
    if (!silent) setWaterFetching(true);
    try {
      const live = await fetchLiveWaterPrice();
      setPrices((p) => ({ ...p, water: live.price }));
      setWaterLive(live);
      setLastUpdated(new Date());
    } finally {
      waterFetchingRef.current = false;
      if (!silent) setWaterFetching(false);
    }
  }, []);

  /* Pull a live water quote on mount, then keep it fresh automatically. */
  useEffect(() => {
    void fetchWater(true);
  }, [fetchWater]);

  useEffect(() => {
    if (!streaming) return;
    const id = window.setInterval(() => void fetchWater(true), WATER_POLL_MS);
    return () => window.clearInterval(id);
  }, [streaming, fetchWater]);

  /* Manual refresh — a larger jolt plus a reshaped forecast curve. */
  const refresh = useCallback(() => {
    setPrices((p) => perturbPrices(p));
    setJitter((j) => j + 1);
    setLastUpdated(new Date());
  }, []);

  const toggleLive = useCallback(() => setIsLive((v) => !v), []);

  return {
    prices,
    jitter,
    lastUpdated,
    waterLive,
    waterFetching,
    isLive,
    streaming,
    tabVisible,
    refresh,
    fetchWater,
    toggleLive,
  };
}
