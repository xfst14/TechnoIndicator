import { useCallback, useMemo, useState } from "react";

import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import ForecastTool from "./components/ForecastTool";
import FactorsSection from "./components/FactorsSection";
import AboutSection from "./components/AboutSection";
import Footer from "./components/Footer";

import {
  COMMODITIES,
  fetchLiveWaterPrice,
  generateForecast,
  perturbPrices,
  type CommodityId,
  type LiveWaterQuote,
} from "./lib/model";

function getInitialPrices(): Record<CommodityId, number> {
  return Object.fromEntries(
    COMMODITIES.map((commodity) => [commodity.id, commodity.base]),
  ) as Record<CommodityId, number>;
}

export default function App() {
  const [horizon, setHorizon] = useState(5);
  const [prices, setPrices] = useState<Record<CommodityId, number>>(
    () => getInitialPrices(),
  );
  const [lastUpdated, setLastUpdated] = useState(() => new Date());
  const [jitter, setJitter] = useState(0);
  const [waterFetching, setWaterFetching] = useState(false);
  const [waterLive, setWaterLive] = useState<LiveWaterQuote | null>(null);

  const points = useMemo(
    () => generateForecast(prices, horizon, jitter),
    [prices, horizon, jitter],
  );

  const handleRefresh = useCallback(() => {
    setPrices((currentPrices) => perturbPrices(currentPrices));
    setJitter((currentJitter) => currentJitter + Math.random());
    setLastUpdated(new Date());
  }, []);

  const handleFetchWater = useCallback(async () => {
    setWaterFetching(true);

    try {
      const quote = await fetchLiveWaterPrice();

      setWaterLive(quote);
      setPrices((currentPrices) => ({
        ...currentPrices,
        water: quote.price,
      }));
      setJitter((currentJitter) => currentJitter + Math.random());
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to fetch live water price:", error);
    } finally {
      setWaterFetching(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-ink-900 font-sans text-slate-200">
      <Navbar />

      <main>
        <Hero prices={prices} />

        <ForecastTool
          horizon={horizon}
          onHorizon={setHorizon}
          prices={prices}
          points={points}
          lastUpdated={lastUpdated}
          onRefresh={handleRefresh}
          onFetchWater={handleFetchWater}
          waterFetching={waterFetching}
          waterLive={waterLive}
        />

        <FactorsSection horizon={horizon} />

        <AboutSection />
      </main>

      <Footer lastUpdated={lastUpdated} />
    </div>
  );
}
