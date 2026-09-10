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
  BAND_SCALE,
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
            <span className={`flex h-11 w-11 items-center justify-center rounded-xl border ${a.border} ${a.bg} ${a.text}`}>
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
            <div className={`absolute inset-0 rounded-full bg-gradient-to-r ${a.bar}`} />
            <div
              className={`absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ink-950 ${a.dot} shadow-md transition-all duration-500`}
              style={{ left: `${avgPct}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-[11px] font-medium text-slate-500 tabular-nums">
            <span>{fmt(projected.min)}</span>
            <span className="uppercase tracking-widest">scenario band</span>
            <span>{fmt(projected.max)}</span>
          </div>
        </div>
      </article>
    </Reveal>
  );
}

/* ------------------------------------------------------------------ */
/* Chart + tooltip                                                     */
/* ------------------------------------------------------------------ */

type View = "all" | "oil" | "electricity";

const VIEWS: { id: View; label: string }[] = [
  { id: "all", label: "All" },
  { id: "oil", label: "Oil" },
  { id: "electricity", label: "Electricity" },
];

function ChartTooltip({ active, payload, label, view }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  const showOil = view !== "electricity";
  const showElec = view !== "oil";
  return (
    <div className="rounded-xl border border-line-strong bg-ink-900/95 px-4 py-3 shadow-2xl backdrop-blur-md">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <div className="mt-2.5 space-y-2.5">
        {showOil && (
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold text-oil">
              <span className="h-2 w-2 rounded-full bg-oil" /> Brent crude · $/bbl
            </p>
            <p className="mt-1 flex gap-3 pl-4 text-xs tabular-nums text-slate-400">
              <span>
                <b className="font-semibold text-white">{fmtMoney(d.oilAvg, 1)}</b> avg
              </span>
              <span className="text-slate-500">
                {fmtMoney(d.oilMin, 1)} – {fmtMoney(d.oilMax, 1)}
              </span>
            </p>
          </div>
        )}
        {showElec && (
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold text-elec">
              <span className="h-2 w-2 rounded-full bg-elec" /> Electricity · $/MWh
            </p>
            <p className="mt-1 flex gap-3 pl-4 text-xs tabular-nums text-slate-400">
              <span>
                <b className="font-semibold text-white">{fmtMoney(d.elecAvg, 0)}</b> avg
              </span>
              <span className="text-slate-500">
                {fmtMoney(d.elecMin, 0)} – {fmtMoney(d.elecMax, 0)}
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function PriceChart({
  rows,
  view,
  setView,
  onExport,
  exporting,
  chartRef,
}: {
  rows: ForecastRow[];
  view: View;
  setView: (v: View) => void;
  onExport: () => void;
  exporting: boolean;
  chartRef: React.RefObject<HTMLDivElement | null>;
}) {
  const showOil = view !== "electricity";
  const showElec = view !== "oil";
  const data = useMemo(
    () =>
      rows.map((r) => ({
        year: r.year,
        oilAvg: +r.oil.avg.toFixed(1),
        oilMin: +r.oil.min.toFixed(1),
        oilMax: +r.oil.max.toFixed(1),
        elecAvg: Math.round(r.electricity.avg),
        elecMin: Math.round(r.electricity.min),
        elecMax: Math.round(r.electricity.max),
      })),
    [rows],
  );

  return (
    <div className="rounded-2xl border border-line bg-ink-850/80 p-6 backdrop-blur-sm sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-lg font-semibold text-white">Price paths · yearly</h3>
          <p className="mt-1 text-xs text-slate-500">
            Solid lines = average scenario · dashed = low / high bands
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-line bg-ink-800 p-1" role="group" aria-label="Chart series">
            {VIEWS.map((v) => (
              <button
                key={v.id}
                onClick={() => setView(v.id)}
                aria-pressed={view === v.id}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                  view === v.id ? "bg-teal-400 text-ink-950" : "text-slate-400 hover:text-white"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
          <button
            onClick={onExport}
            disabled={exporting}
            className="inline-flex items-center gap-2 rounded-lg border border-line bg-ink-800 px-3.5 py-2 text-xs font-semibold text-slate-200 transition-all duration-200 hover:border-teal-400/40 hover:text-white disabled:opacity-50"
            aria-label="Download chart as PNG"
          >
            <ImageIcon className="h-3.5 w-3.5 text-teal-300" />
            {exporting ? "Rendering…" : "PNG"}
          </button>
        </div>
      </div>

      <div ref={chartRef} className="mt-5" role="img" aria-label={`Oil and electricity price forecast chart from ${START_YEAR} to ${START_YEAR + rows.length - 1}`}>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} />
            <XAxis
              dataKey="year"
              tickLine={false}
              axisLine={{ stroke: "rgba(148,163,184,0.18)" }}
              tick={{ fill: "#5b6b87", fontSize: 11 }}
              minTickGap={24}
              tickMargin={10}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#5b6b87", fontSize: 11 }}
              tickFormatter={(v: number) => `$${v}`}
              width={52}
            />
            <Tooltip content={<ChartTooltip view={view} />} cursor={{ stroke: "rgba(148,163,184,0.25)", strokeDasharray: "4 4" }} />
            <ReferenceLine
              x={START_YEAR}
              stroke="rgba(148,163,184,0.3)"
              strokeDasharray="4 4"
              label={{ value: "Today", position: "top", fill: "#8fa3bd", fontSize: 10 }}
            />

            {showOil && (
              <>
                <Line type="monotone" dataKey="oilMax" stroke="#f5b840" strokeWidth={1.5} strokeDasharray="5 5" opacity={0.5} dot={false} activeDot={false} animationDuration={700} />
                <Line type="monotone" dataKey="oilMin" stroke="#f5b840" strokeWidth={1.5} strokeDasharray="5 5" opacity={0.5} dot={false} activeDot={false} animationDuration={700} />
                <Line
                  type="monotone"
                  dataKey="oilAvg"
                  stroke="#f5b840"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "#f5b840", strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: "#f5b840", stroke: "#060a13", strokeWidth: 2 }}
                  animationDuration={700}
                />
              </>
            )}
            {showElec && (
              <>
                <Line type="monotone" dataKey="elecMax" stroke="#2dd4bf" strokeWidth={1.5} strokeDasharray="5 5" opacity={0.5} dot={false} activeDot={false} animationDuration={700} />
                <Line type="monotone" dataKey="elecMin" stroke="#2dd4bf" strokeWidth={1.5} strokeDasharray="5 5" opacity={0.5} dot={false} activeDot={false} animationDuration={700} />
                <Line
                  type="monotone"
                  dataKey="elecAvg"
                  stroke="#2dd4bf"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "#2dd4bf", strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: "#2dd4bf", stroke: "#060a13", strokeWidth: 2 }}
                  animationDuration={700}
                />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Table                                                               */
/* ------------------------------------------------------------------ */

function ForecastTable({ rows, horizon }: { rows: ForecastRow[]; horizon: number }) {
  const endYear = START_YEAR + horizon;
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-ink-850/80 backdrop-blur-sm">
      <div className="max-h-[430px] overflow-auto">
        <table className="w-full min-w-[680px] border-collapse text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="bg-ink-850 text-left text-[10px] uppercase tracking-[0.16em] text-slate-500">
              <th rowSpan={2} className="border-b border-line px-5 py-3 font-semibold">
                Year
              </th>
              <th colSpan={3} className="border-b border-line px-3 py-3 text-center font-semibold text-oil">
                Brent crude · USD/bbl
              </th>
              <th colSpan={3} className="border-b border-line px-3 py-3 text-center font-semibold text-elec">
                Global electricity · USD/MWh
              </th>
            </tr>
            <tr className="bg-ink-850 text-[10px] uppercase tracking-widest text-slate-600">
              <th className="border-b border-line px-3 py-2.5 text-right font-medium">Low</th>
              <th className="border-b border-line px-3 py-2.5 text-right font-medium">Average</th>
              <th className="border-b border-line px-3 py-2.5 text-right font-medium">High</th>
              <th className="border-b border-line px-3 py-2.5 text-right font-medium">Low</th>
              <th className="border-b border-line px-3 py-2.5 text-right font-medium">Average</th>
              <th className="border-b border-line px-3 py-2.5 text-right font-medium">High</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const isEnd = r.year === endYear;
              const isToday = r.year === START_YEAR;
              return (
                <tr
                  key={r.year}
                  className={`transition-colors duration-200 hover:bg-white/[0.03] ${
                    isEnd ? "bg-teal-400/[0.07]" : isToday ? "bg-white/[0.02]" : ""
                  }`}
                >
                  <td className="border-b border-line/60 px-5 py-3 font-semibold text-slate-200 tabular-nums">
                    {r.year}
                    {isToday && (
                      <span className="ml-2 rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-slate-400">
                        Today
                      </span>
                    )}
                    {isEnd && (
                      <span className="ml-2 rounded bg-teal-400/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-teal-300">
                        Target
                      </span>
                    )}
                  </td>
                  <td className="border-b border-line/60 px-3 py-3 text-right tabular-nums text-slate-400">{fmtMoney(r.oil.min, 1)}</td>
                  <td className={`border-b border-line/60 px-3 py-3 text-right font-semibold tabular-nums ${isEnd ? "text-teal-300" : "text-white"}`}>{fmtMoney(r.oil.avg, 1)}</td>
                  <td className="border-b border-line/60 px-3 py-3 text-right tabular-nums text-slate-400">{fmtMoney(r.oil.max, 1)}</td>
                  <td className="border-b border-line/60 px-3 py-3 text-right tabular-nums text-slate-400">{fmtMoney(r.electricity.min, 0)}</td>
                  <td className={`border-b border-line/60 px-3 py-3 text-right font-semibold tabular-nums ${isEnd ? "text-teal-300" : "text-white"}`}>{fmtMoney(r.electricity.avg, 0)}</td>
                  <td className="border-b border-line/60 px-3 py-3 text-right tabular-nums text-slate-400">{fmtMoney(r.electricity.max, 0)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Assumptions panel                                                   */
/* ------------------------------------------------------------------ */

function AssumptionsPanel() {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-line bg-ink-850/60">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors duration-200 hover:bg-white/[0.03] sm:px-7"
      >
        <span>
          <span className="block font-display text-base font-semibold text-white">
            Underlying assumptions
          </span>
          <span className="mt-0.5 block text-xs text-slate-500">
            Base trend + volatility bands + factor adjustments — the simple model behind every number
          </span>
        </span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-300 ${open ? "rotate-180 text-teal-300" : ""}`}
        />
      </button>

      <div
        className="grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="space-y-6 border-t border-line px-6 py-6 sm:px-7">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-line bg-ink-900/70 p-5">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                  Model formula
                </p>
                <pre className="mt-3 overflow-x-auto rounded-lg bg-ink-950/80 p-4 font-mono text-[12.5px] leading-relaxed text-teal-200/90">
{`avg(t) = base · (1 + CAGR)^t
       · (1 + Σ drift_i · relevance_i(t) · t/10)

band(t) = avg(t) · (1 ± σ · √t · ${BAND_SCALE})`}
                </pre>
                <p className="mt-3 text-xs leading-relaxed text-slate-500">
                  The average path compounds a historical-growth trend, then bends it with the
                  signed drift of each active driver. Uncertainty widens with the square root of
                  time — the classic forecast cone.
                </p>
              </div>

              <div className="rounded-xl border border-line bg-ink-900/70 p-5">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                  Calibration parameters
                </p>
                <table className="mt-3 w-full text-xs">
                  <thead>
                    <tr className="text-left text-[10px] uppercase tracking-widest text-slate-600">
                      <th className="pb-2 font-medium">Parameter</th>
                      <th className="pb-2 text-right font-medium text-oil">Brent</th>
                      <th className="pb-2 text-right font-medium text-elec">Electricity</th>
                    </tr>
                  </thead>
                  <tbody className="tabular-nums text-slate-300">
                    <tr className="border-t border-line/60">
                      <td className="py-2 text-slate-400">Base price ({START_YEAR})</td>
                      <td className="py-2 text-right">{fmtMoney(COMMODITIES[0].basePrice, 1)}</td>
                      <td className="py-2 text-right">{fmtMoney(COMMODITIES[1].basePrice, 0)}</td>
                    </tr>
                    <tr className="border-t border-line/60">
                      <td className="py-2 text-slate-400">Trend (CAGR)</td>
                      <td className="py-2 text-right">{(COMMODITIES[0].cagr * 100).toFixed(1)}%</td>
                      <td className="py-2 text-right">{(COMMODITIES[1].cagr * 100).toFixed(1)}%</td>
                    </tr>
                    <tr className="border-t border-line/60">
                      <td className="py-2 text-slate-400">Annual volatility (σ)</td>
                      <td className="py-2 text-right">{(COMMODITIES[0].volatility * 100).toFixed(0)}%</td>
                      <td className="py-2 text-right">{(COMMODITIES[1].volatility * 100).toFixed(0)}%</td>
                    </tr>
                    <tr className="border-t border-line/60">
                      <td className="py-2 text-slate-400">Active drivers</td>
                      <td className="py-2 text-right">
                        {FACTORS.filter((f) => f.appliesTo !== "electricity").length}
                      </td>
                      <td className="py-2 text-right">
                        {FACTORS.filter((f) => f.appliesTo !== "oil").length}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {FACTORS.map((f) => {
                const oilActive = f.appliesTo !== "electricity" && f.drift.oil !== 0;
                const elecActive = f.appliesTo !== "oil" && f.drift.electricity !== 0;
                return (
                  <span
                    key={f.id}
                    className="inline-flex items-center gap-2 rounded-lg border border-line bg-ink-900/60 px-3 py-1.5 text-[11px] text-slate-400"
                  >
                    <span className="font-medium text-slate-300">{f.name}</span>
                    <span className="flex gap-1">
                      {oilActive && <span className="rounded bg-oil/15 px-1.5 py-0.5 font-semibold text-oil">OIL</span>}
                      {elecActive && <span className="rounded bg-teal-400/15 px-1.5 py-0.5 font-semibold text-elec">ELEC</span>}
                    </span>
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main section                                                        */
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
  const [lastUpdated, setLastUpdated] = useState(() => new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);
  const [view, setView] = useState<View>("all");
  const [exportingPng, setExportingPng] = useState(false);
  const chartRef = useRef<HTMLDivElement | null>(null);

  /* live ticker — subtle nudge + timestamp every 5s */
  useEffect(() => {
    const id = setInterval(() => {
      setLive(liveNudge());
      setLastUpdated(new Date());
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const rows = useMemo(
    () => buildForecast(horizon, seed, live),
    [horizon, seed, live],
  );

  const refresh = useCallback(() => {
    setRefreshing(true);
    setSeed(randomSeed());
    setLastUpdated(new Date());
    setRefreshCount((c) => c + 1);
    window.setTimeout(() => setRefreshing(false), 750);
  }, []);

  const exportCsv = useCallback(() => {
    downloadTextFile(
      forecastToCsv(rows),
      `tecnoindicator-forecast-${START_YEAR}-${START_YEAR + horizon}.csv`,
    );
  }, [rows, horizon]);

  const exportPng = useCallback(async () => {
    if (!chartRef.current) return;
    setExportingPng(true);
    try {
      await exportChartAsPng(
        chartRef.current,
        `tecnoindicator-chart-${START_YEAR}-${START_YEAR + horizon}.png`,
        `TecnoIndicator — ${horizon}-Year Energy Price Forecast`,
        `Brent crude (USD/bbl) · Global electricity (USD/MWh) · ${START_YEAR}–${START_YEAR + horizon} · generated ${new Date().toUTCString()}`,
      );
    } finally {
      setExportingPng(false);
    }
  }, [horizon]);

  const endRow = rows[horizon];

  return (
    <section id="forecast" className="relative scroll-mt-24 py-20 sm:py-28">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 glow-teal" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-teal-300">
                Forecast Studio
              </p>
              <h2 className="balance mt-3 max-w-2xl font-display text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
                Run your own 10-year energy price scenario
              </h2>
              <p className="mt-3 max-w-2xl text-slate-400">
                Pick a horizon and the engine projects average, optimistic and pessimistic paths
                for both commodities — adjusted live by the drivers below.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-lg border border-line bg-ink-850/80 px-3.5 py-2.5 backdrop-blur-sm">
                <span className="pulse-dot h-2 w-2 rounded-full bg-teal-400" />
                <div className="leading-tight">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                    Updated
                  </p>
                  <p className="text-xs font-semibold text-slate-200 tabular-nums">
                    {fmtTime(lastUpdated)}
                  </p>
                </div>
              </div>
              <button
                onClick={refresh}
                className="inline-flex items-center gap-2 rounded-lg border border-line bg-ink-850/80 px-4 py-2.5 text-xs font-semibold text-slate-200 backdrop-blur-sm transition-all duration-200 hover:border-teal-400/40 hover:text-white active:scale-[0.97]"
                aria-label="Refresh data with a new market perturbation"
              >
                <RefreshCw key={refreshCount} className={`h-3.5 w-3.5 text-teal-300 ${refreshing ? "spin-once" : ""}`} />
                Refresh data
              </button>
            </div>
          </div>
        </Reveal>

        <Reveal delay={120} className="mt-8">
          <HorizonControl horizon={horizon} setHorizon={setHorizon} />
        </Reveal>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <CommodityCard
            cfg={COMMODITIES[0]}
            current={rows[0].oil}
            projected={endRow.oil}
            horizon={horizon}
            variant="oil"
            delay={0}
          />
          <CommodityCard
            cfg={COMMODITIES[1]}
            current={rows[0].electricity}
            projected={endRow.electricity}
            horizon={horizon}
            variant="elec"
            delay={120}
          />
        </div>

        <Reveal delay={150} className="mt-6">
          <PriceChart
            rows={rows}
            view={view}
            setView={setView}
            onExport={exportPng}
            exporting={exportingPng}
            chartRef={chartRef}
          />
        </Reveal>

        <Reveal delay={100} className="mt-6">
          <div
            key={exportPulse}
            className={`flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-ink-850/80 p-5 backdrop-blur-sm ${exportPulse > 0 ? "export-pulse" : ""}`}
          >
            <div>
              <h3 className="font-display text-lg font-semibold text-white">Full scenario table</h3>
              <p className="mt-1 text-xs text-slate-500">
                Every yearly point from {START_YEAR} to {START_YEAR + horizon} — export the dataset as CSV.
              </p>
            </div>
            <button
              onClick={exportCsv}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-400 px-4 py-2.5 text-xs font-semibold text-ink-950 shadow-[0_0_20px_rgba(45,212,191,0.3)] transition-all duration-200 hover:bg-teal-300 hover:shadow-[0_0_28px_rgba(45,212,191,0.5)] active:scale-[0.97]"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Download CSV
              <Download className="h-3 w-3 opacity-60" />
            </button>
          </div>
        </Reveal>

        <Reveal delay={80} className="mt-6">
          <ForecastTable rows={rows} horizon={horizon} />
        </Reveal>

        <Reveal delay={80} className="mt-6">
          <AssumptionsPanel />
        </Reveal>

        <Reveal delay={60} className="mt-6">
          <div
            className="flex items-start gap-3.5 rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] px-5 py-4"
            role="note"
          >
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
            <p className="text-sm leading-relaxed text-amber-100/80">
              <span className="font-semibold text-amber-200">Disclaimer.</span> These are
              illustrative forecasts based on historical trends and publicly known drivers. Real
              markets are influenced by unforeseen events — this tool is for exploration and
              education only. <span className="font-semibold">Not financial advice.</span>
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
