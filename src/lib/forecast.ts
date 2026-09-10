/* ------------------------------------------------------------------
 * TecnoIndicator — client-side forecasting engine
 * Base trend (CAGR) + volatility cone + factor drift adjustments.
 * All math runs in the browser; no backend required.
 * ------------------------------------------------------------------ */

export type CommodityId = "oil" | "electricity";
export type Direction = "up" | "down" | "both";
export type Trend = "rising" | "fading" | "stable";

export interface Factor {
  id: string;
  name: string;
  category: "Supply" | "Demand" | "Policy" | "Macro" | "Technology";
  appliesTo: CommodityId | "both";
  direction: Direction;
  magnitude: 0.8 | 0.5 | 0.25;
  explanation: string;
  source: string;
  /** Relevance by horizon bucket: 1-3y (short), 4-6y (mid), 7-10y (long) */
  relevance: { short: number; mid: number; long: number };
  /** Signed annual contribution to the drift term at full relevance (fraction, e.g. 0.012 = +1.2%/yr) */
  drift: { oil: number; electricity: number };
}

export interface CommodityConfig {
  id: CommodityId;
  label: string;
  benchmark: string;
  unit: string;
  unitShort: string;
  basePrice: number;
  cagr: number;
  volatility: number;
}

export interface ScenarioPoint {
  avg: number;
  min: number;
  max: number;
}

export interface ForecastRow {
  year: number;
  oil: ScenarioPoint;
  electricity: ScenarioPoint;
}

/** Perturbation state produced by "Refresh data" and the live ticker */
export interface ModelSeed {
  base: Record<CommodityId, number>;
  cagr: Record<CommodityId, number>;
  drift: Record<string, number>;
}

export const START_YEAR = new Date().getFullYear();
export const MAX_HORIZON = 10;
export const BAND_SCALE = 0.6;

/* ---------- Current market levels (researched, Sept 2026) ---------- */
export const COMMODITIES: CommodityConfig[] = [
  {
    id: "oil",
    label: "Brent Crude",
    benchmark: "ICE Brent front-month",
    unit: "USD / barrel",
    unitShort: "$/bbl",
    basePrice: 98.5,
    cagr: 0.025,
    volatility: 0.32,
  },
  {
    id: "electricity",
    label: "Global Electricity",
    benchmark: "Weighted world avg · residential",
    unit: "USD / MWh",
    unitShort: "$/MWh",
    basePrice: 174,
    cagr: 0.045,
    volatility: 0.22,
  },
];

