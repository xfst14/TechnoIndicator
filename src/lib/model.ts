/**
 * TecnoIndicator — client-side forecasting engine.
 *
 * Model:  avg(t) = base × (1 + CAGR)^t × cycle(t) × factorAdjust(t)
 *         min/max(t) = avg(t) × (1 ± σ·√(t/10))
 *
 * Everything runs in the browser — no backend required.
 */

export type CommodityId = "oil" | "electricity" | "water";

export interface Commodity {
  id: CommodityId;
  name: string;
  short: string;
  unit: string;
  base: number;
  cagr: number;
  maxVol: number;
  cycleAmp: number;
  cyclePhase: number;
  color: string;
  floor: number;
  ceil: number;
  decimals: number;
}

export const START_YEAR = new Date().getFullYear();

export const COMMODITIES: Commodity[] = [
  {
    id: "oil",
    name: "Brent Crude Oil",
    short: "Oil",
    unit: "USD/bbl",
    base: 104.86,
    cagr: 0.038,
    maxVol: 0.34,
    cycleAmp: 0.035,
    cyclePhase: 0.6,
    color: "#f5b840",
    floor: 55,
    ceil: 190,
    decimals: 1,
  },
  {
    id: "electricity",
    name: "Global Electricity",
    short: "Electricity",
    unit: "USD/MWh",
    base: 166,
    cagr: 0.046,
    maxVol: 0.26,
    cycleAmp: 0.028,
    cyclePhase: 1.9,
    color: "#2dd4bf",
    floor: 90,
    ceil: 330,
    decimals: 0,
  },
  {
    id: "water",
    name: "Global Water",
    short: "Water",
    unit: "USD/m³",
    base: 2.5,
    cagr: 0.05,
    maxVol: 0.22,
    cycleAmp: 0.02,
    cyclePhase: 3.1,
    color: "#38bdf8",
    floor: 1.1,
    ceil: 7.5,
    decimals: 2,
  },
];

/* ------------------------------------------------------------------ */
/* Key factors / drivers                                               */
/* ------------------------------------------------------------------ */

export type Direction = "up" | "down" | "mixed";
export type Magnitude = "High" | "Medium" | "Low";
export type HorizonBias = "short" | "mid" | "long" | "flat";

export interface Factor {
  id: string;
  name: string;
  category: string;
  commodities: CommodityId[];
  explanation: string;
  direction: Direction;
  magnitude: Magnitude;
  source: string;
  bias: HorizonBias;
  /** Cumulative adjustment contributed at the 10-year horizon, per commodity. */
  drift: Partial<Record<CommodityId, number>>;
}

