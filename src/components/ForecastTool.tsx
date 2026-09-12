import { useEffect, useRef, useState } from "react";
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  Filler,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";
import type { ChartConfiguration, ChartDataset, TooltipItem } from "chart.js";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  ChevronRight,
  Droplets,
  FileText,
  Fuel,
  Image as ImageIcon,
  Info,
  Loader2,
  RefreshCw,
  Waves,
  Zap,
} from "lucide-react";
import Reveal from "./Reveal";
import {
  buildCSV,
  COMMODITIES,
  downloadFile,
  fmtTime,
  fmtUsd,
  hexToRgba,
  START_YEAR,
  type Commodity,
  type CommodityId,
  type ForecastPoint,
  type LiveWaterQuote,
} from "../lib/model";
import { EVENTS } from "../lib/events";

Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  Filler,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
);

type ChartKind = "line" | "bar";

const ICONS: Record<CommodityId, typeof Fuel> = {
  oil: Fuel,
  electricity: Zap,
  water: Droplets,
};

const AXIS: Record<CommodityId, string> = {
  oil: "yOil",
  electricity: "yElec",
  water: "yWater",
};

const QUICK_HORIZONS = [1, 3, 5, 7, 10];

type FancyDataset = ChartDataset<ChartKind, number[]> & {
  unit?: string;
  decimals?: number;
};

function buildDatasets(points: ForecastPoint[], type: ChartKind, bands: boolean): FancyDataset[] {
  const datasets: FancyDataset[] = [];
  for (const c of COMMODITIES) {
    datasets.push({
      label: `${c.short} avg`,
      data: points.map((p) => p[c.id].avg),
      borderColor: c.color,
      backgroundColor: type === "bar" ? hexToRgba(c.color, 0.72) : c.color,
      yAxisID: AXIS[c.id],
      unit: c.unit,
      decimals: c.decimals,
      order: 1,
      ...(type === "line"
        ? {
            type: "line" as const,
            borderWidth: 2.5,
            pointRadius: 3,
            pointHoverRadius: 6,
            pointBackgroundColor: c.color,
            tension: 0.35,
            fill: false,
          }
        : { type: "bar" as const, borderRadius: 5, borderWidth: 0, maxBarThickness: 26 }),
    });

    if (type === "line" && bands) {
      for (const key of ["min", "max"] as const) {
        datasets.push({
          label: `${c.short} ${key}`,
          data: points.map((p) => p[c.id][key]),
          borderColor: hexToRgba(c.color, 0.42),
          backgroundColor: "transparent",
          yAxisID: AXIS[c.id],
          unit: c.unit,
          decimals: c.decimals,
          order: 3,
          type: "line",
          borderWidth: 1.5,
          borderDash: [6, 6],
          pointRadius: 0,
          pointHoverRadius: 4,
          tension: 0.35,
          fill: false,
        });
      }
    }
  }
  return datasets;
}

function axisRange(points: ForecastPoint[], id: CommodityId) {
  const vals = points.flatMap((p) => [p[id].min, p[id].max]);
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  const pad = (hi - lo) * 0.14 || 1;
  return { min: Math.max(0, lo - pad), max: hi + pad };
}

