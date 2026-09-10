import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChevronDown,
  Download,
  Droplets,
  FileSpreadsheet,
  Image as ImageIcon,
  RefreshCw,
  ShieldAlert,
  Zap,
} from "lucide-react";
import { Reveal } from "./Reveal";
import {
  buildForecast,
  COMMODITIES,
  downloadTextFile,
  exportChartAsPng,
  FACTORS,
  fmtMoney,
  fmtPct,
  fmtTime,
  forecastToCsv,
  liveNudge,
  MAX_HORIZON,
  randomSeed,
  START_YEAR,
  zeroSeed,
  type CommodityConfig,
  type ForecastRow,
  type ModelSeed,
  type ScenarioPoint,
} from "../lib/forecast";

/* ------------------------------------------------------------------ */
/* Horizon control                                                     */
/* ------------------------------------------------------------------ */

const PRESETS = [1, 3, 5, 10];

const bucketLabel = (h: number) =>
  h <= 3 ? "Near-term outlook" : h <= 6 ? "Medium-term outlook" : "Long-term outlook";

function HorizonControl({
  horizon,
  setHorizon,
}: {
  horizon: number;
  setHorizon: (h: number) => void;
}) {
  const fillPct = ((horizon - 1) / (MAX_HORIZON - 1)) * 100;
  return (
    <div className="rounded-2xl border border-line bg-ink-850/80 p-6 backdrop-blur-sm sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Forecast horizon
          </p>
          <p className="mt-2 font-display text-4xl font-bold text-white tabular-nums sm:text-5xl">
            {horizon} <span className="text-xl font-semibold text-slate-400">years</span>
            <span className="ml-3 text-base font-medium text-teal-300 tabular-nums">
              → {START_YEAR + horizon}
            </span>
          </p>
          <p className="mt-1.5 text-sm text-slate-500">{bucketLabel(horizon)}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-2" role="group" aria-label="Preset horizons">
            {PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => setHorizon(p)}
                aria-pressed={horizon === p}
                className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition-all duration-200 ${
                  horizon === p
                    ? "bg-teal-400 text-ink-950 shadow-[0_0_16px_rgba(45,212,191,0.35)]"
                    : "border border-line bg-ink-800/70 text-slate-300 hover:border-teal-400/40 hover:text-white"
                }`}
              >
                {p}y
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-7">
        <input
          type="range"
          min={1}
          max={MAX_HORIZON}
          step={1}
          value={horizon}
          onChange={(e) => setHorizon(Number(e.target.value))}
          className="slider"
          aria-label="Forecast horizon in years"
          aria-valuetext={`${horizon} years, ending ${START_YEAR + horizon}`}
          style={{ ["--fill" as string]: `${fillPct}%` } as React.CSSProperties}
        />
        <div className="mt-2 flex justify-between text-[11px] font-medium text-slate-600 tabular-nums">
          {Array.from({ length: MAX_HORIZON }, (_, i) => (
            <span key={i} className={horizon === i + 1 ? "text-teal-300" : ""}>
              {i + 1}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Commodity card                                                      */
/* ------------------------------------------------------------------ */

const ACCENT = {
  oil: {
    text: "text-oil",
    border: "border-oil/25",
    bg: "bg-oil/10",
    dot: "bg-oil",
    bar: "from-oil/30 to-oil",
    glow: "hover:shadow-[0_20px_60px_rgba(245,184,64,0.10)]",
  },
  elec: {
    text: "text-elec",
    border: "border-teal-400/25",
    bg: "bg-teal-400/10",
    dot: "bg-elec",
    bar: "from-teal-400/30 to-teal-400",
    glow: "hover:shadow-[0_20px_60px_rgba(45,212,191,0.10)]",
  },
} as const;

function CommodityCard({
  cfg,
  current,
  projected,
  horizon,
  variant,
  delay,
}: {
  cfg: CommodityConfig;
  current: ScenarioPoint;
  projected: ScenarioPoint;
  horizon: number;
  variant: "oil" | "elec";
  delay: number;
}) {
  const a = ACCENT[variant];
  const digits = cfg.id === "oil" ? 1 : 0;
  const fmt = (v: number) => fmtMoney(v, digits);
  const delta = projected.avg / current.avg - 1;
  const spread = Math.max(projected.max - projected.min, 0.0001);
  const avgPct = ((projected.avg - projected.min) / spread) * 100;

  return (
    <Reveal delay={delay}>
      <article
        className={`group h-full rounded-2xl border border-line bg-ink-850/80 p-6 backdrop-blur-sm transition-all duration-300 hover:border-line-strong sm:p-7 ${a.glow}`}
      >
        <header className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <span
              className={`flex h-11 w-11 items-center justify-center rounded-xl border ${a.border} ${a.bg} ${a.text}`}
            >
              {cfg.id === "oil" ? <Droplets className="h-5 w-5" /> : <Zap className="h-5 w-5" />}
            </span>
            <div>
              <h3 className="font-display text-lg font-semibold text-white">{cfg.label}</h3>
              <p className="text-xs text-slate-500">{cfg.benchmark}</p>
            </div>
          </div>
          <span className="rounded-md border border-line bg-ink-800 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            {cfg.unit}
          </span>
        </header>

        <div className="mt-6 flex items-baseline gap-3">
          <p className="font-display text-4xl font-bold text-white tabular-nums sm:text-[2.75rem] sm:leading-none">
            {fmt(projected.avg)}
          </p>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums ${
              delta >= 0 ? "bg-emerald-400/10 text-emerald-300" : "bg-rose-400/10 text-rose-300"
            }`}
          >
            {fmtPct(delta)}
            <span className="font-normal text-slate-500">vs today</span>
          </span>
        </div>
        <p className="mt-1.5 text-xs text-slate-500">
          Average scenario in {START_YEAR + horizon} · current {fmt(current.avg)}
        </p>

        <div className="mt-6 grid grid-cols-3 gap-3">
          {[
            { label: "Low scenario", value: projected.min, strong: false },
            { label: "Average", value: projected.avg, strong: true },
            { label: "High scenario", value: projected.max, strong: false },
          ].map((s) => (
            <div
              key={s.label}
              className={`rounded-xl border px-3.5 py-3 ${
                s.strong ? "border-line-strong bg-ink-800" : "border-line bg-ink-800/50"
              }`}
            >
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                {s.label}
              </p>
              <p
                className={`mt-1 font-display text-base font-semibold tabular-nums ${
                  s.strong ? a.text : "text-slate-200"
                }`}
              >
                {fmt(s.value)}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <div className="relative h-1.5 rounded-full bg-ink-700">
            <div className={`absolute inset-0 rounded-full bg-gradient-to-r ${a.bar} opacity-40`} />
            <div
              className={`absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ink-950 ${a.dot} shadow-md transition-all duration-500`}
              style={{ left: `${avgPct}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-[10px] font-medium uppercase tracking-widest text-slate-600">
            <span>Low</span>
            <span>Scenario band</span>
            <span>High</span>
          </div>
        </div>
      </article>
    </Reveal>
  );
}

/* ------------------------------------------------------------------ */
/* Chart                                                               */
/* ------------------------------------------------------------------ */

type ChartSeries = "oil" | "electricity" | "both";

interface ChartPoint {
  year: number;
  oilAvg: number;
  oilMin: number;
  oilMax: number;
  elecAvg: number;
  elecMin: number;
  elecMax: number;
}

function buildChartData(rows: ForecastRow[]): ChartPoint[] {
  return rows.map((r) => ({
    year: r.year,
    oilAvg: +r.oil.avg.toFixed(2),
    oilMin: +r.oil.min.toFixed(2),
    oilMax: +r.oil.max.toFixed(2),
    elecAvg: +r.electricity.avg.toFixed(2),
    elecMin: +r.electricity.min.toFixed(2),
    elecMax: +r.electricity.max.toFixed(2),
  }));
}

function ChartTooltip({
  active,
  payload,
  label,
  series,
}: {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number; color: string; name: string }>;
  label?: number;
  series: ChartSeries;
}) {
  if (!active || !payload?.length) return null;
  const show = (key: string) => {
    if (series === "both") return true;
    if (series === "oil") return key.startsWith("oil");
    return key.startsWith("elec");
  };
  return (
    <div className="rounded-xl border border-line bg-ink-900/95 px-4 py-3 shadow-2xl backdrop-blur-md">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">{label}</p>
      <div className="mt-2 space-y-1.5">
        {payload.filter((p) => show(p.dataKey)).map((p) => (
          <div key={p.dataKey} className="flex items-center justify-between gap-6 text-sm">
            <span className="flex items-center gap-2 text-slate-400">
              <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
              {p.name}
            </span>
            <span className="font-semibold tabular-nums text-white">
              {fmtMoney(p.value, p.dataKey.startsWith("oil") ? 1 : 0)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ForecastChart({
  data,
  series,
  chartRef,
}: {
  data: ChartPoint[];
  series: ChartSeries;
  chartRef: React.RefObject<HTMLDivElement | null>;
}) {
  const showOil = series === "oil" || series === "both";
  const showElec = series === "electricity" || series === "both";

  return (
    <div ref={chartRef} className="h-[360px] w-full sm:h-[420px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 18, left: 4, bottom: 8 }}>
          <CartesianGrid stroke="rgba(148,163,184,0.08)" strokeDasharray="3 6" vertical={false} />
          <XAxis
            dataKey="year"
            tick={{ fill: "#64748b", fontSize: 12 }}
            axisLine={{ stroke: "rgba(148,163,184,0.12)" }}
            tickLine={false}
          />
          <YAxis
            yAxisId="left"
            tick={{ fill: "#64748b", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${v}`}
            width={56}
            hide={!showOil && showElec}
          />
          {showElec && showOil && (
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: "#64748b", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${v}`}
              width={56}
            />
          )}
          <Tooltip
            content={<ChartTooltip series={series} />}
            cursor={{ stroke: "rgba(148,163,184,0.25)", strokeDasharray: "4 4" }}
          />
          <ReferenceLine
            yAxisId="left"
            x={START_YEAR}
            stroke="rgba(148,163,184,0.25)"
            strokeDasharray="4 4"
          />

          {showOil && (
            <>
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="oilMax"
                name="Oil high"
                stroke="#f5b840"
                strokeWidth={1}
                strokeOpacity={0.35}
                strokeDasharray="4 4"
                dot={false}
                activeDot={false}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="oilMin"
                name="Oil low"
                stroke="#f5b840"
                strokeWidth={1}
                strokeOpacity={0.35}
                strokeDasharray="4 4"
                dot={false}
                activeDot={false}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="oilAvg"
                name="Oil average"
                stroke="#f5b840"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#f5b840", strokeWidth: 0 }}
                activeDot={{ r: 5, fill: "#f5b840", stroke: "#060a13", strokeWidth: 2 }}
              />
            </>
          )}

          {showElec && (
            <>
              <Line
                yAxisId={showOil ? "right" : "left"}
                type="monotone"
                dataKey="elecMax"
                name="Elec high"
                stroke="#2dd4bf"
                strokeWidth={1}
                strokeOpacity={0.35}
                strokeDasharray="4 4"
                dot={false}
                activeDot={false}
              />
              <Line
                yAxisId={showOil ? "right" : "left"}
                type="monotone"
                dataKey="elecMin"
                name="Elec low"
                stroke="#2dd4bf"
                strokeWidth={1}
                strokeOpacity={0.35}
                strokeDasharray="4 4"
                dot={false}
                activeDot={false}
              />
              <Line
                yAxisId={showOil ? "right" : "left"}
                type="monotone"
                dataKey="elecAvg"
                name="Elec average"
                stroke="#2dd4bf"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#2dd4bf", strokeWidth: 0 }}
                activeDot={{ r: 5, fill: "#2dd4bf", stroke: "#060a13", strokeWidth: 2 }}
              />
            </>
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Data table                                                          */
/* ------------------------------------------------------------------ */

function ForecastTable({ rows }: { rows: ForecastRow[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-line">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-line bg-ink-800/80 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
            <th className="px-4 py-3">Year</th>
            <th className="px-4 py-3 text-oil">Oil avg</th>
            <th className="px-4 py-3">Oil low</th>
            <th className="px-4 py-3">Oil high</th>
            <th className="px-4 py-3 text-elec">Elec avg</th>
            <th className="px-4 py-3">Elec low</th>
            <th className="px-4 py-3">Elec high</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={r.year}
              className={`border-b border-line/60 transition-colors hover:bg-white/[0.03] ${
                i === 0 ? "bg-teal-400/[0.04]" : ""
              }`}
            >
              <td className="px-4 py-3 font-semibold tabular-nums text-white">{r.year}</td>
              <td className="px-4 py-3 font-semibold tabular-nums text-oil">
                {fmtMoney(r.oil.avg, 1)}
              </td>
              <td className="px-4 py-3 tabular-nums text-slate-400">{fmtMoney(r.oil.min, 1)}</td>
              <td className="px-4 py-3 tabular-nums text-slate-400">{fmtMoney(r.oil.max, 1)}</td>
              <td className="px-4 py-3 font-semibold tabular-nums text-elec">
                {fmtMoney(r.electricity.avg, 0)}
              </td>
              <td className="px-4 py-3 tabular-nums text-slate-400">
                {fmtMoney(r.electricity.min, 0)}
              </td>
              <td className="px-4 py-3 tabular-nums text-slate-400">
                {fmtMoney(r.electricity.max, 0)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main tool                                                           */
/* ------------------------------------------------------------------ */

export function ForecastTool({
  horizon,
  setHorizon,
  exportPulse,
}: {
  horizon: number;
  setHorizon: (h: number) => void;
  exportPulse: number;
}) {
  const [seed, setSeed] = useState<ModelSeed>(() => zeroSeed());
  const [live, setLive] = useState<ModelSeed>(() => zeroSeed());
  const [series, setSeries] = useState<ChartSeries>("both");
  const [showTable, setShowTable] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(() => new Date());
  const [exporting, setExporting] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);
  const exportBarRef = useRef<HTMLDivElement>(null);

  // Live ticker every 5s
  useEffect(() => {
    const id = setInterval(() => setLive(liveNudge()), 5000);
    return () => clearInterval(id);
  }, []);

  // Pulse export bar when navbar/footer triggers export
  useEffect(() => {
    if (exportPulse === 0) return;
    const el = exportBarRef.current;
    if (!el) return;
    el.classList.remove("export-pulse");
    void el.offsetWidth;
    el.classList.add("export-pulse");
  }, [exportPulse]);

  const rows = useMemo(() => buildForecast(horizon, seed, live), [horizon, seed, live]);
  const chartData = useMemo(() => buildChartData(rows), [rows]);

  const current = rows[0];
  const projected = rows[rows.length - 1];

  const handleRefresh = useCallback(() => {
    setSpinning(true);
    setSeed(randomSeed());
    setLive(zeroSeed());
    setLastRefresh(new Date());
    setTimeout(() => setSpinning(false), 700);
  }, []);

  const handleCsv = useCallback(() => {
    const csv = forecastToCsv(rows);
    downloadTextFile(csv, `tecnoindicator-forecast-${START_YEAR}-${START_YEAR + horizon}.csv`);
  }, [rows, horizon]);

  const handlePng = useCallback(async () => {
    if (!chartRef.current) return;
    setExporting(true);
    try {
      await exportChartAsPng(
        chartRef.current,
        `tecnoindicator-chart-${START_YEAR}-${START_YEAR + horizon}.png`,
        "TecnoIndicator · Energy Price Forecast",
        `${series === "both" ? "Oil & Electricity" : series === "oil" ? "Brent Crude" : "Global Electricity"} · ${horizon}-year horizon · ${START_YEAR}–${START_YEAR + horizon}`,
      );
    } catch {
      /* ignore export errors */
    } finally {
      setExporting(false);
    }
  }, [horizon, series]);

  const topDrivers = useMemo(() => {
    return [...FACTORS]
      .map((f) => ({
        f,
        score:
          (f.relevance[horizon <= 3 ? "short" : horizon <= 6 ? "mid" : "long"] ?? 0) * f.magnitude,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [horizon]);

  return (
    <section id="forecast" className="relative scroll-mt-24 border-t border-line py-20 sm:py-28">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[480px] w-[480px] -translate-x-1/2 glow-teal" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-teal-300">
                Forecast Studio
              </p>
              <h2 className="balance mt-3 max-w-2xl font-display text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
                Interactive 10-year energy outlook
              </h2>
              <p className="mt-3 max-w-2xl text-slate-400">
                Adjust the horizon, refresh the seed, and export scenario bands for Brent crude and
                global electricity — all computed client-side.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleRefresh}
                className="inline-flex items-center gap-2 rounded-lg border border-line bg-ink-800/70 px-4 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:border-teal-400/40 hover:text-white"
              >
                <RefreshCw className={`h-4 w-4 ${spinning ? "spin-once" : ""}`} />
                Refresh data
              </button>
              <span className="text-[11px] text-slate-600">
                Last refresh · {fmtTime(lastRefresh)}
              </span>
            </div>
          </div>
        </Reveal>

        <div className="mt-10">
          <HorizonControl horizon={horizon} setHorizon={setHorizon} />
        </div>

        {/* Commodity cards */}
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <CommodityCard
            cfg={COMMODITIES[0]}
            current={current.oil}
            projected={projected.oil}
            horizon={horizon}
            variant="oil"
            delay={60}
          />
          <CommodityCard
            cfg={COMMODITIES[1]}
            current={current.electricity}
            projected={projected.electricity}
            horizon={horizon}
            variant="elec"
            delay={120}
          />
        </div>

        {/* Chart panel */}
        <Reveal delay={100}>
          <div className="mt-6 rounded-2xl border border-line bg-ink-850/80 p-5 backdrop-blur-sm sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-display text-lg font-semibold text-white">Scenario paths</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Average path with low / high volatility bands · dual-axis when both shown
                </p>
              </div>
              <div className="flex gap-2" role="group" aria-label="Chart series">
                {(
                  [
                    { id: "both", label: "Both" },
                    { id: "oil", label: "Oil" },
                    { id: "electricity", label: "Electricity" },
                  ] as const
                ).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSeries(s.id)}
                    aria-pressed={series === s.id}
                    className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition-all duration-200 ${
                      series === s.id
                        ? "bg-teal-400 text-ink-950"
                        : "border border-line bg-ink-800/70 text-slate-300 hover:border-teal-400/40 hover:text-white"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <ForecastChart data={chartData} series={series} chartRef={chartRef} />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-5 text-xs text-slate-500">
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-oil" /> Oil average
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-elec" /> Electricity average
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-0.5 w-4 border-t border-dashed border-slate-400" /> Band
                (low/high)
              </span>
            </div>
          </div>
        </Reveal>

        {/* Export + drivers row */}
        <div className="mt-6 grid gap-5 lg:grid-cols-[1.2fr_1fr]">
          <Reveal delay={80}>
            <div
              ref={exportBarRef}
              className="rounded-2xl border border-line bg-ink-850/80 p-6 backdrop-blur-sm"
            >
              <h3 className="font-display text-lg font-semibold text-white">Export</h3>
              <p className="mt-1 text-sm text-slate-500">
                Download the current scenario table or a chart snapshot.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  onClick={handleCsv}
                  className="inline-flex items-center gap-2 rounded-lg bg-teal-400 px-4 py-2.5 text-sm font-semibold text-ink-950 shadow-[0_0_20px_rgba(45,212,191,0.3)] transition-all hover:bg-teal-300"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Download CSV
                </button>
                <button
                  onClick={handlePng}
                  disabled={exporting}
                  className="inline-flex items-center gap-2 rounded-lg border border-line bg-ink-800/70 px-4 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:border-teal-400/40 hover:text-white disabled:opacity-60"
                >
                  <ImageIcon className="h-4 w-4" />
                  {exporting ? "Exporting…" : "Export PNG"}
                </button>
                <button
                  onClick={() => setShowTable((v) => !v)}
                  className="inline-flex items-center gap-2 rounded-lg border border-line bg-ink-800/70 px-4 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:border-teal-400/40 hover:text-white"
                >
                  <Download className="h-4 w-4" />
                  {showTable ? "Hide table" : "Show table"}
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${showTable ? "rotate-180" : ""}`}
                  />
                </button>
              </div>
              <p className="mt-4 inline-flex items-start gap-2 text-[12px] leading-relaxed text-slate-600">
                <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400/80" />
                Illustrative model — not financial advice. Bands widen with √time × commodity
                volatility.
              </p>
            </div>
          </Reveal>

          <Reveal delay={140}>
            <div className="h-full rounded-2xl border border-line bg-ink-850/80 p-6 backdrop-blur-sm">
              <h3 className="font-display text-lg font-semibold text-white">
                Top drivers · {horizon}y
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Highest relevance × magnitude at this horizon.
              </p>
              <ul className="mt-5 space-y-3">
                {topDrivers.map(({ f }, i) => (
                  <li
                    key={f.id}
                    className="flex items-start gap-3 rounded-xl border border-line bg-ink-800/50 px-3.5 py-3"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-400/10 text-xs font-bold text-teal-300">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">{f.name}</p>
                      <p className="mt-0.5 text-[11px] uppercase tracking-widest text-slate-500">
                        {f.category} · {f.direction === "up" ? "↑ pressure" : f.direction === "down" ? "↓ pressure" : "↔ both ways"}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>

        {showTable && (
          <div className="mt-6">
            <ForecastTable rows={rows} />
          </div>
        )}
      </div>
    </section>
  );
}