/* ---------- Key drivers (research-backed) ---------- */
export const FACTORS: Factor[] = [
  {
    id: "opec",
    name: "OPEC+ Production Policy",
    category: "Supply",
    appliesTo: "oil",
    direction: "both",
    magnitude: 0.8,
    explanation:
      "OPEC+ members control roughly 40% of global crude supply. Quota cuts or unwind decisions move Brent within days, while spare capacity acts as a price ceiling during shocks.",
    source: "OPEC monthly reports · EIA STEO",
    relevance: { short: 0.9, mid: 0.75, long: 0.6 },
    drift: { oil: 0.012, electricity: 0.004 },
  },
  {
    id: "geopolitics",
    name: "Geopolitical Risk & Conflict",
    category: "Supply",
    appliesTo: "both",
    direction: "up",
    magnitude: 0.8,
    explanation:
      "Wars, sanctions and shipping disruption embed a risk premium in energy prices. Brent swung through a $55–$120 range over the past year as Middle East tensions flared and eased.",
    source: "EIA · IEA Oil Market Report",
    relevance: { short: 0.85, mid: 0.8, long: 0.65 },
    drift: { oil: 0.018, electricity: 0.01 },
  },
  {
    id: "demand-em",
    name: "China & India Demand Growth",
    category: "Demand",
    appliesTo: "both",
    direction: "up",
    magnitude: 0.8,
    explanation:
      "The two giants drive most incremental oil and power demand worldwide. Chinese industrial activity and India's electrification push set the marginal consumption trend for the next decade.",
    source: "IEA World Energy Outlook · IEEFA",
    relevance: { short: 0.8, mid: 0.9, long: 0.95 },
    drift: { oil: 0.015, electricity: 0.013 },
  },
  {
    id: "renewables",
    name: "Renewable Build-out & Storage",
    category: "Technology",
    appliesTo: "electricity",
    direction: "down",
    magnitude: 0.8,
    explanation:
      "Solar and wind are the cheapest new generation in most markets, and battery storage is flattening peak prices. Each year of build-out shaves the marginal cost of power.",
    source: "IRENA · BloombergNEF",
    relevance: { short: 0.5, mid: 0.75, long: 0.95 },
    drift: { oil: -0.004, electricity: -0.016 },
  },
  {
    id: "fuel-costs",
    name: "Gas & Coal Costs",
    category: "Supply",
    appliesTo: "electricity",
    direction: "up",
    magnitude: 0.5,
    explanation:
      "Fossil fuels still generate most global electricity. LNG and coal prices set the marginal cost in many regions and transmit oil-market shocks straight into power bills.",
    source: "IEA · GlobalPetrolPrices",
    relevance: { short: 0.8, mid: 0.65, long: 0.5 },
    drift: { oil: 0.006, electricity: 0.012 },
  },
  {
    id: "weather",
    name: "Weather & Climate Extremes",
    category: "Demand",
    appliesTo: "both",
    direction: "up",
    magnitude: 0.5,
    explanation:
      "Heatwaves and cold snaps spike heating and cooling demand; droughts cut hydro output. Climate volatility is turning weather from noise into a structural price driver.",
    source: "NOAA · Copernicus Climate Service",
    relevance: { short: 0.7, mid: 0.7, long: 0.75 },
    drift: { oil: 0.005, electricity: 0.008 },
  },
  {
    id: "macro",
    name: "Global Growth & Recession Risk",
    category: "Macro",
    appliesTo: "both",
    direction: "both",
    magnitude: 0.8,
    explanation:
      "Energy demand is highly cyclical. A soft landing supports prices; a hard landing or China slowdown would erase demand growth and pressure both crude and power markets.",
    source: "IMF World Economic Outlook · World Bank",
    relevance: { short: 0.85, mid: 0.7, long: 0.55 },
    drift: { oil: -0.006, electricity: -0.002 },
  },
  {
    id: "policy",
    name: "Carbon Policy & Subsidies",
    category: "Policy",
    appliesTo: "both",
    direction: "both",
    magnitude: 0.5,
    explanation:
      "Carbon pricing, coal retirements and clean-energy subsidies widen the cost gap between fossil and clean power — while raising near-term tariffs through energy levies.",
    source: "IEA · EU ETS filings",
    relevance: { short: 0.5, mid: 0.7, long: 0.9 },
    drift: { oil: -0.008, electricity: 0.006 },
  },
  {
    id: "ev",
    name: "Transport Electrification",
    category: "Technology",
    appliesTo: "oil",
    direction: "down",
    magnitude: 0.5,
    explanation:
      "EVs already displace millions of barrels of daily oil demand, and efficiency standards cap demand growth. The effect compounds as the global vehicle fleet turns over.",
    source: "BloombergNEF EV Outlook · IEA",
    relevance: { short: 0.45, mid: 0.65, long: 0.9 },
    drift: { oil: -0.012, electricity: 0.003 },
  },
  {
    id: "usd",
    name: "US Dollar Strength",
    category: "Macro",
    appliesTo: "oil",
    direction: "both",
    magnitude: 0.25,
    explanation:
      "Oil is priced in dollars, so a weaker greenback supports crude and emerging-market demand. Fed easing cycles have historically correlated with higher commodity prices.",
    source: "Federal Reserve · EIA",
    relevance: { short: 0.7, mid: 0.6, long: 0.5 },
    drift: { oil: -0.003, electricity: 0 },
  },
];

/* ---------- Helpers ---------- */

export const relevanceAt = (f: Factor, year: number): number =>
  year <= 3 ? f.relevance.short : year <= 6 ? f.relevance.mid : f.relevance.long;

export const relevanceForHorizon = (f: Factor, horizon: number): number =>
  relevanceAt(f, Math.max(1, Math.min(horizon, MAX_HORIZON)));

export const factorTrend = (f: Factor): Trend =>
  f.relevance.long >= f.relevance.short + 0.15
    ? "rising"
    : f.relevance.long <= f.relevance.short - 0.15
      ? "fading"
      : "stable";

export const horizonBucket = (h: number): "short" | "mid" | "long" =>
  h <= 3 ? "short" : h <= 6 ? "mid" : "long";

export const magnitudeLabel = (m: number): string =>
  m >= 0.7 ? "High" : m >= 0.4 ? "Medium" : "Low";

/* ---------- Seed (perturbation) ---------- */

const rand = (amp: number) => (Math.random() * 2 - 1) * amp;

export function zeroSeed(): ModelSeed {
  return {
    base: { oil: 0, electricity: 0 },
    cagr: { oil: 0, electricity: 0 },
    drift: Object.fromEntries(FACTORS.map((f) => [f.id, 0])),
  };
}

/** A random, realistic perturbation — used by "Refresh data" */
export function randomSeed(): ModelSeed {
  return {
    base: { oil: rand(0.035), electricity: rand(0.03) },
    cagr: { oil: rand(0.004), electricity: rand(0.004) },
    drift: Object.fromEntries(FACTORS.map((f) => [f.id, rand(0.3)])),
  };
}

/** A tiny nudge for the 5-second "live" ticker (absolute, non-compounding) */
export function liveNudge(): ModelSeed {
  return {
    base: { oil: rand(0.0035), electricity: rand(0.003) },
    cagr: { oil: 0, electricity: 0 },
    drift: Object.fromEntries(FACTORS.map((f) => [f.id, 0])),
  };
}

/* ---------- Model ---------- */