function buildConfig(
  type: ChartKind,
  points: ForecastPoint[],
  bands: boolean,
): ChartConfiguration<ChartKind, number[], string> {
  const axisOpts = (id: CommodityId, title: string, color: string) => ({
    position: (id === "oil" ? "left" : "right") as "left" | "right",
    weight: id === "water" ? 2 : 1,
    border: { display: false },
    grid: {
      color: id === "oil" ? "rgba(148,163,184,0.07)" : "transparent",
      drawOnChartArea: id === "oil",
    },
    ticks: {
      color: hexToRgba(color, 0.8),
      font: { family: "Inter", size: 10 },
      maxTicksLimit: 6,
    },
    title: {
      display: true,
      text: title,
      color: hexToRgba(color, 0.55),
      font: { family: "Inter", size: 10, weight: 600 as const },
    },
    ...axisRange(points, id),
  });

  return {
    type,
    data: {
      labels: points.map((p) => p.label),
      datasets: buildDatasets(points, type, bands) as ChartDataset<ChartKind, number[]>[],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 650, easing: "easeOutQuart" },
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: "rgba(219,228,240,0.75)",
            boxWidth: 12,
            boxHeight: 12,
            usePointStyle: true,
            pointStyle: "circle",
            padding: 16,
            font: { family: "Inter", size: 11 },
          },
        },
        tooltip: {
          backgroundColor: "rgba(10,17,34,0.95)",
          borderColor: "#1b2740",
          borderWidth: 1,
          titleColor: "#f1f5f9",
          bodyColor: "#dbe4f0",
          padding: 12,
          cornerRadius: 10,
          titleFont: { family: "Space Grotesk", size: 13, weight: 600 as const },
          bodyFont: { family: "Inter", size: 12 },
          callbacks: {
            label: (ctx: TooltipItem<ChartKind>) => {
              const ds = ctx.dataset as FancyDataset;
              const parsed = ctx.parsed as { y?: number } | number;
              const v = typeof parsed === "object" ? (parsed.y ?? 0) : parsed;
              const decimals = ds.decimals ?? 2;
              return ` ${ds.label}: ${fmtUsd(Number(v), decimals)} / ${ds.unit?.replace("USD/", "") ?? ""}`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { color: "rgba(148,163,184,0.06)" },
          border: { color: "#1b2740" },
          ticks: { color: "rgba(219,228,240,0.6)", font: { family: "Inter", size: 11 } },
        },
        yOil: axisOpts("oil", "Oil $/bbl", "#f5b840"),
        yElec: axisOpts("electricity", "Power $/MWh", "#2dd4bf"),
        yWater: axisOpts("water", "Water $/m³", "#38bdf8"),
      },
    },
  } as unknown as ChartConfiguration<ChartKind, number[], string>;
}

/* ------------------------------------------------------------------ */

interface CommodityCardProps {
  commodity: Commodity;
  today: ForecastPoint;
  horizonBand: ForecastPoint;
  live: LiveWaterQuote | null;
  fetching: boolean;
  onFetchWater: () => void;
}