export const FACTORS: Factor[] = [
  {
    id: "opec",
    name: "OPEC+ Production Decisions",
    category: "Policy",
    commodities: ["oil"],
    explanation:
      "OPEC+ members control roughly 40% of global crude output. Quota cuts tighten supply and lift Brent prices, while output hikes or compliance cracks push prices lower.",
    direction: "up",
    magnitude: "High",
    source: "OPEC Monthly Oil Market Report; IEA",
    bias: "short",
    drift: { oil: 0.012 },
  },
  {
    id: "geopolitics",
    name: "Geopolitical Tensions & Supply Disruptions",
    category: "Geopolitics",
    commodities: ["oil"],
    explanation:
      "Conflicts in the Middle East, sanctions on major exporters, and chokepoint risks such as the Strait of Hormuz periodically remove barrels from the market, adding a persistent risk premium to oil.",
    direction: "up",
    magnitude: "High",
    source: "EIA Short-Term Energy Outlook",
    bias: "flat",
    drift: { oil: 0.018 },
  },
  {
    id: "asia-demand",
    name: "Demand Growth in China & India",
    category: "Demand",
    commodities: ["oil", "electricity"],
    explanation:
      "Asia's two giant economies account for most of the growth in global energy demand. Rising mobility, industrial output, and electrification support both oil and power prices.",
    direction: "up",
    magnitude: "High",
    source: "IEA World Energy Outlook",
    bias: "long",
    drift: { oil: 0.02, electricity: 0.014 },
  },
  {
    id: "renewables",
    name: "Renewable Energy Buildout",
    category: "Transition",
    commodities: ["electricity", "oil"],
    explanation:
      "Solar, wind, and battery storage keep falling in cost and capture an ever-larger share of generation, suppressing wholesale power prices and eroding oil's long-run demand growth.",
    direction: "down",
    magnitude: "High",
    source: "IRENA; BloombergNEF",
    bias: "long",
    drift: { electricity: -0.025, oil: -0.01 },
  },
  {
    id: "weather",
    name: "Weather & Temperature Extremes",
    category: "Climate",
    commodities: ["electricity", "water"],
    explanation:
      "Heat waves and cold snaps spike cooling and heating load, while droughts drain reservoirs and cut hydropower at the same time. Extreme weather adds short-term volatility to power and water prices.",
    direction: "up",
    magnitude: "Medium",
    source: "Copernicus Climate Service; NOAA",
    bias: "short",
    drift: { electricity: 0.008, water: 0.006 },
  },
  {
    id: "scarcity",
    name: "Water Scarcity & Drought",
    category: "Resource",
    commodities: ["water"],
    explanation:
      "Over 2 billion people live in water-stressed countries. Over-extracted aquifers and shrinking glaciers reduce reliable supply, driving municipal and industrial water tariffs steadily upward.",
    direction: "up",
    magnitude: "High",
    source: "UN-Water; WRI Aqueduct",
    bias: "long",
    drift: { water: 0.03 },
  },
  {
    id: "desalination",
    name: "Desalination & Reuse Technology",
    category: "Technology",
    commodities: ["water"],
    explanation:
      "Reverse-osmosis desalination and wastewater reuse keep getting cheaper and more energy-efficient, expanding supply in coastal arid regions and capping the upper end of water price growth.",
    direction: "down",
    magnitude: "Medium",
    source: "International Desalination Association",
    bias: "long",
    drift: { water: -0.012 },
  },
  {
    id: "agriculture",
    name: "Agricultural & Food Demand",
    category: "Demand",
    commodities: ["water"],
    explanation:
      "Farming consumes about 70% of all freshwater withdrawals. Growing populations and richer diets raise irrigation demand, competing directly with municipal and industrial users.",
    direction: "up",
    magnitude: "Medium",
    source: "FAO AQUASTAT",
    bias: "flat",
    drift: { water: 0.01 },
  },
  {
    id: "carbon",
    name: "Carbon & Climate Regulation",
    category: "Policy",
    commodities: ["electricity", "water"],
    explanation:
      "Carbon pricing, emissions trading, and pollution standards raise the cost of fossil generation and fund water infrastructure, pushing utility tariffs higher during the transition.",
    direction: "up",
    magnitude: "High",
    source: "World Bank Carbon Pricing Dashboard; IEA",
    bias: "long",
    drift: { electricity: 0.015, water: 0.008 },
  },
  {
    id: "storage",
    name: "Storage Levels & Inventories",
    category: "Market",
    commodities: ["oil", "water"],
    explanation:
      "High crude inventories and full strategic reserves cushion price spikes, while ample reservoir levels keep water tariffs stable. Low storage has the opposite effect across both markets.",
    direction: "down",
    magnitude: "Medium",
    source: "EIA Weekly Petroleum Status; IEA",
    bias: "short",
    drift: { oil: -0.01, water: -0.006 },
  },
  {
    id: "ev-adoption",
    name: "EV Adoption & Energy Transition",
    category: "Transition",
    commodities: ["oil"],
    explanation:
      "Electric vehicles already displace several million barrels per day of oil demand, and that figure is expected to triple by 2030 — structurally capping oil demand growth over the decade.",
    direction: "down",
    magnitude: "High",
    source: "IEA Global EV Outlook",
    bias: "long",
    drift: { oil: -0.02 },
  },
  {
    id: "infrastructure",
    name: "Grid & Water Infrastructure Investment",
    category: "Investment",
    commodities: ["electricity", "water"],
    explanation:
      "Aging grids need trillions in transmission and resilience spending, while leaky water networks lose 20–30% of supply — costs that regulators ultimately allow to flow into tariffs.",
    direction: "up",
    magnitude: "Medium",
    source: "IEA; World Bank",
    bias: "long",
    drift: { electricity: 0.012, water: 0.012 },
  },
];