export function computeScenario(
  cfg: CommodityConfig,
  year: number,
  seed: ModelSeed,
  live: ModelSeed,
): ScenarioPoint {
  const basePert = 1 + seed.base[cfg.id] + live.base[cfg.id];
  const base = cfg.basePrice * basePert;
  const cagr = cfg.cagr + seed.cagr[cfg.id];
  const trend = base * Math.pow(1 + cagr, year);

  let driftAdj = 0;
  for (const f of FACTORS) {
    if (f.appliesTo !== "both" && f.appliesTo !== cfg.id) continue;
    const d = f.drift[cfg.id] * (1 + (seed.drift[f.id] ?? 0));
    driftAdj += d * relevanceAt(f, year) * (year / 10);
  }

  const avg = trend * (1 + driftAdj);
  if (year === 0) return { avg, min: avg, max: avg };

  const cone = cfg.volatility * Math.sqrt(year) * BAND_SCALE;
  return {
    avg,
    min: avg * (1 - cone * 0.95),
    max: avg * (1 + cone * 1.05),
  };
}

export function buildForecast(
  horizon: number,
  seed: ModelSeed,
  live: ModelSeed,
): ForecastRow[] {
  const oilCfg = COMMODITIES[0];
  const eleCfg = COMMODITIES[1];
  const rows: ForecastRow[] = [];
  for (let y = 0; y <= Math.min(horizon, MAX_HORIZON); y++) {
    rows.push({
      year: START_YEAR + y,
      oil: computeScenario(oilCfg, y, seed, live),
      electricity: computeScenario(eleCfg, y, seed, live),
    });
  }
  return rows;
}

/* ---------- Formatting ---------- */

export const fmtMoney = (v: number, digits = 0) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(v);

export const fmtPct = (v: number, digits = 1) => `${v >= 0 ? "+" : ""}${(v * 100).toFixed(digits)}%`;

export const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

export const fmtTime = (d: Date) =>
  d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

/* ---------- Export: CSV ---------- */

export function forecastToCsv(rows: ForecastRow[]): string {
  const header =
    "Year,Oil - Average (USD/bbl),Oil - Low scenario (USD/bbl),Oil - High scenario (USD/bbl)," +
    "Electricity - Average (USD/MWh),Electricity - Low scenario (USD/MWh),Electricity - High scenario (USD/MWh)";
  const body = rows
    .map((r) =>
      [
        r.year,
        r.oil.avg.toFixed(1),
        r.oil.min.toFixed(1),
        r.oil.max.toFixed(1),
        r.electricity.avg.toFixed(0),
        r.electricity.min.toFixed(0),
        r.electricity.max.toFixed(0),
      ].join(","),
    )
    .join("\n");
  return `${header}\n${body}`;
}

export function downloadTextFile(content: string, filename: string, type = "text/csv") {
  const blob = new Blob([content], { type: `${type};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ---------- Export: PNG (SVG chart -> canvas) ---------- */

export async function exportChartAsPng(
  container: HTMLElement,
  filename: string,
  title: string,
  subtitle: string,
): Promise<void> {
  const svg = container.querySelector("svg");
  if (!svg) return;

  const rect = svg.getBoundingClientRect();
  const scale = 2;
  const w = Math.max(640, Math.round(rect.width));
  const h = Math.max(320, Math.round(rect.height));

  const clone = svg.cloneNode(true) as SVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", String(w * scale));
  clone.setAttribute("height", String(h * scale));
  const styleEl = document.createElementNS("http://www.w3.org/2000/svg", "style");
  styleEl.textContent =
    'text{font-family:Inter,system-ui,sans-serif;} .recharts-text{font-family:Inter,system-ui,sans-serif;}';
  clone.insertBefore(styleEl, clone.firstChild);

  const serialized = new XMLSerializer().serializeToString(clone);
  const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(serialized)}`;

  await document.fonts.ready.catch(() => undefined);

  await new Promise<void>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const headerH = 96;
      const footerH = 36;
      const canvas = document.createElement("canvas");
      canvas.width = w * scale;
      canvas.height = (h + headerH + footerH) * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("no ctx"));
        return;
      }
      ctx.scale(scale, scale);
      ctx.fillStyle = "#060a13";
      ctx.fillRect(0, 0, w, h + headerH + footerH);

      ctx.fillStyle = "#f1f5f9";
      ctx.font = "600 19px Inter, system-ui, sans-serif";
      ctx.fillText(title, 24, 38);
      ctx.fillStyle = "#8fa3bd";
      ctx.font = "500 12px Inter, system-ui, sans-serif";
      ctx.fillText(subtitle, 24, 62);

      ctx.strokeStyle = "rgba(148,163,184,0.16)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(24, 80);
      ctx.lineTo(w - 24, 80);
      ctx.stroke();

      ctx.drawImage(img, 0, headerH, w, h);

      ctx.fillStyle = "#5b6b87";
      ctx.font = "500 10.5px Inter, system-ui, sans-serif";
      ctx.fillText(
        "TecnoIndicator · illustrative model based on historical trends and publicly known drivers — not financial advice",
        24,
        h + headerH + 22,
      );

      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("no blob"));
          return;
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        resolve();
      }, "image/png");
    };
    img.onerror = () => reject(new Error("svg render failed"));
    img.src = svgUrl;
  });
}