function CommodityCard({ commodity, today, horizonBand, live, fetching, onFetchWater }: CommodityCardProps) {
  const Icon = ICONS[commodity.id];
  const band = horizonBand[commodity.id];
  const todayBand = today[commodity.id];
  const delta = band.avg - todayBand.avg;
  const deltaPct = (delta / todayBand.avg) * 100;
  const up = delta >= 0;
  const isWater = commodity.id === "water";

  return (
    <article className="group relative flex h-full flex-col rounded-2xl border border-line bg-panel p-6 transition-all duration-300 hover:-translate-y-1 hover:border-line-strong hover:shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
      <div
        className="pointer-events-none absolute inset-x-6 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${commodity.color}66, transparent)` }}
        aria-hidden="true"
      />
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-xl border"
            style={{
              backgroundColor: `${commodity.color}12`,
              borderColor: `${commodity.color}33`,
              color: commodity.color,
            }}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h3 className="font-display text-base font-semibold text-white">{commodity.name}</h3>
            <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{commodity.unit}</p>
          </div>
        </div>
        {isWater && live && (
          <span className="flex items-center gap-1.5 rounded-full border border-teal-400/25 bg-teal-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-teal-300">
            <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-teal-300" aria-hidden="true" />
            Live
          </span>
        )}
      </div>

      <p className="mt-6 font-display text-[2.6rem] font-bold leading-none tabular-nums text-white">
        {fmtUsd(band.avg, commodity.decimals)}
      </p>
      <p className="mt-2 text-xs text-slate-500">
        Average forecast · {horizonBand.year}
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-line bg-white/[0.02] px-3.5 py-3">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-400">
            <ArrowDownRight className="h-3.5 w-3.5" aria-hidden="true" /> Low
          </p>
          <p className="mt-1 font-display text-lg font-bold tabular-nums text-slate-100">
            {fmtUsd(band.min, commodity.decimals)}
          </p>
        </div>
        <div className="rounded-xl border border-line bg-white/[0.02] px-3.5 py-3">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-rose-400">
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" /> High
          </p>
          <p className="mt-1 font-display text-lg font-bold tabular-nums text-slate-100">
            {fmtUsd(band.max, commodity.decimals)}
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums ${
            up ? "bg-rose-400/10 text-rose-300" : "bg-emerald-400/10 text-emerald-300"
          }`}
        >
          {up ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
          {up ? "+" : "−"}
          {Math.abs(deltaPct).toFixed(1)}% vs today
        </span>
        <span className="text-[11px] text-slate-500">±{commodity.maxVol * 100}% vol @10y</span>
      </div>

      {isWater && (
        <div className="mt-4">
          <button
            type="button"
            onClick={onFetchWater}
            disabled={fetching}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-water/30 bg-water/10 px-4 py-2.5 text-sm font-semibold text-sky-200 transition-all duration-200 hover:border-water/60 hover:bg-water/15 disabled:opacity-60"
          >
            {fetching ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Waves className="h-4 w-4" aria-hidden="true" />
            )}
            {fetching ? "Fetching live quote…" : live ? "Re-fetch Live Water Price" : "Fetch Live Water Price"}
          </button>
          {live && (
            <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
              <span className="font-semibold text-sky-300">{fmtUsd(live.price, 2)}/m³</span> · {live.asOf} ·{" "}
              {live.source} · {live.range}
            </p>
          )}
        </div>
      )}
    </article>
  );
}

/* ------------------------------------------------------------------ */

interface ForecastToolProps {
  horizon: number;
  onHorizon: (h: number) => void;
  prices: Record<CommodityId, number>;
  points: ForecastPoint[];
  lastUpdated: Date;
  onRefresh: () => void;
  onFetchWater: () => void;
  waterFetching: boolean;
  waterLive: LiveWaterQuote | null;
}

export default function ForecastTool({
  horizon,
  onHorizon,
  prices,
  points,
  lastUpdated,
  onRefresh,
  onFetchWater,
  waterFetching,
  waterLive,
}: ForecastToolProps) {
  const [chartType, setChartType] = useState<ChartKind>("line");
  const [showBands, setShowBands] = useState(true);
  const [assumptionsOpen, setAssumptionsOpen] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [spin, setSpin] = useState(false);
  const [exportFlash, setExportFlash] = useState(false);
  const [announce, setAnnounce] = useState("");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);
  const sliderRef = useRef<HTMLInputElement | null>(null);

  const today = points[0];
  const horizonBand = points[points.length - 1];

  /* ticking clock for the live feel */
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  /* chart lifecycle — recreated when the chart type changes */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    chartRef.current?.destroy();
    chartRef.current = null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    chartRef.current = new Chart(ctx, buildConfig(chartType, points, showBands));
    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartType]);

  /* data refresh — patch the existing chart */
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    chart.data.labels = points.map((p) => p.label);
    chart.data.datasets = buildDatasets(points, chartType, showBands);
    chart.update();
  }, [points, chartType, showBands]);

  /* screen-reader announcements */
  useEffect(() => {
    setAnnounce(`Forecast updated for a ${horizon}-year horizon at ${fmtTime(new Date())}.`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points]);

  /* export actions from the navbar */
  useEffect(() => {
    const onPng = () => {
      const chart = chartRef.current;
      if (!chart) return;
      const url = chart.toBase64Image("image/png", 1);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tecnoindicator-forecast-${horizon}y.png`;
      a.click();
      setExportFlash(true);
      window.setTimeout(() => setExportFlash(false), 1800);
    };
    const onCsv = () =>
      downloadFile(
        `tecnoindicator-forecast-${horizon}y.csv`,
        buildCSV(points),
        "text/csv;charset=utf-8",
      );
    window.addEventListener(EVENTS.EXPORT_PNG, onPng);
    window.addEventListener(EVENTS.EXPORT_CSV, onCsv);
    return () => {
      window.removeEventListener(EVENTS.EXPORT_PNG, onPng);
      window.removeEventListener(EVENTS.EXPORT_CSV, onCsv);
    };
  }, [points, horizon]);

  /* keyboard shortcut: "/" focuses the horizon slider */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/") return;
      const tag = (document.activeElement?.tagName ?? "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select" || tag === "button") return;
      e.preventDefault();
      document.getElementById("forecast")?.scrollIntoView({ behavior: "smooth" });
      window.setTimeout(() => sliderRef.current?.focus(), 450);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleRefresh = () => {
    setSpin(true);
    onRefresh();
    window.setTimeout(() => setSpin(false), 750);
  };

  const exportPng = () => {
    const chart = chartRef.current;
    if (!chart) return;
    const url = chart.toBase64Image("image/png", 1);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tecnoindicator-forecast-${horizon}y.png`;
    a.click();
    setExportFlash(true);
    window.setTimeout(() => setExportFlash(false), 1800);
  };

  const exportCsv = () =>
    downloadFile(
      `tecnoindicator-forecast-${horizon}y.csv`,
      buildCSV(points),
      "text/csv;charset=utf-8",
    );

  const fillPct = ((horizon - 1) / 9) * 100;

  return (
    <section id="forecast" className="relative scroll-mt-24 py-20 sm:py-28">
      <div
        className="pointer-events-none absolute left-[-180px] top-24 h-[420px] w-[420px] glow-teal blur-3xl opacity-40"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        {/* heading */}
        <Reveal>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-teal-300">
            Forecast studio
          </p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-6">
            <h2 className="max-w-2xl font-display text-3xl font-bold tracking-tight text-white sm:text-5xl">
              Interactive price forecasts
            </h2>
            {/* live bar */}
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="flex items-center gap-2 rounded-full border border-line bg-white/[0.03] px-3.5 py-2 text-xs text-slate-300">
                <span className="relative flex h-2 w-2">
                  <span className="ping-ring absolute inline-flex h-full w-full rounded-full bg-teal-400" aria-hidden="true" />
                  <span className="pulse-dot relative inline-flex h-2 w-2 rounded-full bg-teal-300" aria-hidden="true" />
                </span>
                <span className="font-semibold text-slate-200">Live</span>
                <span className="tabular-nums text-slate-500">{fmtTime(now)}</span>
              </span>
              <button
                type="button"
                onClick={handleRefresh}
                className={`flex items-center gap-2 rounded-full border border-line bg-white/[0.03] px-4 py-2 text-xs font-semibold text-slate-200 transition-all duration-200 hover:border-teal-400/40 hover:text-teal-200 ${
                  spin ? "spin-once" : ""
                }`}
                aria-label="Refresh data — randomly perturbs current prices within realistic ranges"
              >
                <RefreshCw className="h-3.5 w-3.5 text-teal-300" aria-hidden="true" />
                Refresh data
              </button>
              <button
                type="button"
                onClick={onFetchWater}
                disabled={waterFetching}
                className="flex items-center gap-2 rounded-full border border-water/35 bg-water/10 px-4 py-2 text-xs font-semibold text-sky-200 transition-all duration-200 hover:border-water/60 hover:bg-water/15 disabled:opacity-60"
                aria-label="Fetch live global water price from simulated market feed"
              >
                {waterFetching ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <Waves className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                {waterFetching ? "Fetching…" : "Fetch live water price"}
              </button>
            </div>
          </div>
        </Reveal>

        {/* horizon control */}
        <Reveal delay={80}>
          <div className="mt-10 rounded-2xl border border-line bg-panel p-6 sm:p-7">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Forecast horizon
                </p>
                <p className="mt-1.5 font-display text-xl font-bold text-white">
                  <span className="text-teal-300 tabular-nums">{horizon}</span>{" "}
                  {horizon === 1 ? "year" : "years"}
                  <span className="ml-2 text-sm font-medium text-slate-500">
                    · {START_YEAR} → {START_YEAR + horizon}
                  </span>
                </p>
              </div>
              <p className="hidden text-xs text-slate-500 sm:block">
                Press <kbd className="rounded-md border border-line bg-white/[0.04] px-1.5 py-0.5 font-mono text-[11px] text-slate-300">/</kbd> to
                focus the slider
              </p>
            </div>

            <div className="mt-6">
              <input
                ref={sliderRef}
                type="range"
                min={1}
                max={10}
                step={1}
                value={horizon}
                onChange={(e) => onHorizon(Number(e.target.value))}
                className="slider"
                style={{ ["--fill" as string]: `${fillPct}%` }}
                aria-label="Forecast horizon in years"
                aria-valuetext={`${horizon} years, ${START_YEAR} to ${START_YEAR + horizon}`}
              />
              <div className="mt-2 flex justify-between text-[10px] font-semibold tabular-nums text-slate-600">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => onHorizon(y)}
                    aria-label={`Set horizon to ${y} years`}
                    className={`transition-colors ${
                      y === horizon ? "text-teal-300" : "hover:text-slate-300"
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {QUICK_HORIZONS.map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => onHorizon(y)}
                  aria-pressed={horizon === y}
                  className={`rounded-lg border px-4 py-1.5 text-xs font-semibold transition-all duration-200 ${
                    horizon === y
                      ? "border-teal-400/50 bg-teal-400/15 text-teal-200"
                      : "border-line bg-white/[0.02] text-slate-400 hover:border-line-strong hover:text-slate-200"
                  }`}
                >
                  {y}y
                </button>
              ))}
            </div>
          </div>
        </Reveal>

        {/* commodity cards */}
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {COMMODITIES.map((c, i) => (
            <Reveal key={c.id} delay={110 + i * 80} className="h-full">
              <CommodityCard
                commodity={c}
                today={today}
                horizonBand={horizonBand}
                live={c.id === "water" ? waterLive : null}
                fetching={c.id === "water" && waterFetching}
                onFetchWater={onFetchWater}
              />
            </Reveal>
          ))}
        </div>

        {/* chart */}
        <Reveal delay={120}>
          <div className="mt-10 overflow-hidden rounded-2xl border border-line bg-panel">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-6 py-5 sm:px-7">
              <div>
                <h3 className="font-display text-lg font-semibold text-white">Price trajectories</h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  {chartType === "line" && showBands
                    ? "Solid lines = average · dashed = low/high scenario bands"
                    : chartType === "line"
                      ? "Average price path per commodity"
                      : "Average price per year per commodity"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                {/* chart type toggle */}
                <div className="flex rounded-lg border border-line bg-white/[0.03] p-0.5" role="group" aria-label="Chart type">
                  {(["line", "bar"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setChartType(t)}
                      aria-pressed={chartType === t}
                      className={`rounded-md px-3.5 py-1.5 text-xs font-semibold capitalize transition-all duration-200 ${
                        chartType === t
                          ? "bg-teal-400 text-slate-950 shadow-[0_0_16px_rgba(45,212,191,0.35)]"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                {/* bands toggle */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={showBands}
                  onClick={() => setShowBands((v) => !v)}
                  disabled={chartType === "bar"}
                  className="flex items-center gap-2 rounded-lg border border-line bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:border-line-strong disabled:opacity-40"
                >
                  <span
                    className={`relative h-4 w-7 rounded-full transition-colors duration-200 ${
                      showBands ? "bg-teal-400/80" : "bg-slate-600"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all duration-200 ${
                        showBands ? "left-3.5" : "left-0.5"
                      }`}
                      aria-hidden="true"
                    />
                  </span>
                  Bands
                </button>
                <button
                  type="button"
                  onClick={exportPng}
                  className={`flex items-center gap-2 rounded-lg border border-line bg-white/[0.03] px-3.5 py-2 text-xs font-semibold text-slate-200 transition-all duration-200 hover:border-oil/50 hover:text-oil ${
                    exportFlash ? "export-pulse" : ""
                  }`}
                  aria-label="Download chart as PNG"
                >
                  <ImageIcon className="h-3.5 w-3.5 text-oil" aria-hidden="true" />
                  PNG
                </button>
              </div>
            </div>
            <div className="h-[380px] p-5 sm:h-[440px] sm:p-7">
              <canvas
                ref={canvasRef}
                role="img"
                aria-label={`Line chart of yearly average, minimum and maximum price forecasts for oil, electricity and water from ${START_YEAR} to ${START_YEAR + horizon}`}
              />
            </div>
          </div>
        </Reveal>

        {/* table */}
        <Reveal delay={100}>
          <div className="mt-8 overflow-hidden rounded-2xl border border-line bg-panel">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-6 py-5 sm:px-7">
              <div>
                <h3 className="font-display text-lg font-semibold text-white">Forecast table</h3>
                <p className="mt-0.5 text-xs text-slate-500">Yearly average / low / high scenarios in USD</p>
              </div>
              <button
                type="button"
                onClick={exportCsv}
                className="flex items-center gap-2 rounded-lg border border-line bg-white/[0.03] px-3.5 py-2 text-xs font-semibold text-slate-200 transition-all duration-200 hover:border-water/50 hover:text-water"
                aria-label="Download forecast table as CSV"
              >
                <FileText className="h-3.5 w-3.5 text-water" aria-hidden="true" />
                CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-sm">
                <thead>
                  <tr className="border-b border-line bg-white/[0.025] text-left">
                    <th rowSpan={2} className="px-5 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 sm:px-7">
                      Year
                    </th>
                    <th colSpan={3} className="border-l border-line px-3 py-2 text-center text-xs font-bold uppercase tracking-[0.14em] text-oil">
                      Oil <span className="font-normal text-slate-500">USD/bbl</span>
                    </th>
                    <th colSpan={3} className="border-l border-line px-3 py-2 text-center text-xs font-bold uppercase tracking-[0.14em] text-elec">
                      Electricity <span className="font-normal text-slate-500">USD/MWh</span>
                    </th>
                    <th colSpan={3} className="border-l border-line px-3 py-2 text-center text-xs font-bold uppercase tracking-[0.14em] text-water">
                      Water <span className="font-normal text-slate-500">USD/m³</span>
                    </th>
                  </tr>
                  <tr className="border-b border-line text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                    {["Avg", "Low", "High", "Avg", "Low", "High", "Avg", "Low", "High"].map((h, i) => (
                      <th key={`${h}-${i}`} className="border-l border-line/60 px-3 py-2 text-center">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {points.map((p, idx) => (
                    <tr
                      key={p.year}
                      className={`border-b border-line/50 transition-colors last:border-0 hover:bg-white/[0.03] ${
                        idx === 0 ? "bg-teal-400/[0.04]" : ""
                      }`}
                    >
                      <td className="px-5 py-3 font-display font-semibold text-white sm:px-7">
                        {p.year}
                        {idx === 0 && (
                          <span className="ml-2 rounded-full border border-teal-400/30 bg-teal-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-teal-300">
                            Today
                          </span>
                        )}
                      </td>
                      <td className="border-l border-line/60 px-3 py-3 text-right font-semibold tabular-nums text-slate-100">{fmtUsd(p.oil.avg, 1)}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-emerald-400/90">{fmtUsd(p.oil.min, 1)}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-rose-400/90">{fmtUsd(p.oil.max, 1)}</td>
                      <td className="border-l border-line/60 px-3 py-3 text-right font-semibold tabular-nums text-slate-100">{fmtUsd(p.electricity.avg, 0)}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-emerald-400/90">{fmtUsd(p.electricity.min, 0)}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-rose-400/90">{fmtUsd(p.electricity.max, 0)}</td>
                      <td className="border-l border-line/60 px-3 py-3 text-right font-semibold tabular-nums text-slate-100">{fmtUsd(p.water.avg, 2)}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-emerald-400/90">{fmtUsd(p.water.min, 2)}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-rose-400/90">{fmtUsd(p.water.max, 2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>

        {/* assumptions */}
        <Reveal delay={80}>
          <div className="mt-8 overflow-hidden rounded-2xl border border-line bg-panel">
            <button
              type="button"
              onClick={() => setAssumptionsOpen((v) => !v)}
              aria-expanded={assumptionsOpen}
              className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-white/[0.02] sm:px-7"
            >
              <span className="flex items-center gap-3">
                <Info className="h-4.5 w-4.5 h-[18px] w-[18px] text-teal-300" aria-hidden="true" />
                <span className="font-display text-base font-semibold text-white">Show underlying assumptions</span>
              </span>
              <ChevronRight
                className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${assumptionsOpen ? "rotate-90" : ""}`}
                aria-hidden="true"
              />
            </button>
            <div
              className={`grid transition-all duration-500 ease-out ${
                assumptionsOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <div className="border-t border-line px-6 py-6 sm:px-7">
                  <p className="text-sm leading-relaxed text-slate-400">
                    Every forecast is generated entirely in your browser using a transparent three-part
                    model — a compounding base trend, horizon-scaled volatility bands, and small drift
                    adjustments from the key drivers listed in the Factors section.
                  </p>

                  <div className="mt-5 grid gap-4 lg:grid-cols-3">
                    <div className="rounded-xl border border-line bg-base/50 p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-oil">1 · Base trend</p>
                      <code className="mt-3 block whitespace-nowrap rounded-lg bg-black/40 px-3 py-2.5 font-mono text-[11px] text-slate-300">
                        avg(t) = base × (1+CAGR)^t
                      </code>
                      <p className="mt-3 text-xs leading-relaxed text-slate-500">
                        Compounds today's market price at a structural annual growth rate, with a small
                        cyclical sine term so paths are not perfectly straight lines.
                      </p>
                    </div>
                    <div className="rounded-xl border border-line bg-base/50 p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-elec">2 · Volatility bands</p>
                      <code className="mt-3 block whitespace-nowrap rounded-lg bg-black/40 px-3 py-2.5 font-mono text-[11px] text-slate-300">
                        band(t) = avg(t) × (1 ± σ·√(t/10))
                      </code>
                      <p className="mt-3 text-xs leading-relaxed text-slate-500">
                        Uncertainty widens with the square root of time — low/high scenarios stay tight
                        near today and fan out over the decade.
                      </p>
                    </div>
                    <div className="rounded-xl border border-line bg-base/50 p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-water">3 · Factor adjustments</p>
                      <code className="mt-3 block whitespace-nowrap rounded-lg bg-black/40 px-3 py-2.5 font-mono text-[11px] text-slate-300">
                        adj(t) = 1 + Σ driftᵢ × (t/10)
                      </code>
                      <p className="mt-3 text-xs leading-relaxed text-slate-500">
                        Each key driver contributes a small cumulative drift that ramps up over the
                        horizon, clamped to ±18%.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 overflow-x-auto rounded-xl border border-line">
                    <table className="w-full min-w-[640px] text-sm">
                      <thead>
                        <tr className="border-b border-line bg-white/[0.025] text-left">
                          <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Commodity</th>
                          <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Base (today)</th>
                          <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">CAGR</th>
                          <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">σ @ 10y</th>
                          <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Reference</th>
                        </tr>
                      </thead>
                      <tbody>
                        {COMMODITIES.map((c) => (
                          <tr key={c.id} className="border-b border-line/50 last:border-0">
                            <td className="px-4 py-3 font-semibold" style={{ color: c.color }}>{c.name}</td>
                            <td className="px-4 py-3 font-mono text-xs text-slate-200">{fmtUsd(prices[c.id], c.decimals)} / {c.unit.replace("USD/", "")}</td>
                            <td className="px-4 py-3 font-mono text-xs text-slate-200">+{(c.cagr * 100).toFixed(1)}%</td>
                            <td className="px-4 py-3 font-mono text-xs text-slate-200">±{(c.maxVol * 100).toFixed(0)}%</td>
                            <td className="px-4 py-3 text-xs text-slate-500">
                              {c.id === "oil" ? "EIA · ICE Brent" : c.id === "electricity" ? "GlobalPetrolPrices · IEA" : "UN-Water · GWI"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-4 text-[11px] leading-relaxed text-slate-600">
                    The Refresh action perturbs base prices within realistic intraday ranges (oil ±3%,
                    power ±2.5%, water ±4%). The live water quote is simulated client-side within the
                    plausible global band of roughly $2.00–$3.40/m³.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* disclaimer */}
        <Reveal delay={60}>
          <div className="mt-8 flex items-start gap-3.5 rounded-2xl border border-amber-400/20 bg-amber-400/[0.05] px-5 py-4 sm:px-6">
            <AlertTriangle className="mt-0.5 h-4.5 w-4.5 h-[18px] w-[18px] shrink-0 text-amber-400" aria-hidden="true" />
            <p className="text-sm leading-relaxed text-amber-200/80">
              <span className="font-semibold text-amber-200">Disclaimer.</span> These are illustrative
              forecasts based on historical trends and publicly known drivers. Not financial advice.
              Real commodity markets are influenced by many unpredictable factors, and actual prices
              may differ materially from any scenario shown here.
            </p>
          </div>
        </Reveal>

        <p className="sr-only" aria-live="polite">
          {announce}
        </p>
        <p className="sr-only">
          Last updated {fmtTime(lastUpdated)}. Model uses publicly available drivers.
        </p>
      </div>
    </section>
  );
}