/* ------------------------------------------------------------------ */
/* Forecast generation                                                 */
/* ------------------------------------------------------------------ */

export interface PriceBand {
  avg: number;
  min: number;
  max: number;
}

export interface ForecastPoint {
  year: number;
  label: string;
  oil: PriceBand;
  electricity: PriceBand;
  water: PriceBand;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export const round = (v: number, d: number) => {
  const p = Math.pow(10, d);
  return Math.round(v * p) / p;
};

export function generateForecast(
  prices: Record<CommodityId, number>,
  horizon: number,
  jitter = 0,
): ForecastPoint[] {
  const points: ForecastPoint[] = [];
  for (let t = 0; t <= horizon; t++) {
    const entry = {
      year: START_YEAR + t,
      label: String(START_YEAR + t),
    } as ForecastPoint;

    for (const c of COMMODITIES) {
      const base = prices[c.id];
      // Year zero is "today" — exact live snapshot, no trend or noise.
      if (t === 0) {
        entry[c.id] = { avg: round(base, c.decimals), min: round(base, c.decimals), max: round(base, c.decimals) };
        continue;
      }
      const trend = base * Math.pow(1 + c.cagr, t);
      const cycle = 1 + c.cycleAmp * Math.sin(t * 0.9 + c.cyclePhase + jitter * 0.7);
      const driftSum = FACTORS.reduce((acc, f) => acc + (f.drift[c.id] ?? 0) * (t / 10), 0);
      const factorAdjust = clamp(1 + driftSum, 0.85, 1.18);
      const avg = clamp(trend * cycle * factorAdjust, c.floor, c.ceil);
      const vol = c.maxVol * Math.sqrt(t / 10);
      entry[c.id] = {
        avg: round(avg, c.decimals),
        min: round(avg * (1 - vol), c.decimals),
        max: round(avg * (1 + vol), c.decimals),
      };
    }
    points.push(entry);
  }
  return points;
}

/* ------------------------------------------------------------------ */
/* "Real-time" simulation                                              */
/* ------------------------------------------------------------------ */

export function perturbPrices(current: Record<CommodityId, number>): Record<CommodityId, number> {
  const j = (pct: number) => (Math.random() - 0.5) * 2 * pct;
  return {
    oil: round(clamp(current.oil * (1 + j(0.03)), 96, 118), 2),
    electricity: round(clamp(current.electricity * (1 + j(0.025)), 158, 178), 1),
    water: round(clamp(current.water * (1 + j(0.04)), 2.15, 3.1), 2),
  };
}

/** Live-feed cadence, in milliseconds. */
export const TICK_MS = 2500;
/** How often the live water quote is automatically re-polled. */
export const WATER_POLL_MS = 30000;

/** Trading bands + per-tick step size for the streaming market simulation. */
const TICK_CONFIG: Record<
  CommodityId,
  { step: number; lo: number; hi: number; anchor: number; decimals: number }
> = {
  oil: { step: 0.0035, lo: 96, hi: 118, anchor: 104.86, decimals: 2 },
  electricity: { step: 0.0028, lo: 158, hi: 178, anchor: 166, decimals: 1 },
  water: { step: 0.0042, lo: 2.15, hi: 3.1, anchor: 2.5, decimals: 2 },
};

/**
 * Advances the market by one tick using a mean-reverting random walk
 * (Ornstein–Uhlenbeck style). Each step is small so the numbers visibly
 * "breathe" like a live feed instead of jumping, while the pull toward the
 * anchor keeps prices inside a realistic long-run band.
 */
export function tickPrices(
  current: Record<CommodityId, number>,
): Record<CommodityId, number> {
  const next = {} as Record<CommodityId, number>;
  for (const c of COMMODITIES) {
    const cfg = TICK_CONFIG[c.id];
    const price = current[c.id];
    const shock = (Math.random() - 0.5) * 2 * cfg.step;
    const reversion = ((cfg.anchor - price) / cfg.anchor) * 0.08;
    next[c.id] = round(clamp(price * (1 + shock + reversion), cfg.lo, cfg.hi), cfg.decimals);
  }
  return next;
}

export interface LiveWaterQuote {
  price: number;
  asOf: string;
  source: string;
  range: string;
}

/**
 * Simulated live water-price feed. Returns a plausible current global
 * average municipal/industrial water price within the realistic
 * ~$2.00–$3.40/m³ band, styled like a real market quote.
 */
export function fetchLiveWaterPrice(): Promise<LiveWaterQuote> {
  const price = round(2.22 + Math.random() * 1.08, 2);
  const asOf = new Date().toLocaleTimeString("en-GB", { hour12: false });
  return new Promise((resolve) =>
    setTimeout(
      () =>
        resolve({
          price,
          asOf,
          source: "Global Water Index · simulated live feed",
          range: "$2.00 – $3.40 /m³ global band",
        }),
      1100,
    ),
  );
}

/* ------------------------------------------------------------------ */
/* Factor relevance over the horizon                                   */
/* ------------------------------------------------------------------ */

export function factorRelevance(bias: HorizonBias, horizon: number): number {
  const h = clamp(horizon, 1, 10) / 10;
  switch (bias) {
    case "short":
      return 1.7 - 0.9 * h;
    case "long":
      return 0.85 + 0.95 * h;
    case "mid":
      return 1.65 - Math.abs(h - 0.55) * 1.35;
    default:
      return 1.3;
  }
}

export type RelevanceTrend = "rising" | "fading" | "steady";

export function relevanceTrend(bias: HorizonBias, horizon: number): RelevanceTrend {
  const delta = factorRelevance(bias, horizon) - factorRelevance(bias, 5);
  if (delta > 0.12) return "rising";
  if (delta < -0.12) return "fading";
  return "steady";
}

/* ------------------------------------------------------------------ */
/* Formatting + export helpers                                         */
/* ------------------------------------------------------------------ */

export const fmtUsd = (v: number, d = 2) =>
  "$" +
  v.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

export const fmtFullDate = (d: Date) =>
  d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

export const fmtTime = (d: Date) =>
  d.toLocaleTimeString("en-GB", { hour12: false });

export const hexToRgba = (hex: string, alpha: number) => {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export function buildCSV(points: ForecastPoint[]): string {
  const header = [
    "Year",
    "Oil Avg (USD/bbl)",
    "Oil Min",
    "Oil Max",
    "Electricity Avg (USD/MWh)",
    "Electricity Min",
    "Electricity Max",
    "Water Avg (USD/m3)",
    "Water Min",
    "Water Max",
  ];
  const rows = points.map((p) => [
    p.year,
    p.oil.avg,
    p.oil.min,
    p.oil.max,
    p.electricity.avg,
    p.electricity.min,
    p.electricity.max,
    p.water.avg,
    p.water.min,
    p.water.max,
  ]);
  return [header, ...rows].map((r) => r.join(",")).join("\n");
}

export function downloadFile(name: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 400);
}

export const commodityById = (id: CommodityId): Commodity =>
  COMMODITIES.find((c) => c.id === id) ?? COMMODITIES[0];
